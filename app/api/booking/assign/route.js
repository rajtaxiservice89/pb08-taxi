import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';

// Haversine formula to calculate distance between two coordinates in kilometers
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

export async function POST(req) {
  try {
    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }

    // 1. Fetch the booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking || booking.status !== 'PENDING') {
      return NextResponse.json({ error: 'Booking not found or already processed' }, { status: 404 });
    }

    if (!booking.pickupLat || !booking.pickupLng) {
      return NextResponse.json({ error: 'Booking is missing pickup coordinates' }, { status: 400 });
    }

    // 2. Fetch all online drivers
    const onlineDrivers = await prisma.driverProfile.findMany({
      where: {
        status: 'approved',
        isOnline: true,
        currentLat: { not: null },
        currentLng: { not: null }
      }
    });

    if (onlineDrivers.length === 0) {
      return NextResponse.json({ error: 'No drivers available currently' }, { status: 404 });
    }

    // 3. Find the nearest driver
    let nearestDriver = null;
    let minDistance = Infinity;

    for (const driver of onlineDrivers) {
      const distance = getDistanceFromLatLonInKm(
        booking.pickupLat, booking.pickupLng,
        driver.currentLat, driver.currentLng
      );
      
      // Let's say we only consider drivers within a 15km radius
      if (distance < minDistance && distance <= 15) {
        minDistance = distance;
        nearestDriver = driver;
      }
    }

    if (!nearestDriver) {
      return NextResponse.json({ error: 'No drivers available in your area' }, { status: 404 });
    }

    // 4. Send request to the nearest driver via Pusher
    // We send a 'new-booking-request' event to the specific driver's channel
    await pusherServer.trigger(`driver-${nearestDriver.id}`, 'new-booking-request', {
      booking: booking,
      distanceToPickup: minDistance.toFixed(2)
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Request sent to nearest driver',
      driverAssigned: nearestDriver.name,
      distance: minDistance.toFixed(2)
    });

  } catch (error) {
    console.error('Assign Driver Error:', error);
    return NextResponse.json({ error: 'Failed to assign driver' }, { status: 500 });
  }
}
