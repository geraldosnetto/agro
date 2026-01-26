import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const client = await pool.connect();
    try {
        // Count total cotacoes
        const countRes = await client.query('SELECT COUNT(*) as total FROM "Cotacao"');
        console.log('Total cotações:', countRes.rows[0].total);

        // Date range
        const rangeRes = await client.query('SELECT MIN("dataReferencia") as oldest, MAX("dataReferencia") as newest FROM "Cotacao"');
        console.log('Mais antiga:', rangeRes.rows[0].oldest);
        console.log('Mais recente:', rangeRes.rows[0].newest);

        // By praca
        const pracaRes = await client.query('SELECT praca, COUNT(*) as cnt FROM "Cotacao" GROUP BY praca ORDER BY cnt DESC');
        console.log('\nPor praça:');
        for (const r of pracaRes.rows) {
            console.log('  ' + r.praca + ': ' + r.cnt);
        }

        // Sample for boi-gordo
        const sampleRes = await client.query(`
            SELECT c."dataReferencia", c.valor, c.praca
            FROM "Cotacao" c
            JOIN "Commodity" cm ON c."commodityId" = cm.id
            WHERE cm.slug = 'boi-gordo'
            ORDER BY c."dataReferencia" DESC
            LIMIT 10
        `);
        console.log('\nÚltimas 10 cotações boi-gordo:');
        for (const r of sampleRes.rows) {
            const dateStr = r.dataReferencia.toISOString().split('T')[0];
            console.log('  ' + dateStr + ': R$ ' + r.valor + ' (' + r.praca + ')');
        }

    } finally {
        client.release();
        await pool.end();
    }
}
main().catch(console.error);
