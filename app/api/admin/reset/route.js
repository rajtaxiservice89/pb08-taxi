import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(req) {
  try {
    const { secretPin, newUsername, newPassword } = await req.json();

    if (!secretPin || !newUsername || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the global site settings to check the pin
    let settings = await prisma.siteSetting.findUnique({ where: { id: 'global' } });
    const actualPin = settings ? settings.secretPin : '333725';

    if (secretPin !== actualPin) {
      return NextResponse.json({ error: 'Invalid Secret PIN' }, { status: 401 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Delete all existing admins
    await prisma.admin.deleteMany();

    // Create the new admin
    await prisma.admin.create({
      data: {
        username: newUsername,
        password: hashedPassword,
      }
    });

    return NextResponse.json({ success: true, message: 'Admin credentials reset successfully' });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
