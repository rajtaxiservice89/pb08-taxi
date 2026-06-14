import { prisma } from './lib/prisma.js';
async function main() {
  const admins = await prisma.admin.findMany();
  console.log("Admins:");
  console.log(admins);
  process.exit(0);
}
main();
