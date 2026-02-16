import { PrismaClient, Role } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const salonUsers = await prisma.salonUser.findMany({
    include: { user: true },
  });

  for (const su of salonUsers) {
    if (!su.role) {
      await prisma.salonUser.update({
        where: { id: su.id },
        data: { role: su.user.role as Role },
      });
    }
  }

  console.log('Roles copied successfully!');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
