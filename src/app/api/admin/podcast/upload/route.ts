import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(req: Request) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;

        if (!file || !title) {
            return NextResponse.json({ error: "Missing file or title" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const filename = `agrocast-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const dir = join(process.cwd(), "public", "podcasts");

        await mkdir(dir, { recursive: true });
        const filePath = join(dir, filename);

        await writeFile(filePath, buffer);

        const episode = await prisma.podcastEpisode.create({
            data: {
                title,
                description: description || "Resumo semanal do mercado agropecuário.",
                audioUrl: `/podcasts/${filename}`,
            }
        });

        return NextResponse.json(episode);
    } catch (error) {
        console.error("Error uploading podcast:", error);
        return NextResponse.json({ error: "Error uploading file" }, { status: 500 });
    }
}
