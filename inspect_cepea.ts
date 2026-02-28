import { JSDOM } from 'jsdom';
import { fetchCepeaSpotPrice } from './src/lib/data-sources/cepea';

const FLARESOLVERR_URL = process.env.FLARESOLVERR_URL || 'http://localhost:8191/v1';

async function fetchHtmlViaFlare(url: string): Promise<string | null> {
    try {
        const flareResponse = await fetch(FLARESOLVERR_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cmd: 'request.get', url, maxTimeout: 60000 }),
            signal: AbortSignal.timeout(90000),
        });

        if (flareResponse.ok) {
            const data = await flareResponse.json();
            return data.status === 'ok' ? data.solution?.response : null;
        }
    } catch (e) { console.error(e); }
    return null;
}

const urls = [
    { slug: 'feijao', url: 'https://www.cepea.org.br/br/indicador/feijao.aspx' },
    { slug: 'ovos', url: 'https://www.cepea.org.br/br/indicador/ovos.aspx' },
    { slug: 'tilapia', url: 'https://www.cepea.org.br/br/indicador/tilapia.aspx' }
];

async function main() {
    for (const item of urls) {
        console.log(`\n\n--- ${item.slug.toUpperCase()} ---`);
        const html = await fetchHtmlViaFlare(item.url);
        if (!html) continue;
        const dom = new JSDOM(html);
        const tables = dom.window.document.querySelectorAll('table');
        console.log(`Found ${tables.length} tables`);
        tables.forEach((table, i) => {
            console.log(`\nTable ${i}: Text preview:`, table.textContent?.substring(0, 100).replace(/\s+/g, ' '));
            const tr = table.querySelector('tbody tr');
            if (tr) {
                const tds = Array.from(tr.querySelectorAll('td')).map(td => td.textContent?.trim());
                console.log(`First data row cols:`, tds);
            }
        });
    }
}
main().catch(console.error);
