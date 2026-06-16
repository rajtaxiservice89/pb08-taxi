import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const activeApi = await prisma.locationApi.findFirst({
      where: { isActive: true }
    });
    
    if (!activeApi) {
      return NextResponse.json({ provider: 'none', apiKey: '' });
    }

    return NextResponse.json(activeApi);
  } catch (error) {
    return NextResponse.json({ provider: 'none', apiKey: '' });
  }
}
