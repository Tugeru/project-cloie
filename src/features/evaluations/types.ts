import {
  AcademicSemester,
  AcademicTerm,
  CourseScope,
} from "@prisma/client";

export type FacultyCourseContext = {
  courseCode: string;
  courseId: string;
  courseTitle: string;
  courseType: CourseScope;
  majorId: string | null;
  majorName: string | null;
  programCode: string;
  programId: string;
  programName: string;
  scopeLabel: string;
};

export type CourseBoundPublicationCiloInput = {
  description: string;
};

export type PublishCourseBoundEvaluationInput = {
  academicYear: string;
  activationAt?: Date | null;
  cilos: CourseBoundPublicationCiloInput[];
  courseId: string;
  deadlineAt?: Date | null;
  majorId?: string | null;
  programId: string;
  semester: AcademicSemester;
  term: AcademicTerm;
  yearLevelIds: string[];
};

export type PublishCourseBoundEvaluationResult =
  | {
      error: string;
      success: false;
    }
    | {
      assignmentCount: number;
      evaluationId: string;
      status: "ACTIVE" | "SCHEDULED";
      success: true;
      targetCount: number;
    };
