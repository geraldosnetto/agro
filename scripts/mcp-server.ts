
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

// Configurar Prisma (mesma logica do seed)
const connectionString = process.env.DATABASE_URL!
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const server = new Server(
    {
        name: "agro-prisma-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
            resources: {},
        },
    }
);

// Listar Tabelas como Resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    // Introspecção simples (tabelas fixas ou dinamicas se possivel)
    // Prisma não expõe metadados de runtime facilmente sem DMMF, vou listar hardcoded por enquanto
    const tables = ['Commodity', 'Cotacao', 'Alerta', 'AtualizacaoLog', 'CotacaoDolar'];

    return {
        resources: tables.map(t => ({
            uri: `postgres://tables/${t}`,
            name: `Table: ${t}`,
            mimeType: "application/json",
            description: `Conteúdo da tabela ${t}`
        }))
    };
});

// Ler Conteúdo da Tabela
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const url = new URL(request.params.uri);
    const tableName = url.pathname.split("/").pop();

    if (!tableName) throw new Error("Table name not found");

    // @ts-expect-error - Dynamic access for Prisma model delegates
    const delegate = prisma[tableName.charAt(0).toLowerCase() + tableName.slice(1)];

    if (!delegate) throw new Error(`Table ${tableName} not found in Prisma Client`);

    const data = await delegate.findMany({ take: 100 }); // Limit 100

    return {
        contents: [{
            uri: request.params.uri,
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2)
        }]
    };
});

// Ferramentas
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "query_database",
                description: "Executa uma query SQL READ-ONLY no banco de dados via Prisma $queryRaw",
                inputSchema: {
                    type: "object",
                    properties: {
                        sql: {
                            type: "string",
                            description: "Query SQL (SELECT apenas)",
                        },
                    },
                    required: ["sql"],
                },
            },
            {
                name: "get_schema",
                description: "Retorna o schema do banco de dados (DDL)",
                inputSchema: { type: "object", properties: {}, required: [] }
            }
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "query_database") {
        const sql = String(request.params.arguments?.sql);

        if (!sql.trim().toUpperCase().startsWith("SELECT")) {
            throw new Error("Only SELECT queries are allowed for safety");
        }

        try {
            const result = await prisma.$queryRawUnsafe(sql);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
                isError: true,
            };
        }
    }

    if (request.params.name === "get_schema") {
        // Simplificado: retorna lista de tabelas
        const result = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
        return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
    }

    throw new Error("Tool not found");
});

async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Agro Prisma MCP Server running on stdio");
}

run().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});
