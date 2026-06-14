const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const keys = "c1eeb6db067348e79e7ca8c741654187,f347d2c65b5343328d7777d87b866f11,deee28c44098496ab673c6e0e1a98249,2f8eb584a4f347b0b782f1cca0b2002b";
  
  // Deactivate existing
  await prisma.locationApi.updateMany({
    data: { isActive: false }
  });

  // Create new active geoapify api
  const newApi = await prisma.locationApi.create({
    data: {
      provider: 'geoapify',
      apiKey: keys,
      isActive: true
    }
  });
  
  console.log('Database updated successfully:', newApi);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
