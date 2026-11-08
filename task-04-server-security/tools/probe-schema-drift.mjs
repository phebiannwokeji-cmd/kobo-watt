import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.ts";

const adapter = new PrismaBetterSqlite3({
  url: "file:./data/kobo-watt-04.db",
});
const prisma = new PrismaClient({ adapter });

try {
  const accounts = await prisma.account.findMany({
    select: {
      id: true,
      email: true,
      lastLoginAt: true,
    },
  });
  console.log(JSON.stringify(accounts, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
