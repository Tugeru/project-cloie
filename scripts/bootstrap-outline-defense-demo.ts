import { loadEnvConfig } from "@next/env";
import {
  AcademicSemester,
  AcademicTerm,
  DeploymentStatus,
} from "@prisma/client";
import { pathToFileURL } from "node:url";

import { prisma } from "../src/lib/db/prisma";
import { ROLES, type Role } from "../src/lib/constants/roles";

loadEnvConfig(process.cwd());

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getAcademicYear(now = new Date()) {
  const year = now.getFullYear();

  return `${year}-${year + 1}`;
}

function startOfNextWeek() {
  const value = new Date();

  value.setDate(value.getDate() + 7);

  return value;
}

type DemoUserInput = {
  email: string;
  firstName: string;
  lastName: string;
};

type ExistingDemoUser = {
  email: string;
  first_name: string;
  last_name: string;
};

export function assertSafeDemoUserReuse(existingUser: ExistingDemoUser, input: DemoUserInput) {
  if (
    existingUser.first_name !== input.firstName ||
    existingUser.last_name !== input.lastName
  ) {
    throw new Error(
      `Refusing to reuse existing user ${input.email} because it does not match the outline defense demo marker.`,
    );
  }
}

async function ensureUser(input: DemoUserInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!existingUser) {
    return prisma.user.create({
      data: {
        email: input.email,
        first_name: input.firstName,
        is_active: true,
        last_name: input.lastName,
      },
    });
  }

  assertSafeDemoUserReuse(existingUser, input);

  return prisma.user.update({
    where: { id: existingUser.id },
    data: { is_active: true },
  });
}

async function ensureUserRole(userId: string, role: Role) {
  await prisma.userRole.upsert({
    where: {
      user_id_role: {
        user_id: userId,
        role,
      },
    },
    update: {},
    create: {
      user_id: userId,
      role,
    },
  });
}

async function main() {
  const facultyEmail = requireEnv("OUTLINE_FACULTY_EMAIL");
  const programHeadEmail = requireEnv("OUTLINE_PROGRAM_HEAD_EMAIL");
  const deanEmail = requireEnv("OUTLINE_DEAN_EMAIL");
  const studentEmail = requireEnv("OUTLINE_STUDENT_EMAIL");
  const academicYear = getAcademicYear();
  const semester = AcademicSemester.SECOND;
  const term = AcademicTerm.SECOND_TERM;

  const [program, yearLevel, course, instrumentVersion] = await Promise.all([
    prisma.program.findUnique({ where: { code: "BSIT" } }),
    prisma.yearLevel.findUnique({ where: { name: "4th Year" } }),
    prisma.course.findUnique({ where: { code: "IT-OD-401" } }),
    prisma.instrumentVersion.findFirst({
      where: {
        is_active: true,
        template: { code: "CILO_EVAL" },
        version_number: 1,
      },
      include: {
        template: true,
      },
    }),
  ]);

  if (!program || !yearLevel || !course || !instrumentVersion) {
    throw new Error(
      "Seed prerequisites are missing. Run `pnpm db:seed` before bootstrapping the outline defense demo.",
    );
  }

  const faculty = await ensureUser({
    email: facultyEmail,
    firstName: "Outline Demo",
    lastName: "Faculty",
  });
  const programHead = await ensureUser({
    email: programHeadEmail,
    firstName: "Outline Demo",
    lastName: "Program Head",
  });
  const dean = await ensureUser({
    email: deanEmail,
    firstName: "Outline Demo",
    lastName: "Dean",
  });
  const student = await ensureUser({
    email: studentEmail,
    firstName: "Outline Demo",
    lastName: "Student",
  });

  await Promise.all([
    ensureUserRole(faculty.id, ROLES.FACULTY),
    ensureUserRole(programHead.id, ROLES.PROGRAM_HEAD),
    ensureUserRole(dean.id, ROLES.DEAN),
    ensureUserRole(student.id, ROLES.STUDENT),
  ]);

  await prisma.facultyProgramAffiliation.upsert({
    where: {
      faculty_id_program_id: {
        faculty_id: faculty.id,
        program_id: program.id,
      },
    },
    update: {
      is_active: true,
    },
    create: {
      faculty_id: faculty.id,
      program_id: program.id,
      is_active: true,
    },
  });

  await prisma.programHeadAssignment.upsert({
    where: {
      program_head_id_program_id: {
        program_head_id: programHead.id,
        program_id: program.id,
      },
    },
    update: {
      is_active: true,
    },
    create: {
      program_head_id: programHead.id,
      program_id: program.id,
      is_active: true,
    },
  });

  await prisma.studentAcademicProfile.upsert({
    where: { user_id: student.id },
    update: {
      academic_year: academicYear,
      is_graduating: true,
      program_id: program.id,
      student_id_number: "OUTLINE-DEMO-001",
      year_level_id: yearLevel.id,
    },
    create: {
      academic_year: academicYear,
      is_graduating: true,
      program_id: program.id,
      student_id_number: "OUTLINE-DEMO-001",
      user_id: student.id,
      year_level_id: yearLevel.id,
    },
  });

  let evaluation = await prisma.courseBoundEvaluation.findFirst({
    where: {
      academic_year: academicYear,
      course_id: course.id,
      faculty_id: faculty.id,
      instrument_version_id: instrumentVersion.id,
      semester,
      term,
    },
  });

  if (!evaluation) {
    evaluation = await prisma.courseBoundEvaluation.create({
      data: {
        academic_year: academicYear,
        activation_at: new Date(),
        cilos_snapshot: [],
        course_id: course.id,
        course_info_snapshot: {
          code: course.code,
          programCode: program.code,
          title: course.title,
        },
        deadline_at: startOfNextWeek(),
        faculty_id: faculty.id,
        instrument_version_id: instrumentVersion.id,
        program_id: program.id,
        published_at: new Date(),
        semester,
        status: DeploymentStatus.ACTIVE,
        term,
      },
    });
  }

  await prisma.courseBoundEvaluationTarget.upsert({
    where: {
      course_bound_evaluation_id_program_id_year_level_id: {
        course_bound_evaluation_id: evaluation.id,
        program_id: program.id,
        year_level_id: yearLevel.id,
      },
    },
    update: {},
    create: {
      course_bound_evaluation_id: evaluation.id,
      program_id: program.id,
      year_level_id: yearLevel.id,
    },
  });

  const existingAssignment = await prisma.evaluationAssignment.findFirst({
    where: {
      course_bound_id: evaluation.id,
      respondent_id: student.id,
    },
  });

  if (!existingAssignment) {
    await prisma.evaluationAssignment.create({
      data: {
        course_bound_id: evaluation.id,
        respondent_id: student.id,
      },
    });
  }

  console.log(
    JSON.stringify(
      {
        course: course.code,
        dean: dean.email,
        evaluationId: evaluation.id,
        faculty: faculty.email,
        program: program.code,
        programHead: programHead.email,
        yearLevel: yearLevel.name,
        student: student.email,
      },
      null,
      2,
    ),
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
