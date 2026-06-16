import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';

export async function POST(req) {
  try {
    const { bookingId, driverId } = await req.json();

    if (!bookingId || !driverId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Assign the booking to the driver and update status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        assignedDriverId: driverId,
        status: 'confirmed',
      },
      include: {
        assignedDriver: true
      }
    });

    // Notify passenger via Pusher that their ride was accepted
    await pusherServer.trigger(`booking-${bookingId}`, 'ride-accepted', {
      driverName: updatedBooking.assignedDriver.name,
      driverPhone: updatedBooking.assignedDriver.contact,
      carName: updatedBooking.assignedDriver.carName,
      carRegistration: updatedBooking.assignedDriver.carRegistration
    });

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error('Accept Ride Error:', error);
    return NextResponse.json({ error: 'Failed to accept ride. It might have been taken.' }, { status: 500 });
  }
}
