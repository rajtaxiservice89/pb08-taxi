import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET: Fetch current site settings (public)
export async function GET() {
  try {
    let settings = await prisma.siteSetting.findFirst();
    
    // If no settings exist yet, create default
    if (!settings) {
      settings = await prisma.siteSetting.create({
        data: {
          heroTitle: "Ride into the Destination",
          heroText: "Experience next-generation comfort and safety. From city commutes to outstation trips, we provide a seamless journey tailored for you.",
          phone1: "9056273306",
          phone2: "9888079736",
          email: "info@pb08taxi.com",
          address: "Main Street, City Center, Jalandhar, Punjab",
          whatsapp1: "9056273306",
          whatsapp2: "9888079736",
          secretPin: "333725",
          showAdminLoginInHeader: true
        }
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Fetch settings error:", error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT: Update site settings (Admin only)
export async function PUT(request) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    let settings = await prisma.siteSetting.findFirst();
    
    if (settings) {
      settings = await prisma.siteSetting.update({
        where: { id: settings.id },
        data
      });
    } else {
      settings = await prisma.siteSetting.create({ data });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
