import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// POST: Register a new driver application (public or admin)
export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validate required fields based on new schema
    if (!data.name || !data.contact || !data.address || !data.aadharNumber || !data.licenseNumber || !data.carRegistration || !data.chassisNumber || !data.carName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const driver = await prisma.driverProfile.create({
      data: {
        name: data.name,
        contact: data.contact,
        password: data.password || null,
        address: data.address,
        aadharNumber: data.aadharNumber,
        licenseNumber: data.licenseNumber,
        carRegistration: data.carRegistration,
        chassisNumber: data.chassisNumber,
        carName: data.carName,
        status: data.status || 'pending',
        createdBy: data.createdBy || 'driver',
        selfieUrl: data.selfieUrl || null,
        aadharFrontUrl: data.aadharFrontUrl || null,
        aadharBackUrl: data.aadharBackUrl || null,
        drivingLicenseUrl: data.drivingLicenseUrl || null,
        carRegistrationDocUrl: data.carRegistrationDocUrl || null,
        policeVerificationUrl: data.policeVerificationUrl || null
      }
    });

    return NextResponse.json({ success: true, driver });
  } catch (error) {
    console.error("Driver registration error:", error);
    // Handle unique constraint failures (P2002)
    if (error.code === 'P2002') {
        const target = error.meta?.target?.[0] || 'field';
        return NextResponse.json({ error: `A driver with this ${target} already exists.` }, { status: 400 });
    }
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

// PATCH: Update driver details or status (Admin only)
export async function PATCH(request) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, ...updateData } = await request.json();
    if (!id) return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 });

    const updatedDriver = await prisma.driverProfile.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, driver: updatedDriver });
  } catch (error) {
    console.error("Update driver error:", error);
    if (error.code === 'P2002') {
        const target = error.meta?.target?.[0] || 'field';
        return NextResponse.json({ error: `A driver with this ${target} already exists.` }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update driver' }, { status: 500 });
  }
}

// DELETE: Delete a driver (Admin only)
export async function DELETE(request) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 });

    await prisma.driverProfile.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete driver error:", error);
    return NextResponse.json({ error: 'Failed to delete driver' }, { status: 500 });
  }
}
