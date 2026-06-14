import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  let setting = await prisma.siteSetting.findFirst();
  if (setting) {
    await prisma.siteSetting.update({
      where: { id: setting.id },
      data: {
        heroTitle: "Ride into the Destination",
        heroText: "Experience next-generation comfort and safety. From city commutes to outstation trips, we provide a seamless journey tailored for you."
      }
    });
    console.log("Updated successfully!");
  } else {
    console.log("No setting found to update.");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
