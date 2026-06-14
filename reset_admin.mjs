import { prisma } from './lib/prisma.js';
import bcrypt from 'bcrypt';

async function main() {
  await prisma.admin.deleteMany();
  const hashedPassword = await bcrypt.hash('Deepak123', 10);
  await prisma.admin.create({
    data: {
      username: 'Deepak',
      password: hashedPassword
    }
  });
  console.log("Admin set to Deepak / Deepak123");
  process.exit(0);
}
main();
