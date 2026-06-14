import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  return !!token;
}

export async function GET() {
  if (!(await checkAdminAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const apis = await prisma.locationApi.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(apis);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch APIs' }, { status: 500 });
  }
}

export async function POST(req) {
  if (!(await checkAdminAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const body = await req.json();
    const { provider, apiKey } = body;
    
    if (!provider || !apiKey) {
      return NextResponse.json({ error: 'Provider and API Key are required' }, { status: 400 });
    }

    const count = await prisma.locationApi.count();
    
    const newApi = await prisma.locationApi.create({
      data: {
        provider,
        apiKey,
        isActive: count === 0 // Make active if it's the first one
      }
    });

    return NextResponse.json(newApi);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create API' }, { status: 500 });
  }
}

export async function PUT(req) {
  if (!(await checkAdminAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const body = await req.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'API ID is required' }, { status: 400 });
    }

    // Set all to inactive
    await prisma.locationApi.updateMany({
      data: { isActive: false }
    });

    // Set the selected one to active
    const updated = await prisma.locationApi.update({
      where: { id },
      data: { isActive: true }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to set active API' }, { status: 500 });
  }
}

export async function DELETE(req) {
  if (!(await checkAdminAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'API ID is required' }, { status: 400 });
    }

    await prisma.locationApi.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete API' }, { status: 500 });
  }
}
