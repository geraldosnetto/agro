import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
export const maxDuration = 60; // 1 minute max duration for upload processing

export async function POST(req: Request) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        console.log("Podcast Upload Started...");
        const formData = await req.formData();
        console.log("Form Data Parsed.");
        const file = formData.get("file") as File;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;

        if (!file || !title) {
            console.log("Missing fields in formData:", { file: !!file, title: !!title });
            return NextResponse.json({ error: "Missing file or title" }, { status: 400 });
        }

        console.log(`File received: ${file.name}, size: ${file.size} bytes`);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const filename = `agrocast-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

        // In standalone mode, we must save to the `.next/standalone/public/podcasts` OR bind a persistent volume.
        // During dev/normal build, `process.cwd()/public/podcasts` works. Let's try to map dynamically.
        const dir = join(process.cwd(), "public", "podcasts");
        console.log(`Saving to directory: ${dir}`);

        await mkdir(dir, { recursive: true });
        const filePath = join(dir, filename);

        await writeFile(filePath, buffer);
        console.log(`File saved successfully sequentially at ${filePath}`);

        const episode = await prisma.podcastEpisode.create({
            data: {
                title,
                description: description || "Resumo semanal do mercado agropecuário.",
                audioUrl: `/podcasts/${filename}`,
            }
        });
        console.log("Prisma Record Created: ", episode.id);

        // Explicitly clear the Next.js cache for the podcast page
        revalidatePath("/podcast");

        return NextResponse.json(episode);
    } catch (error) {
        console.error("Error uploading podcast:", error);
        return NextResponse.json({ error: "Error uploading file", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}
