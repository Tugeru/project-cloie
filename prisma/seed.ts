import "dotenv/config";
import {
  AcademicSemester,
  AcademicTerm,
  CourseScope,
  DeploymentStatus,
  DeploymentType,
  InviteStatus,
  Prisma,
  ResponseStatus,
  SystemRole,
  TargetStakeholder,
} from "@prisma/client";
import { prisma } from "../src/lib/db/prisma";

const ciloEvalStructure: Prisma.InputJsonValue = [
  {
    key: "course-attainment",
    title: "Course Attainment",
    description: "Use these prompts for the course-bound CILO evaluation workflow.",
    items: [
      {
        key: "clarity",
        kind: "quantitative",
        prompt: "The course outcomes were communicated clearly.",
        scale: [1, 2, 3, 4, 5],
      },
      {
        key: "attainment",
        kind: "quantitative",
        prompt: "The activities helped me attain the intended outcomes.",
        scale: [1, 2, 3, 4, 5],
      },
      {
        key: "remarks",
        kind: "qualitative",
        prompt: "What should be improved for the next term?",
      },
    ],
  },
];

const graduatingSurveyStructure: Prisma.InputJsonValue = [
  {
    key: "graduate-readiness",
    title: "Graduate Readiness",
    items: [
      {
        key: "skills",
        kind: "quantitative",
        prompt: "The program prepared me for professional practice.",
        scale: [1, 2, 3, 4, 5],
      },
      {
        key: "feedback",
        kind: "qualitative",
        prompt: "Share your final recommendations for the program.",
      },
    ],
  },
];

const alumniStructure: Prisma.InputJsonValue = [
  {
    key: "alumni-feedback",
    title: "Alumni Feedback",
    items: [
      {
        key: "relevance",
        kind: "quantitative",
        prompt: "The program remains relevant to my work.",
        scale: [1, 2, 3, 4, 5],
      },
      {
        key: "improvements",
        kind: "qualitative",
        prompt: "What should the program improve for future graduates?",
      },
    ],
  },
];

const industryStructure: Prisma.InputJsonValue = [
  {
    key: "industry-feedback",
    title: "Industry Feedback",
    items: [
      {
        key: "competence",
        kind: "quantitative",
        prompt: "The intern or graduate demonstrates expected competence.",
        scale: [1, 2, 3, 4, 5],
      },
      {
        key: "recommendation",
        kind: "qualitative",
        prompt: "What recommendations do you have for the program?",
      },
    ],
  },
];

const demoUsers = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    email: "demo-admin@cloie.test",
    firstName: "Demo",
    lastName: "Admin",
    role: SystemRole.ADMIN,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    email: "demo-dean@cloie.test",
    firstName: "Demo",
    lastName: "Dean",
    role: SystemRole.DEAN,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    email: "demo-ph@cloie.test",
    firstName: "Demo",
    lastName: "Program Head",
    role: SystemRole.PROGRAM_HEAD,
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    email: "demo-faculty@cloie.test",
    firstName: "Demo",
    lastName: "Faculty",
    role: SystemRole.FACULTY,
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    email: "demo-student@cloie.test",
    firstName: "Demo",
    lastName: "Student",
    role: SystemRole.STUDENT,
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    email: "demo-grad@cloie.test",
    firstName: "Demo",
    lastName: "Graduate",
    role: SystemRole.STUDENT,
  },
  {
    id: "77777777-7777-4777-8777-777777777777",
    email: "demo-alumni@cloie.test",
    firstName: "Demo",
    lastName: "Alumni",
    role: SystemRole.ALUMNI,
  },
  {
    id: "88888888-8888-4888-8888-888888888888",
    email: "demo-industry@cloie.test",
    firstName: "Demo",
    lastName: "Industry",
    role: SystemRole.INDUSTRY_PARTNER,
  },
] as const;

