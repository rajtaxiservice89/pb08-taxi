import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

const ALLOWED_FIELDS = [
  'selfieUrl',
  'aadharFrontUrl',
  'aadharBackUrl',
  'drivingLicenseUrl',
  'carRegistrationDocUrl',
  'policeVerificationUrl'
];

export async function PATCH(request) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { driverId, fieldName, fileData } = await request.json();

    if (!driverId || !fieldName || !fileData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!ALLOWED_FIELDS.includes(fieldName)) {
      return NextResponse.json({ error: 'Invalid document field' }, { status: 400 });
    }

    const updatedDriver = await prisma.driverProfile.update({
      where: { id: driverId },
      data: {
        [fieldName]: fileData
      }
    });

    return NextResponse.json({ success: true, driver: updatedDriver });

  } catch (error) {
    console.error("Update document error:", error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}
