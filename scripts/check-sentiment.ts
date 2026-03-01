import prisma from '../src/lib/prisma';
import type { NewsSentiment } from '@prisma/client';

async function main() {
  const sentiments = await prisma.newsSentiment.findMany({
    orderBy: { analyzedAt: 'desc' },
    take: 20
  });

  console.log('=== Sentimentos Analisados ===');
  console.log('Total:', sentiments.length);

  const allCommodities = new Set<string>();
  sentiments.forEach((s: NewsSentiment) => {
    s.commodities.forEach((c: string) => allCommodities.add(c));
  });

  console.log('\nCommodities detectadas:', Array.from(allCommodities).join(', ') || 'nenhuma');

  sentiments.slice(0, 5).forEach((s: NewsSentiment) => {
    const title = s.newsTitle.length > 70 ? s.newsTitle.substring(0, 70) + '...' : s.newsTitle;
    console.log('\n[' + s.sentiment + '] ' + title);
    console.log('  -> ' + (s.commodities.join(', ') || 'nenhuma commodity'));
  });
}

main().then(() => prisma.$disconnect());
