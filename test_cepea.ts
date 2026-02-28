import { fetchCepeaSpotPrice } from './src/lib/data-sources/cepea';

async function main() {
    const slugs = [
        'feijao-carioca',
        'feijao-preto',
        'leite',
        'mandioca',
        'ovos',
        'tilapia'
    ];

    for (const slug of slugs) {
        console.log(`\nFetching ${slug}...`);
        const result = await fetchCepeaSpotPrice(slug);
        console.log(`Result for ${slug}:`, result);
    }
}

main().catch(console.error);
