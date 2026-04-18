import 'dotenv/config';
import { prisma } from '../src/lib/db/prisma';
import { ROLES, ROLE_LEVELS } from '../src/lib/constants/roles';

async function main() {
  console.log('Start seeding...');

  // 1. Seed Roles
  console.log('Seeding Roles...');
  for (const [key, value] of Object.entries(ROLES)) {
    await prisma.role.upsert({
      where: { name: value },
      update: { description: `Role level: ${ROLE_LEVELS[value as keyof typeof ROLES]}` },
      create: {
        name: value,
        description: `Role level: ${ROLE_LEVELS[value as keyof typeof ROLES]}`,
      },
    });
  }

  // 2. Seed Year Levels
  console.log('Seeding Year Levels...');
  const years = [
    { name: '1st Year', order: 1 },
    { name: '2nd Year', order: 2 },
    { name: '3rd Year', order: 3 },
    { name: '4th Year', order: 4 },
    { name: '5th Year', order: 5 },
  ];

  for (const year of years) {
    await prisma.yearLevel.upsert({
      where: { name: year.name },
      update: {},
      create: { name: year.name, order: year.order },
    });
  }

  // 3. Seed Course Types
  console.log('Seeding Course Types...');
  const courseTypes = [
    { name: 'PROGRAM_SPECIFIC' },
    { name: 'GENERAL_EDUCATION' },
  ];

  for (const ct of courseTypes) {
    await prisma.courseType.upsert({
      where: { name: ct.name },
      update: {},
      create: { name: ct.name },
    });
  }

  // 4. Seed example Programs according to ACD context
  console.log('Seeding Programs...');
  const bsit = await prisma.program.upsert({
    where: { code: 'BSIT' },
    update: {},
    create: {
      code: 'BSIT',
      name: 'Bachelor of Science in Information Technology',
      description: 'Computing program focusing on systems, software, and IT infrastructure.',
    },
  });

  const bshm = await prisma.program.upsert({
    where: { code: 'BSHM' },
    update: {},
    create: {
      code: 'BSHM',
      name: 'Bachelor of Science in Hospitality Management',
      description: 'Program focusing on hospitality and tourism management.',
    },
  });

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
