import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    
    // In Phase 3, files will be uploaded to Vercel Blob and their URLs will be saved here.
    // For now, we assume body contains string URLs if files are handled externally, or we just save text info.
    
    const newDriver = await prisma.driverProfile.create({
      data: {
        name: body.name,
        contact: body.contact,
        address: body.address,
        aadharNumber: body.aadharNumber,
        licenseNumber: body.licenseNumber,
        carRegistration: body.carRegistration,
        chassisNumber: body.chassisNumber,
        carName: body.carName,
        selfieUrl: body.selfieUrl || null,
        aadharFrontUrl: body.aadharFrontUrl || null,
        aadharBackUrl: body.aadharBackUrl || null,
        drivingLicenseUrl: body.drivingLicenseUrl || null,
        carRegistrationDocUrl: body.carRegistrationDocUrl || null,
        policeVerificationUrl: body.policeVerificationUrl || null,
      },
    });

    return NextResponse.json({ message: 'Driver application submitted', driver: newDriver }, { status: 201 });
  } catch (error) {
    console.error('Driver Submission Error:', error);
    return NextResponse.json({ error: 'Failed to submit driver application' }, { status: 500 });
  }
}

export async function GET(request) {
  // TODO: Add authentication check here so only Admin can view drivers
  try {
    const drivers = await prisma.driverProfile.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ drivers }, { status: 200 });
  } catch (error) {
    console.error('Fetch Drivers Error:', error);
    return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 });
  }
}
