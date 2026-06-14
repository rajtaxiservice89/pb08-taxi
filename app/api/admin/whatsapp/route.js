import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    // Authenticate using token
    const token = request.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serverUrl = process.env.WHATSAPP_SERVER_URL || 'http://localhost:3001';
    
    const res = await fetch(`${serverUrl}/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`WhatsApp server responded with status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("Fetch WhatsApp status error:", error);
    return NextResponse.json({ error: 'Failed to fetch WhatsApp status. Is the WhatsApp Server running?' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Authenticate using token
    const token = request.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serverUrl = process.env.WHATSAPP_SERVER_URL || 'http://localhost:3001';
    const apiKey = process.env.WHATSAPP_API_KEY || 'raj-taxi-secret-key-123';
    
    const body = await request.json();
    const { action } = body;

    if (action === 'logout') {
      const res = await fetch(`${serverUrl}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        }
      });

      if (!res.ok) {
        throw new Error(`WhatsApp server responded with status: ${res.status}`);
      }
      
      const data = await res.json();
      return NextResponse.json({ success: true, ...data });
    } else if (action === 'send') {
      const { phone, message, bookingId, targetType } = body;
      const res = await fetch(`${serverUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ phone, message })
      });

      const data = await res.json();
      const success = res.ok && data.success;

      if (bookingId && targetType) {
        if (targetType === 'driver_approval') {
          await prisma.driverProfile.update({
            where: { id: bookingId }, // bookingId holds the driver ID here
            data: { waApprovalStatus: success ? 'success' : 'error' }
          }).catch(err => console.error("Failed to update driver WA status in DB:", err));
        } else {
          const updateField = targetType === 'driver' ? 'waDriverStatus' : 'waCustomerStatus';
          await prisma.booking.update({
            where: { id: bookingId },
            data: { [updateField]: success ? 'success' : 'error' }
          }).catch(err => console.error("Failed to update booking WA status in DB:", err));
        }
      }

      if (!res.ok) {
        return NextResponse.json({ error: data.error || 'Failed to send message' }, { status: res.status });
      }
      
      return NextResponse.json({ success: true, ...data });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error("WhatsApp action error:", error);
    return NextResponse.json({ error: 'Failed to perform WhatsApp action' }, { status: 500 });
  }
}
