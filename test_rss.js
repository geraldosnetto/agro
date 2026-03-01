import Parser from 'rss-parser';

const parser = new Parser({
    timeout: 10000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
});

const feedsToTest = [
    "https://www.agrolink.com.br/rss/noticias.xml",
    "https://www.comprerural.com/feed/",
    "https://suisite.com.br/feed/",
    "https://avisite.com.br/feed/",
    "https://ovosite.com.br/feed/",
    "https://planetaarroz.com.br/feed/",
    "https://agnocafe.com.br/feed/",
    "https://www.aquaculturebrasil.com.br/feed/",
    "https://agrimidia.com.br/feed/",
    "https://www.beefpoint.com.br/feed/",
    "https://www.portaldbo.com.br/feed/",
    "https://revistacafeicultura.com.br/feed/",
    "https://www.jornalcana.com.br/feed/",
    "https://noticiasagricolas.com.br/rss",
    "https://www.milkpoint.com.br/rss",
    "https://www.milkpoint.com.br/feed",
    "https://www.novacana.com/rss",
    "https://revistacultivar.com.br/rss",
    "https://theagribiz.com/feed/",
    "https://www.peixebr.com.br/feed/"
];

async function run() {
    for (const feed of feedsToTest) {
        try {
            console.log(`Testing: ${feed}`);
            const data = await parser.parseURL(feed);
            console.log(`[SUCCESS] ${feed} -> Found ${data.items.length} items`);
        } catch (error) {
            console.log(`[ERROR] ${feed} -> ${error.message}`);
        }
    }
}
run();
