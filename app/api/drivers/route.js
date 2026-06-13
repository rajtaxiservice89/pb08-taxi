import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// POST: Register a new driver application (public)
export async function POST(request) {
  try {
    const data = await request.json();
    
    if (!data.name || !data.phone || !data.vehicleModel) {
      return NextResponse.json({ error: 'Name, phone, and vehicle model are required' }, { status: 400 });
    }

    const driver = await prisma.driverProfile.create({
      data: {
        name: data.name,
        phone: data.phone,
        vehicleModel: data.vehicleModel,
        vehicleNo: data.vehicleNo || null,
        experience: data.experience || null,
        status: 'pending'
      }
    });

    return NextResponse.json({ success: true, driver });
  } catch (error) {
    console.error("Driver registration error:", error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}

// GET: Fetch all drivers (Admin only)
export async function GET(request) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const drivers = await prisma.driverProfile.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, drivers });
  } catch (error) {
    console.error("Fetch drivers error:", error);
    return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 });
  }
}

// PATCH: Update driver status (Admin only)
export async function PATCH(request) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status } = await request.json();
    if (!id || !status) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const updatedDriver = await prisma.driverProfile.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ success: true, driver: updatedDriver });
  } catch (error) {
    console.error("Update driver error:", error);
    return NextResponse.json({ error: 'Failed to update driver' }, { status: 500 });
  }
}
