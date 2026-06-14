import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    console.error("Admin Fare Setting GET Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { appCost, driverCost, baseFare, distanceTiers } = body;

    const updated = await prisma.fareSetting.upsert({
      where: { id: 'global' },
      update: {
        appCost: parseFloat(appCost) || 0,
        driverCost: parseFloat(driverCost) || 0,
        baseFare: parseFloat(baseFare) || 0,
        distanceTiers: typeof distanceTiers === 'string' ? distanceTiers : JSON.stringify(distanceTiers)
      },
      create: {
        id: 'global',
        appCost: parseFloat(appCost) || 0,
        driverCost: parseFloat(driverCost) || 0,
        baseFare: parseFloat(baseFare) || 0,
        distanceTiers: typeof distanceTiers === 'string' ? distanceTiers : JSON.stringify(distanceTiers)
      }
    });

    return NextResponse.json({ success: true, fareSetting: updated });
  } catch (error) {
    console.error("Admin Fare Setting POST Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
