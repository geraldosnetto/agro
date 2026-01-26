import { JSDOM } from 'jsdom';

const url = 'https://www.cepea.org.br/br/indicador/suino.aspx';

async function debug() {
    console.log('Fetching:', url);

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        },
    });

    if (!response.ok) {
        console.error('HTTP Error:', response.status);
        return;
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const tables = doc.querySelectorAll('table');

    console.log('\nTotal tables found:', tables.length);

    for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        const rows = table.querySelectorAll('tbody tr');
        const headerText = table.previousElementSibling?.textContent?.trim().slice(0, 50) || 'N/A';

        console.log(`\n=== Table ${i} (${rows.length} rows) ===`);
        console.log('Context:', headerText);

        // Check if this table has 'Vivo' keyword
        const tableText = table.textContent || '';
        const hasVivo = tableText.toUpperCase().includes('VIVO');
        console.log('Contains "Vivo":', hasVivo);

        // Show first 3 rows
        let rowCount = 0;
        for (const row of Array.from(rows)) {
            if (rowCount >= 3) break;
            const cells = row.querySelectorAll('td');
            const cellTexts = Array.from(cells).map(c => c.textContent?.trim().slice(0, 20));
            console.log('  Row:', cellTexts.join(' | '));
            rowCount++;
        }
    }
}

debug().catch(console.error);
