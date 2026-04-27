import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const courses = await prisma.course.findMany({
      where: {
        is_active: true,
        program: {
          faculty_program_affiliations: {
            some: {
              // Just a dummy query to see if the table exists
              is_active: true,
            },
          },
        },
      },
      take: 1,
    });
    console.log("Success! The table exists and query ran correctly.");
    console.log(courses);
  } catch (error) {
    console.error("Error running query:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
