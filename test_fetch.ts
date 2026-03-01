import { fetchAllNews, fetchNewsForCommodity } from './src/lib/data-sources/news';

async function run() {
    console.log("Testing fetchNewsForCommodity('soja')...");
    const start1 = Date.now();
    const sojaNews = await fetchNewsForCommodity('soja', 5);
    console.log(`Found ${sojaNews.length} soja news in ${Date.now() - start1}ms`);

    console.log("Testing fetchAllNews()...");
    const start2 = Date.now();
    const allNews = await fetchAllNews(5);
    console.log(`Found ${allNews.length} overall news in ${Date.now() - start2}ms`);
}
run();
