import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const client = await pool.connect();
    try {
        // Get all boi-gordo cotacoes
        const res = await client.query(`
            SELECT c."dataReferencia", c.valor, c.praca
            FROM "Cotacao" c
            JOIN "Commodity" cm ON c."commodityId" = cm.id
            WHERE cm.slug = 'boi-gordo'
            ORDER BY c."dataReferencia" ASC
        `);

        console.log('Total cotações boi-gordo:', res.rows.length);
        console.log('\nTodas as cotações:');
        for (const r of res.rows) {
            const dateStr = r.dataReferencia.toISOString().split('T')[0];
            console.log('  ' + dateStr + ': R$ ' + r.valor + ' (' + r.praca + ')');
        }

    } finally {
        client.release();
        await pool.end();
    }
}
main().catch(console.error);
