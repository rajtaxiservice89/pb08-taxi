import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const drivers = [
    {
      name: 'Ramesh Singh',
      contact: '9876543210',
      password: 'password123',
      address: 'Model Town, Jalandhar',
      aadharNumber: '123456789012',
      licenseNumber: 'PB0820201234567',
      carRegistration: 'PB08AB1234',
      chassisNumber: 'CH1234567890',
      carName: 'Maruti Suzuki Dzire',
      status: 'approved'
    },
    {
      name: 'Suresh Kumar',
      contact: '9988776655',
      password: 'password123',
      address: 'Adarsh Nagar, Jalandhar',
      aadharNumber: '987654321098',
      licenseNumber: 'PB0820217654321',
      carRegistration: 'PB08CD5678',
      chassisNumber: 'CH0987654321',
      carName: 'Toyota Innova Crysta',
      status: 'approved'
    }
  ];

  for (const data of drivers) {
    const existing = await prisma.driverProfile.findUnique({
      where: { contact: data.contact }
    });
    if (!existing) {
      await prisma.driverProfile.create({ data });
      console.log(`Created driver: ${data.name}`);
    } else {
      console.log(`Driver already exists: ${data.name}`);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
