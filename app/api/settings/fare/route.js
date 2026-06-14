import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    let fareSetting = await prisma.fareSetting.findUnique({
      where: { id: 'global' }
    });

    if (!fareSetting) {
      fareSetting = await prisma.fareSetting.create({
        data: {
          id: 'global',
          appCost: 50,
          driverCost: 50,
          baseFare: 50,
          distanceTiers: '[{"min": 0, "max": 5, "rate": 20}, {"min": 5, "max": 9999, "rate": 15}]'
        }
      });
    }

    return NextResponse.json({ fareSetting });
  } catch (error) {
    console.error("Public Fare Setting GET Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
