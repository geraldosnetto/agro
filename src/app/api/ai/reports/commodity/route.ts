import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { listCommodityReports } from '@/lib/ai/generators/commodity-report';

export async function GET() {
  try {
    // 1. Autenticação
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Autenticação necessária', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // 2. Listar commodities e status dos relatórios
    const commodities = await listCommodityReports();

    return NextResponse.json({ commodities });
  } catch (error) {
    console.error('List commodity reports error:', error);
    return NextResponse.json(
      { error: 'Erro ao listar relatórios', code: 'API_ERROR' },
      { status: 500 }
    );
  }
}
