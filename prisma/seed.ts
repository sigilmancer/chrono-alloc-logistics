import { parseArgs } from "node:util";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const {
    values: { environment },
  } = parseArgs({
    options: {
      environment: { type: "string" },
    },
  });

  const envName = environment === "test" ? "test" : "default";
  console.log(`Using '${envName}' environment`);

  // Dynamically import data based on environment
  const { dispatchRuns } = await import(`./seed/${envName === "test" ? "hidden.test-" : ""}dispatchRuns`);
  const { couriers } = await import("./seed/couriers");
  const { depots } = await import("./seed/depots");

  // Use for loop instead of `await Promise.all` for stable insertion order
  for (const data of couriers) {
    await prisma.courier.create({ data });
  }

  for (const data of depots) {
    await prisma.depot.create({ data });
  }

  for (const data of dispatchRuns) {
    await prisma.dispatchRun.create({ data });
  }

  console.log("Seeding complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
