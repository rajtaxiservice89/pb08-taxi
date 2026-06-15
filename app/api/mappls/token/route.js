import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const activeApi = await prisma.locationApi.findFirst({
      where: { isActive: true, provider: 'mappls' }
    });

    if (!activeApi || !activeApi.apiKey) {
      return NextResponse.json({ error: 'Mappls API is not configured or active' }, { status: 400 });
    }

    // Since Mappls uses a single Static Key now, we just return it directly!
    return NextResponse.json({ access_token: activeApi.apiKey });

  } catch (error) {
    console.error("Mappls Token API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
