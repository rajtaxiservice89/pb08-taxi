import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const newBooking = await prisma.booking.create({
      data: {
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        pickup: body.pickup,
        pickupLat: body.pickupLat ? parseFloat(body.pickupLat) : null,
        pickupLng: body.pickupLng ? parseFloat(body.pickupLng) : null,
        destination: body.destination,
        destLat: body.destLat ? parseFloat(body.destLat) : null,
        destLng: body.destLng ? parseFloat(body.destLng) : null,
        date: body.date,
        time: body.time,
        vehicleType: body.vehicleType,
        passengers: parseInt(body.passengers, 10),
        notes: body.notes,
      },
    });

    return NextResponse.json({ message: 'Booking successful', booking: newBooking }, { status: 201 });
  } catch (error) {
    console.error('Booking Error:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

export async function GET(request) {
  // TODO: Add authentication check here so only Admin can view bookings
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error) {
    console.error('Fetch Bookings Error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
