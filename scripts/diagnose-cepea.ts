
import { fetchCepeaSpotPrice } from '../src/lib/data-sources/cepea';

async function diagnose() {
    const problematicSlugs = ['trigo', 'suino', 'frango', 'etanol-anidro', 'acucar-cristal'];

    console.log("=== INICIANDO DIAGNÓSTICO CEPEA ===");

    for (const slug of problematicSlugs) {
        console.log(`\nTesting: ${slug}`);
        try {
            const result = await fetchCepeaSpotPrice(slug);
            if (result) {
                console.log(`✅ SUCCESS [${slug}]:`, result);
            } else {
                console.log(`❌ FAILED [${slug}]: Retornou null`);
            }
        } catch (error) {
            console.error(`💥 ERROR [${slug}]:`, error);
        }
    }
}

diagnose();
