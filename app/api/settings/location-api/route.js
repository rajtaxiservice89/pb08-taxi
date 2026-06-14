import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const activeApi = await prisma.locationApi.findFirst({
      where: { isActive: true }
    });
    
    if (!activeApi) {
      // Fallback to nominatim without API key if nothing is configured
      return NextResponse.json({ provider: 'nominatim', apiKey: '' });
    }

    return NextResponse.json(activeApi);
  } catch (error) {
    // Graceful fallback
    return NextResponse.json({ provider: 'nominatim', apiKey: '' });
  }
}
