import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { phone, password } = await request.json();

    if (!phone || !password) {
      return NextResponse.json({ error: 'Phone and password required' }, { status: 400 });
    }

    // 'contact' is used as the login ID/phone
    const driver = await prisma.driverProfile.findUnique({ where: { contact: phone } });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 401 });
    }

    if (driver.status !== 'approved') {
      return NextResponse.json({ error: 'Your account is pending approval or suspended.' }, { status: 403 });
    }

    if (driver.password !== password) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const token = await signToken({ id: driver.id, role: 'driver', name: driver.name });

    const response = NextResponse.json({ success: true, message: 'Login successful' });
    
    // Set HTTP-only cookie
    response.cookies.set({
      name: 'driver_token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error) {
    console.error("Driver login error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
