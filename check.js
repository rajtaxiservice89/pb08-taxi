const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.admin.findMany();
  console.log("ADMINS IN DB:", admins);
}

main().catch(console.error).finally(() => process.exit(0));
