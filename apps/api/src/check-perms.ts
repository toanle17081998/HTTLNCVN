import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const role = await prisma.role.findFirst({
      where: { name: 'church_member' },
      include: {
        permissions: {
          include: {
            action: true,
            resource: true,
          },
        },
      },
    });
    const perms = role?.permissions.map(p => `${p.action.name}:${p.resource.name}`) || [];
    console.log(JSON.stringify(perms, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
