import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Helper function to send WhatsApp message via Render Microservice
async function sendWhatsAppNotification(phone, message) {
  try {
    const serverUrl = process.env.WHATSAPP_SERVER_URL || 'http://localhost:3001';
    const apiKey = process.env.WHATSAPP_API_KEY || 'raj-taxi-secret-key-123';
    
    // Send request but don't strictly wait for response to speed up API
    fetch(`${serverUrl}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({ phone, message })
    }).catch(err => console.error('WhatsApp background fetch error:', err.message));
  } catch (err) {
    console.error('WhatsApp notification error:', err);
  }
}

// POST: Create a new booking (public)
export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.customerName || !data.customerPhone || !data.pickup || !data.destination || !data.date || !data.time || !data.vehicleType || !data.passengers) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const booking = await prisma.booking.create({
      data: {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        pickup: data.pickup,
        pickupLat: data.pickupLat ? parseFloat(data.pickupLat) : null,
        pickupLng: data.pickupLng ? parseFloat(data.pickupLng) : null,
        destination: data.destination,
        destLat: data.destLat ? parseFloat(data.destLat) : null,
        destLng: data.destLng ? parseFloat(data.destLng) : null,
        date: data.date,
        time: data.time,
        vehicleType: data.vehicleType,
        passengers: data.passengers,
        notes: data.notes || null,
        estimatedFare: data.estimatedFare ? parseFloat(data.estimatedFare) : null,
        status: 'pending'
      }
    });

    let mapLink = '';
    if (booking.pickupLat && booking.pickupLng && booking.destLat && booking.destLng) {
       mapLink = `https://www.google.com/maps/dir/?api=1&origin=${booking.pickupLat},${booking.pickupLng}&destination=${booking.destLat},${booking.destLng}`;
    } else if (booking.pickupLat && booking.pickupLng) {
       mapLink = `https://www.google.com/maps/dir/?api=1&origin=${booking.pickupLat},${booking.pickupLng}&destination=${encodeURIComponent(booking.destination)}`;
    } else {
       const o = booking.pickup.toLowerCase().includes('current') ? '' : `&origin=${encodeURIComponent(booking.pickup)}`;
       mapLink = `https://www.google.com/maps/dir/?api=1${o}&destination=${encodeURIComponent(booking.destination)}`;
    }

    // Send WhatsApp to Admin (if ADMIN_PHONE is set in env)
    if (process.env.ADMIN_PHONE) {
      const adminMsg = `🚕 *New Booking Received!*\n\n*Name:* ${data.customerName}\n*Phone:* ${data.customerPhone}\n*Pickup:* ${data.pickup}\n*Drop:* ${data.destination}\n*Date:* ${data.date} at ${data.time}\n*Vehicle:* ${data.vehicleType}\n*Fare:* ₹${data.estimatedFare || 'TBD'}\n\n📍 *Map Location:*\n${mapLink}`;
      sendWhatsAppNotification(process.env.ADMIN_PHONE, adminMsg);
    }

    // Send WhatsApp to Customer
    const customerMsg = `Hello ${data.customerName},\n\nYour booking with *Raj Taxi* has been received! 🚕\n\n*Pickup:* ${data.pickup}\n*Drop:* ${data.destination}\n*Date & Time:* ${data.date} at ${data.time}\n\nWe will assign a driver shortly. Thank you!`;
    sendWhatsAppNotification(data.customerPhone, customerMsg);

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

// GET: Fetch all bookings (Admin only)
export async function GET(request) {
  try {
    // Authenticate using token
    const token = request.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      include: { assignedDriver: true }
    });

    return NextResponse.json({ success: true, bookings });
  } catch (error) {
    console.error("Fetch bookings error:", error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

// PATCH: Update booking status (Admin and Driver)
export async function PATCH(request) {
  try {
    const adminToken = request.cookies.get('admin_token')?.value;
    const driverToken = request.cookies.get('driver_token')?.value;
    
    let role = null;
    let driverId = null;

    if (adminToken) {
      const payload = await verifyToken(adminToken);
      if (payload && payload.role === 'admin') role = 'admin';
    } 
    
    if (!role && driverToken) {
      const payload = await verifyToken(driverToken);
      if (payload && payload.role === 'driver') {
        role = 'driver';
        driverId = payload.id;
      }
    }

    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status, assignedDriverId, waDriverStatus, waCustomerStatus } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    if (role === 'driver') {
      const booking = await prisma.booking.findUnique({ where: { id } });
      if (!booking || booking.assignedDriverId !== driverId) {
        return NextResponse.json({ error: 'Unauthorized to modify this booking' }, { status: 403 });
      }
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: { status }
      });
      return NextResponse.json({ success: true, booking: updatedBooking });
    }

    // Admin flow
    const updateData = {};
    if (status) updateData.status = status;
    if (assignedDriverId) updateData.assignedDriverId = assignedDriverId;
    if (waDriverStatus) updateData.waDriverStatus = waDriverStatus;
    if (waCustomerStatus) updateData.waCustomerStatus = waCustomerStatus;

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: { assignedDriver: true }
    });

    // Notify Driver if newly assigned
    if (assignedDriverId && updatedBooking.assignedDriver) {
      let mapLink = '';
      if (updatedBooking.pickupLat && updatedBooking.pickupLng && updatedBooking.destLat && updatedBooking.destLng) {
         mapLink = `https://www.google.com/maps/dir/?api=1&origin=${updatedBooking.pickupLat},${updatedBooking.pickupLng}&destination=${updatedBooking.destLat},${updatedBooking.destLng}`;
      } else if (updatedBooking.pickupLat && updatedBooking.pickupLng) {
         mapLink = `https://www.google.com/maps/dir/?api=1&origin=${updatedBooking.pickupLat},${updatedBooking.pickupLng}&destination=${encodeURIComponent(updatedBooking.destination)}`;
      } else {
         const o = updatedBooking.pickup.toLowerCase().includes('current') ? '' : `&origin=${encodeURIComponent(updatedBooking.pickup)}`;
         mapLink = `https://www.google.com/maps/dir/?api=1${o}&destination=${encodeURIComponent(updatedBooking.destination)}`;
      }

      const dMsg = `🚕 *New Trip Assigned!*\n\n*Pickup:* ${updatedBooking.pickup}\n*Drop:* ${updatedBooking.destination}\n*Date & Time:* ${updatedBooking.date} at ${updatedBooking.time}\n*Customer:* ${updatedBooking.customerName} (${updatedBooking.customerPhone})\n\n📍 *Map Navigation:*\n${mapLink}`;
      sendWhatsAppNotification(updatedBooking.assignedDriver.phone, dMsg);
    }

    // Notify Customer if status changed
    if (status === 'confirmed' && updatedBooking.assignedDriver) {
      const cMsg = `Hello ${updatedBooking.customerName},\n\nYour Raj Taxi booking is *Confirmed*! 🚕\n\n*Driver:* ${updatedBooking.assignedDriver.name}\n*Vehicle:* ${updatedBooking.assignedDriver.vehicleNumber}\n*Driver Phone:* ${updatedBooking.assignedDriver.phone}\n\nHave a safe trip!`;
      sendWhatsAppNotification(updatedBooking.customerPhone, cMsg);
    } else if (status === 'completed') {
      const cMsg = `Hello ${updatedBooking.customerName},\n\nYour trip has been completed. Thank you for choosing Raj Taxi! 🚕`;
      sendWhatsAppNotification(updatedBooking.customerPhone, cMsg);
    } else if (status === 'cancelled') {
      const cMsg = `Hello ${updatedBooking.customerName},\n\nYour booking with Raj Taxi has been cancelled. Please contact us for more info.`;
      sendWhatsAppNotification(updatedBooking.customerPhone, cMsg);
    }

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}

// DELETE: Delete bulk bookings (Admin only)
export async function DELETE(request) {
  try {
    const adminToken = request.cookies.get('admin_token')?.value;
    if (!adminToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(adminToken);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ids, deleteAll } = await request.json();
    
    if (deleteAll) {
      if (ids && ids.length > 0) {
        await prisma.booking.deleteMany({
          where: { id: { in: ids } }
        });
      } else {
        await prisma.booking.deleteMany();
      }
    } else if (ids && ids.length > 0) {
      await prisma.booking.deleteMany({
        where: { id: { in: ids } }
      });
    } else {
      return NextResponse.json({ error: 'No bookings selected' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Bookings deleted successfully' });
  } catch (error) {
    console.error("Delete bookings error:", error);
    return NextResponse.json({ error: 'Failed to delete bookings' }, { status: 500 });
  }
}
