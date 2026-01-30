
import { fetchAllNews } from '../src/lib/data-sources/news';

async function test() {
    console.log("Testing RSS Fetch...");
    try {
        const news = await fetchAllNews(50);
        console.log(`Fetched ${news.length} items.`);

        if (news.length === 0) {
            console.log("WARNING: No news fetched!");
        } else {
            console.log("Sample items:");
            news.slice(0, 3).forEach(n => console.log(`- [${n.source}] ${n.title}`));
        }
    } catch (error) {
        console.error("Fatal error:", error);
    }
}

test();
