import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const { driverId, currentPassword, newPassword } = await req.json();

    if (!driverId || !currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const driver = await prisma.driverProfile.findUnique({
      where: { id: driverId }
    });

    if (!driver) {
      return NextResponse.json({ success: false, error: 'Driver not found' }, { status: 404 });
    }

    if (driver.password && driver.password !== currentPassword) {
      return NextResponse.json({ success: false, error: 'Incorrect current password' }, { status: 401 });
    }

    await prisma.driverProfile.update({
      where: { id: driverId },
      data: { password: newPassword }
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update password' }, { status: 500 });
  }
}
