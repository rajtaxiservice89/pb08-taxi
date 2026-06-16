import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';

export async function POST(req) {
  try {
    const body = await req.json();
    const { driverId, lat, lng, isOnline } = body;

    if (!driverId) {
      return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 });
    }

    // 1. Update database
    const updatedDriver = await prisma.driverProfile.update({
      where: { id: driverId },
      data: {
        currentLat: lat,
        currentLng: lng,
        isOnline: isOnline ?? true,
        lastLocationUpdate: new Date(),
      },
    });

    // 2. Broadcast via Pusher if coordinates are provided
    if (lat && lng) {
      // Channel: driver-{id}, Event: location-update
      await pusherServer.trigger(`driver-${driverId}`, 'location-update', {
        lat,
        lng,
        driverId
      });
      
      // Also broadcast to a global 'admin-map' channel if needed
      await pusherServer.trigger('admin-map', 'driver-location', {
        driverId,
        lat,
        lng,
        name: updatedDriver.name
      });
    }

    return NextResponse.json({ success: true, driver: updatedDriver });
  } catch (error) {
    console.error('Location Update Error:', error);
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}
