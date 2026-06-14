import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const { currentPin, newPin } = await req.json();

    if (!currentPin || !newPin) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let settings = await prisma.siteSetting.findUnique({ where: { id: 'global' } });
    const actualPin = settings ? settings.secretPin : '333725';

    if (currentPin !== actualPin) {
      return NextResponse.json({ error: 'Invalid current PIN' }, { status: 401 });
    }

    // Update PIN
    await prisma.siteSetting.upsert({
      where: { id: 'global' },
      update: { secretPin: newPin },
      create: { id: 'global', secretPin: newPin }
    });

    return NextResponse.json({ success: true, message: 'Secret PIN updated successfully' });
  } catch (error) {
    console.error('Change PIN error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
