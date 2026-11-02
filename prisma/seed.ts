import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const categories = ["Flyers", "Logos", "Branding", "Merch", "Videos", "Custom"];

async function main() {
  for (const [i, name] of categories.entries()) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug, sortOrder: i },
    });
  }
  console.log("Seeded categories:", categories.join(", "));
}

main().finally(() => prisma.$disconnect());