async function upsertTemplate(
  code: string,
  name: string,
  description: string,
  structure: Prisma.InputJsonValue,
) {
  const template = await prisma.instrumentTemplate.upsert({
    where: { code },
    update: {
      description,
      is_active: true,
      is_faculty_accessible: false,
      name,
      program_id: null,
      structure,
    },
    create: {
      code,
      description,
      is_active: true,
      is_faculty_accessible: false,
      name,
      program_id: null,
      structure,
    },
  });

  await prisma.instrumentVersion.upsert({
    where: {
      template_id_version_number: {
        template_id: template.id,
        version_number: 1,
      },
    },
    update: {
      is_active: true,
      structure_snapshot: structure,
    },
    create: {
      template_id: template.id,
      version_number: 1,
      is_active: true,
      structure_snapshot: structure,
    },
  });

  return template;
}

async function ensureAssignment(input: {
  courseBoundId?: string;
  centralDeploymentId?: string;
  respondentId: string;
}) {
  const existing = await prisma.evaluationAssignment.findFirst({
    where: {
      course_bound_id: input.courseBoundId ?? null,
      central_deployment_id: input.centralDeploymentId ?? null,
      respondent_id: input.respondentId,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.evaluationAssignment.create({
    data: {
      course_bound_id: input.courseBoundId ?? null,
      central_deployment_id: input.centralDeploymentId ?? null,
      respondent_id: input.respondentId,
    },
  });
}

async function main() {
  console.log("Start seeding...");

  const yearLevels = [
    { name: "1st Year", order: 1 },
    { name: "2nd Year", order: 2 },
    { name: "3rd Year", order: 3 },
    { name: "4th Year", order: 4 },
    { name: "5th Year", order: 5 },
  ];

  for (const yearLevel of yearLevels) {
    await prisma.yearLevel.upsert({
      where: { name: yearLevel.name },
      update: { order: yearLevel.order },
      create: yearLevel,
    });
  }

  const programDefinitions = [
    { code: "BEED", name: "Bachelor of Elementary Education" },
    { code: "BSED", name: "Bachelor of Secondary Education" },
    { code: "BSSW", name: "Bachelor of Science in Social Work" },
    { code: "BSBA", name: "Bachelor of Science in Business Administration" },
    { code: "BSIT", name: "Bachelor of Science in Information Technology" },
    { code: "BSHM", name: "Bachelor of Science in Hospitality Management" },
  ] as const;

  const programMap = new Map<string, Awaited<ReturnType<typeof prisma.program.upsert>>>();

  for (const definition of programDefinitions) {
    const program = await prisma.program.upsert({
      where: { code: definition.code },
      update: {
        description: `${definition.name} seeded from the current ACD academic catalog.`,
        is_active: true,
        name: definition.name,
      },
      create: {
        code: definition.code,
        description: `${definition.name} seeded from the current ACD academic catalog.`,
        is_active: true,
        name: definition.name,
      },
    });

    programMap.set(definition.code, program);
  }

  const majorDefinitions = [
    { programCode: "BSED", name: "English" },
    { programCode: "BSED", name: "Mathematics" },
    { programCode: "BSED", name: "Science" },
    { programCode: "BSED", name: "Values Education" },
    { programCode: "BSBA", name: "Financial Management" },
    { programCode: "BSBA", name: "Human Resource Development Management" },
    { programCode: "BSBA", name: "Marketing Management" },
  ] as const;

  const majorMap = new Map<string, Awaited<ReturnType<typeof prisma.major.upsert>>>();

  for (const definition of majorDefinitions) {
    const program = programMap.get(definition.programCode);

    if (!program) {
      throw new Error(`Missing seeded program ${definition.programCode}`);
    }

    const major = await prisma.major.upsert({
      where: {
        program_id_name: {
          name: definition.name,
          program_id: program.id,
        },
      },
      update: {
        is_active: true,
      },
      create: {
        name: definition.name,
        program_id: program.id,
      },
    });

    majorMap.set(`${definition.programCode}:${definition.name}`, major);
  }

  for (const program of programMap.values()) {
    await prisma.gO.upsert({
      where: {
        program_id_code: {
          code: `${program.code}-GO1`,
          program_id: program.id,
        },
      },
      update: {
        description: `${program.name} graduates demonstrate graduate-level readiness.`,
        is_active: true,
        order: 1,
      },
      create: {
        code: `${program.code}-GO1`,
        description: `${program.name} graduates demonstrate graduate-level readiness.`,
        order: 1,
        program_id: program.id,
      },
    });
  }

  const courseDefinitions: Array<{
    code: string;
    courseScope: CourseScope;
    title: string;
    programCode?: string;
    majorKey?: string;
  }> = [
    {
      code: "GEGS101",
      courseScope: CourseScope.GENERAL_EDUCATION,
      title: "General Education Foundations",
    },
    {
      code: "NSTP1",
      courseScope: CourseScope.GENERAL_EDUCATION,
      title: "National Service Training Program 1",
    },
    {
      code: "IT101",
      courseScope: CourseScope.PROGRAM_SPECIFIC,
      programCode: "BSIT",
      title: "Introduction to Computing",
    },
    {
      code: "IT-OD-401",
      courseScope: CourseScope.PROGRAM_SPECIFIC,
      programCode: "BSIT",
      title: "Outline Defense Demo Course",
    },
    {
      code: "EDUC101",
      courseScope: CourseScope.PROGRAM_SPECIFIC,
      programCode: "BSED",
      title: "Foundations of Teaching and Learning",
    },
    {
      code: "ENG201",
      courseScope: CourseScope.PROGRAM_SPECIFIC,
      programCode: "BSED",
      majorKey: "BSED:English",
      title: "Language Across the Curriculum",
    },
    {
      code: "MKT301",
      courseScope: CourseScope.PROGRAM_SPECIFIC,
      programCode: "BSBA",
      majorKey: "BSBA:Marketing Management",
      title: "Strategic Marketing",
    },
    {
      code: "HRDM302",
      courseScope: CourseScope.PROGRAM_SPECIFIC,
      programCode: "BSBA",
      majorKey: "BSBA:Human Resource Development Management",
      title: "People Development and Training",
    },
    {
      code: "FIN303",
      courseScope: CourseScope.PROGRAM_SPECIFIC,
      programCode: "BSBA",
      majorKey: "BSBA:Financial Management",
      title: "Financial Analysis and Planning",
    },
  ] as const;

  for (const definition of courseDefinitions) {
    await prisma.course.upsert({
      where: { code: definition.code },
      update: {
        course_scope: definition.courseScope,
        description: `${definition.title} seeded from the flexible academic catalog scaffold.`,
        is_active: true,
        major_id: definition.majorKey ? majorMap.get(definition.majorKey)?.id ?? null : null,
        program_id: definition.programCode ? programMap.get(definition.programCode)?.id ?? null : null,
        title: definition.title,
      },
      create: {
        code: definition.code,
        course_scope: definition.courseScope,
        description: `${definition.title} seeded from the flexible academic catalog scaffold.`,
        is_active: true,
        major_id: definition.majorKey ? majorMap.get(definition.majorKey)?.id ?? null : null,
        program_id: definition.programCode ? programMap.get(definition.programCode)?.id ?? null : null,
        title: definition.title,
      },
    });
  }

  await upsertTemplate(
    "CILO_EVAL",
    "Course-Bound CILO Evaluation",
    "Baseline course-bound template for faculty-managed CILO evaluations.",
    ciloEvalStructure,
  );
  await upsertTemplate(
    "EXIT_SURVEY",
    "Graduating Student Exit Survey",
    "Baseline graduating-student survey delivered through the student role.",
    graduatingSurveyStructure,
  );
  await upsertTemplate(
    "ALUMNI_EVAL",
    "Alumni Evaluation Tool",
    "Baseline alumni evaluation template.",
    alumniStructure,
  );
  await upsertTemplate(
    "INDUSTRY_EVAL",
    "Industry Partner Internship Evaluation Tool",
    "Baseline industry partner evaluation template.",
    industryStructure,
  );

  for (const demoUser of demoUsers) {
    await prisma.user.upsert({
      where: { email: demoUser.email },
      update: {
        first_name: demoUser.firstName,
        is_active: true,
        last_name: demoUser.lastName,
      },
      create: {
        id: demoUser.id,
        email: demoUser.email,
        first_name: demoUser.firstName,
        is_active: true,
        last_name: demoUser.lastName,
      },
    });

    await prisma.userRole.upsert({
      where: {
        user_id_role: {
          role: demoUser.role,
          user_id: demoUser.id,
        },
      },
      update: {},
      create: {
        user_id: demoUser.id,
        role: demoUser.role,
      },
    });
  }

  const fourthYear = await prisma.yearLevel.findUniqueOrThrow({
    where: { name: "4th Year" },
  });
  const bsit = programMap.get("BSIT");

  if (!bsit) {
    throw new Error("Missing seeded BSIT program.");
  }

  await prisma.studentAcademicProfile.upsert({
    where: { user_id: "55555555-5555-4555-8555-555555555555" },
    update: {
      academic_year: "2026-2027",
      is_graduating: false,
      major_id: null,
      program_id: bsit.id,
      student_id_number: "2026-0001",
      year_level_id: fourthYear.id,
    },
    create: {
      academic_year: "2026-2027",
      is_graduating: false,
      major_id: null,
      program_id: bsit.id,
      student_id_number: "2026-0001",
      user_id: "55555555-5555-4555-8555-555555555555",
      year_level_id: fourthYear.id,
    },
  });

  await prisma.studentAcademicProfile.upsert({
    where: { user_id: "66666666-6666-4666-8666-666666666666" },
    update: {
      academic_year: "2026-2027",
      is_graduating: true,
      major_id: null,
      program_id: bsit.id,
      student_id_number: "2026-0002",
      year_level_id: fourthYear.id,
    },
    create: {
      academic_year: "2026-2027",
      is_graduating: true,
      major_id: null,
      program_id: bsit.id,
      student_id_number: "2026-0002",
      user_id: "66666666-6666-4666-8666-666666666666",
      year_level_id: fourthYear.id,
    },
  });

  await prisma.facultyProgramAffiliation.upsert({
    where: {
      faculty_id_program_id: {
        faculty_id: "44444444-4444-4444-8444-444444444444",
        program_id: bsit.id,
      },
    },
    update: { is_active: true },
    create: {
      faculty_id: "44444444-4444-4444-8444-444444444444",
      program_id: bsit.id,
      is_active: true,
    },
  });

  await prisma.programHeadAssignment.upsert({
    where: {
      program_head_id_program_id: {
        program_head_id: "33333333-3333-4333-8333-333333333333",
        program_id: bsit.id,
      },
    },
    update: { is_active: true },
    create: {
      program_head_id: "33333333-3333-4333-8333-333333333333",
      program_id: bsit.id,
      is_active: true,
    },
  });

  const ciloTemplateVersion = await prisma.instrumentVersion.findFirstOrThrow({
    where: {
      template: { code: "CILO_EVAL" },
      version_number: 1,
    },
  });
  const exitSurveyVersion = await prisma.instrumentVersion.findFirstOrThrow({
    where: {
      template: { code: "EXIT_SURVEY" },
      version_number: 1,
    },
  });
  const alumniVersion = await prisma.instrumentVersion.findFirstOrThrow({
    where: {
      template: { code: "ALUMNI_EVAL" },
      version_number: 1,
    },
  });
  const industryVersion = await prisma.instrumentVersion.findFirstOrThrow({
    where: {
      template: { code: "INDUSTRY_EVAL" },
      version_number: 1,
    },
  });

  const outlineCourse = await prisma.course.findUniqueOrThrow({
    where: { code: "IT-OD-401" },
  });

  const ciloSnapshot: Prisma.InputJsonValue = [
    { description: "Defend the proposed capstone scope.", order: 1 },
    { description: "Present a coherent research and implementation plan.", order: 2 },
  ];
  const courseInfoSnapshot: Prisma.InputJsonValue = {
    courseCode: outlineCourse.code,
    courseTitle: outlineCourse.title,
    programCode: bsit.code,
    programName: bsit.name,
  };

  const courseEvaluation = await prisma.courseBoundEvaluation.upsert({
    where: {
      course_id_academic_year_semester_term: {
        academic_year: "2026-2027",
        course_id: outlineCourse.id,
        semester: AcademicSemester.SECOND,
        term: AcademicTerm.SECOND_TERM,
      },
    },
    update: {
      activation_at: new Date("2026-04-01T08:00:00.000Z"),
      cilos_snapshot: ciloSnapshot,
      course_info_snapshot: courseInfoSnapshot,
      deadline_at: new Date("2026-05-31T23:59:00.000Z"),
      faculty_id: "44444444-4444-4444-8444-444444444444",
      instrument_version_id: ciloTemplateVersion.id,
      major_id: null,
      program_id: bsit.id,
      published_at: new Date("2026-04-01T08:00:00.000Z"),
      status: DeploymentStatus.ACTIVE,
    },
    create: {
      academic_year: "2026-2027",
      activation_at: new Date("2026-04-01T08:00:00.000Z"),
      cilos_snapshot: ciloSnapshot,
      course_id: outlineCourse.id,
      course_info_snapshot: courseInfoSnapshot,
      deadline_at: new Date("2026-05-31T23:59:00.000Z"),
      faculty_id: "44444444-4444-4444-8444-444444444444",
      instrument_version_id: ciloTemplateVersion.id,
      major_id: null,
      program_id: bsit.id,
      published_at: new Date("2026-04-01T08:00:00.000Z"),
      semester: AcademicSemester.SECOND,
      status: DeploymentStatus.ACTIVE,
      term: AcademicTerm.SECOND_TERM,
    },
  });

  await prisma.courseBoundEvaluationTarget.upsert({
    where: {
      course_bound_evaluation_id_program_id_year_level_id: {
        course_bound_evaluation_id: courseEvaluation.id,
        program_id: bsit.id,
        year_level_id: fourthYear.id,
      },
    },
    update: {},
    create: {
      course_bound_evaluation_id: courseEvaluation.id,
      program_id: bsit.id,
      year_level_id: fourthYear.id,
    },
  });

  for (const studentId of [
    "55555555-5555-4555-8555-555555555555",
    "66666666-6666-4666-8666-666666666666",
  ]) {
    await ensureAssignment({
      courseBoundId: courseEvaluation.id,
      respondentId: studentId,
    });
  }

  const centralDeployments = [
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      respondentId: "66666666-6666-4666-8666-666666666666",
      target: TargetStakeholder.GRADUATING_STUDENT,
      versionId: exitSurveyVersion.id,
    },
    {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      respondentId: "77777777-7777-4777-8777-777777777777",
      target: TargetStakeholder.ALUMNI,
      versionId: alumniVersion.id,
    },
    {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      respondentId: "88888888-8888-4888-8888-888888888888",
      target: TargetStakeholder.INDUSTRY_PARTNER,
      versionId: industryVersion.id,
    },
  ] as const;

  for (const deployment of centralDeployments) {
    await prisma.centralDeployment.upsert({
      where: { id: deployment.id },
      update: {
        academic_year: "2026-2027",
        activation_at: new Date("2026-04-15T08:00:00.000Z"),
        deadline_at: new Date("2026-06-01T23:59:00.000Z"),
        instrument_version_id: deployment.versionId,
        major_id: null,
        program_id: bsit.id,
        semester: AcademicSemester.SECOND,
        status: DeploymentStatus.ACTIVE,
        target_stakeholder: deployment.target,
        year_level_id:
          deployment.target === TargetStakeholder.GRADUATING_STUDENT ? fourthYear.id : null,
      },
      create: {
        id: deployment.id,
        academic_year: "2026-2027",
        activation_at: new Date("2026-04-15T08:00:00.000Z"),
        deadline_at: new Date("2026-06-01T23:59:00.000Z"),
        instrument_version_id: deployment.versionId,
        major_id: null,
        program_id: bsit.id,
        semester: AcademicSemester.SECOND,
        status: DeploymentStatus.ACTIVE,
        target_stakeholder: deployment.target,
        year_level_id:
          deployment.target === TargetStakeholder.GRADUATING_STUDENT ? fourthYear.id : null,
      },
    });

    await ensureAssignment({
      centralDeploymentId: deployment.id,
      respondentId: deployment.respondentId,
    });
  }

  await prisma.externalStakeholderInvite.upsert({
    where: {
      email_role_program_id: {
        email: "demo-alumni@cloie.test",
        role: SystemRole.ALUMNI,
        program_id: bsit.id,
      },
    },
    update: {
      accepted_at: new Date("2026-04-10T09:00:00.000Z"),
      invitee_name: "Demo Alumni",
      invited_by: "11111111-1111-4111-8111-111111111111",
      note: "Seeded alumni invite stub for the MVP scaffold.",
      sent_at: new Date("2026-04-05T09:00:00.000Z"),
      status: InviteStatus.ACCEPTED,
    },
    create: {
      accepted_at: new Date("2026-04-10T09:00:00.000Z"),
      email: "demo-alumni@cloie.test",
      invitee_name: "Demo Alumni",
      invited_by: "11111111-1111-4111-8111-111111111111",
      note: "Seeded alumni invite stub for the MVP scaffold.",
      program_id: bsit.id,
      role: SystemRole.ALUMNI,
      sent_at: new Date("2026-04-05T09:00:00.000Z"),
      status: InviteStatus.ACCEPTED,
    },
  });

  await prisma.externalStakeholderInvite.upsert({
    where: {
      email_role_program_id: {
        email: "demo-industry@cloie.test",
        role: SystemRole.INDUSTRY_PARTNER,
        program_id: bsit.id,
      },
    },
    update: {
      accepted_at: new Date("2026-04-11T09:00:00.000Z"),
      company_name: "Demo Industry Partner",
      invitee_name: "Demo Industry Reviewer",
      invited_by: "11111111-1111-4111-8111-111111111111",
      note: "Seeded industry invite stub for the MVP scaffold.",
      sent_at: new Date("2026-04-05T09:00:00.000Z"),
      status: InviteStatus.ACCEPTED,
    },
    create: {
      accepted_at: new Date("2026-04-11T09:00:00.000Z"),
      company_name: "Demo Industry Partner",
      email: "demo-industry@cloie.test",
      invitee_name: "Demo Industry Reviewer",
      invited_by: "11111111-1111-4111-8111-111111111111",
      note: "Seeded industry invite stub for the MVP scaffold.",
      program_id: bsit.id,
      role: SystemRole.INDUSTRY_PARTNER,
      sent_at: new Date("2026-04-05T09:00:00.000Z"),
      status: InviteStatus.ACCEPTED,
    },
  });

  await prisma.industryPartnerProfile.upsert({
    where: { user_id: "88888888-8888-4888-8888-888888888888" },
    update: {
      company_name: "Demo Industry Partner",
      position: "HR and Training Lead",
      program_id: bsit.id,
    },
    create: {
      company_name: "Demo Industry Partner",
      position: "HR and Training Lead",
      program_id: bsit.id,
      user_id: "88888888-8888-4888-8888-888888888888",
    },
  });

  const gradAssignment = await prisma.evaluationAssignment.findFirst({
    where: {
      central_deployment_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      respondent_id: "66666666-6666-4666-8666-666666666666",
    },
  });

  if (gradAssignment) {
    await prisma.response.upsert({
      where: { assignment_id: gradAssignment.id },
      update: {
        deployment_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        deployment_type: DeploymentType.CENTRAL,
        respondent_id: "66666666-6666-4666-8666-666666666666",
        status: ResponseStatus.IN_PROGRESS,
      },
      create: {
        assignment_id: gradAssignment.id,
        deployment_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        deployment_type: DeploymentType.CENTRAL,
        respondent_id: "66666666-6666-4666-8666-666666666666",
        status: ResponseStatus.IN_PROGRESS,
      },
    });
  }

  console.log("Seeding complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
