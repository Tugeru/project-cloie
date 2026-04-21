import 'dotenv/config';
import { prisma } from '../src/lib/db/prisma';
import { ROLES, ROLE_LEVELS } from '../src/lib/constants/roles';

async function main() {
  console.log('Start seeding...');

  const ciloEvalStructure = [
    {
      key: 'outline-defense-feedback',
      title: 'Outline Defense Feedback',
      description: 'Use these prompts for a lightweight demo-safe course-bound evaluation.',
      items: [
        {
          key: 'clarity',
          kind: 'quantitative',
          prompt: 'The outline defense criteria were communicated clearly.',
          scale: [1, 2, 3, 4, 5],
        },
        {
          key: 'readiness',
          kind: 'quantitative',
          prompt: 'The course activities prepared me for the outline defense.',
          scale: [1, 2, 3, 4, 5],
        },
        {
          key: 'remarks',
          kind: 'qualitative',
          prompt: 'What should be improved before the final defense?',
        },
      ],
    },
  ];

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

  // 5. Seed demo-safe course-bound evaluation assets
  console.log('Seeding demo-safe evaluation assets...');
  const programSpecificCourseType = await prisma.courseType.findUniqueOrThrow({
    where: { name: 'PROGRAM_SPECIFIC' },
  });

  const ciloEvalTemplate = await prisma.instrumentTemplate.upsert({
    where: { code: 'CILO_EVAL' },
    update: {
      description: 'Course-bound CILO evaluation template for the outline defense demo.',
      is_active: true,
      name: 'Course-Bound CILO Evaluation',
      structure: ciloEvalStructure,
    },
    create: {
      code: 'CILO_EVAL',
      description: 'Course-bound CILO evaluation template for the outline defense demo.',
      is_active: true,
      name: 'Course-Bound CILO Evaluation',
      structure: ciloEvalStructure,
    },
  });

  await prisma.instrumentVersion.upsert({
    where: {
      template_id_version_number: {
        template_id: ciloEvalTemplate.id,
        version_number: 1,
      },
    },
    update: {
      is_active: true,
      structure_snapshot: ciloEvalStructure,
    },
    create: {
      template_id: ciloEvalTemplate.id,
      version_number: 1,
      is_active: true,
      structure_snapshot: ciloEvalStructure,
    },
  });

  await prisma.course.upsert({
    where: { code: 'IT-OD-401' },
    update: {
      course_type_id: programSpecificCourseType.id,
      description: 'Demo-safe outline defense course shell for reviewer scope walkthroughs.',
      is_active: true,
      program_id: bsit.id,
      title: 'Outline Defense Demo Course',
    },
    create: {
      code: 'IT-OD-401',
      course_type_id: programSpecificCourseType.id,
      description: 'Demo-safe outline defense course shell for reviewer scope walkthroughs.',
      is_active: true,
      program_id: bsit.id,
      title: 'Outline Defense Demo Course',
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
