import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const driverIdParam = searchParams.get('driverId');
    
    let targetDriverId = null;

    if (driverIdParam) {
      // If a driverId is specified, the requester must be an admin
      const adminToken = request.cookies.get('admin_token')?.value;
      if (!adminToken) {
        return NextResponse.json({ error: 'Unauthorized. Admin access required to view other drivers.' }, { status: 401 });
      }
      
      const payload = await verifyToken(adminToken);
      if (!payload || payload.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
      }
      
      targetDriverId = driverIdParam;
    } else {
      // If no driverId is specified, it must be the logged-in driver themselves
      const driverToken = request.cookies.get('driver_token')?.value;
      if (!driverToken) {
        return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
      }
      
      const payload = await verifyToken(driverToken);
      if (!payload || payload.role !== 'driver') {
        return NextResponse.json({ error: 'Unauthorized. Driver access required.' }, { status: 401 });
      }
      
      targetDriverId = payload.id;
    }

    if (!targetDriverId) {
      return NextResponse.json({ error: 'Driver ID not resolved' }, { status: 400 });
    }

    // Fetch driver profile and their bookings
    const driver = await prisma.driverProfile.findUnique({
      where: { id: targetDriverId },
      include: {
        bookings: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Ensure we don't send sensitive data like passwords back to the client
    const safeDriverData = {
      id: driver.id,
      name: driver.name,
      contact: driver.contact,
      address: driver.address,
      carName: driver.carName,
      carRegistration: driver.carRegistration,
      status: driver.status,
      selfieUrl: driver.selfieUrl,
      createdAt: driver.createdAt,
      bookings: driver.bookings
    };

    return NextResponse.json({ success: true, driver: safeDriverData });
    
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
