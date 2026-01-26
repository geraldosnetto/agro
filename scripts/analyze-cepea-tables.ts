import { JSDOM } from 'jsdom';

const URLS = {
    'soja': 'https://www.cepea.org.br/br/indicador/soja.aspx',
    'milho': 'https://www.cepea.org.br/br/indicador/milho.aspx',
    'boi-gordo': 'https://www.cepea.org.br/br/indicador/boi-gordo.aspx',
};

async function analyzeTable() {
    for (const [slug, url] of Object.entries(URLS)) {
        console.log(`\n=== ${slug.toUpperCase()} ===`);
        console.log(`URL: ${url}\n`);

        try {
            const response = await fetch(url);
            const html = await response.text();
            const dom = new JSDOM(html);
            const doc = dom.window.document;

            const tables = doc.querySelectorAll('table');
            console.log(`Found ${tables.length} tables\n`);

            tables.forEach((table, tableIdx) => {
                const rows = table.querySelectorAll('tr');
                console.log(`Table #${tableIdx} (${rows.length} rows):`);

                // Show header
                const headerCells = rows[0]?.querySelectorAll('th, td');
                if (headerCells?.length) {
                    const headers = Array.from(headerCells).map(c => c.textContent?.trim());
                    console.log(`  Headers: ${headers.join(' | ')}`);
                }

                // Show first 3 data rows
                for (let i = 1; i < Math.min(rows.length, 4); i++) {
                    const cells = rows[i].querySelectorAll('td');
                    const values = Array.from(cells).map(c => c.textContent?.trim());
                    console.log(`  Row ${i}: ${values.join(' | ')}`);
                }
                console.log('');
            });
        } catch (error) {
            console.error(`Error fetching ${slug}:`, error);
        }
    }
}

analyzeTable();
