import { prisma } from './lib/prisma.js';

async function main() {
  try {
    // 1. Add dummy booking
    const newBooking = await prisma.booking.create({
      data: {
        customerName: 'Rahul Sharma',
        customerPhone: '9876543210',
        pickup: 'Jalandhar City Railway Station',
        destination: 'Amritsar Golden Temple',
        date: '2026-06-20',
        time: '10:00',
        vehicleType: 'Sedan',
        passengers: 3,
        notes: 'Dummy test booking',
        status: 'PENDING'
      }
    });
    console.log('Dummy booking created:', newBooking.id);

    // 2. Add dummy driver
    const newDriver = await prisma.driverProfile.create({
      data: {
        name: 'Sandeep Singh',
        contact: '9988776655',
        address: '123 Main Bazaar, Jalandhar',
        aadharNumber: '123456789012',
        licenseNumber: 'PB08-1234567',
        carRegistration: 'PB08 AB 1234',
        chassisNumber: 'XYZ12345CHASSIS',
        carName: 'Maruti Dzire',
        status: 'APPROVED'
      }
    });
    console.log('Dummy driver created:', newDriver.id);

    console.log('Success! Dummy data has been added.');
  } catch (error) {
    console.error('Error adding dummy data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
