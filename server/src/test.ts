import { prisma } from "./constants";

// ts-node server/src/test.ts

async function dbTest() {
  return await prisma.users.findMany({
    where: { idu: 1 },
  });
}

(async () => {
  console.log(await dbTest());
  prisma.$disconnect();
})();
