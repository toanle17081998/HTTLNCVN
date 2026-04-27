import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const roles = await prisma.role.findMany();
    console.log('Roles:', JSON.stringify(roles, null, 2));
    
    const churchUnits = await prisma.churchUnit.findMany({
        take: 5
    });
    console.log('Church Units:', JSON.stringify(churchUnits, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
