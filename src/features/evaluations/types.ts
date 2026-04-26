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

export type FacultyManagedCiloContext = {
  courseId: string;
  majorId: string | null;
  programId: string;
};

export type FacultyManagedCiloItem = {
  description: string;
  id: string;
};

export type FacultyManagedCiloLoadResult =
  | {
      error: string;
      success: false;
    }
  | {
      hasSavedCilos: boolean;
      items: FacultyManagedCiloItem[];
      success: true;
    };

export type FacultyManagedCiloSaveInput = FacultyManagedCiloContext & {
  items: Array<Pick<FacultyManagedCiloItem, "description">>;
};

export type FacultyManagedCiloSaveResult =
  | {
      error: string;
      success: false;
    }
    | {
      items: FacultyManagedCiloItem[];
      success: true;
    };

export type CourseBoundPublicationCiloInput = {
  description: string;
  id: string;
};

export type CourseBoundCiloQuestionBindingInput = {
  ciloId: string;
  itemKey: string;
  sectionKey: string;
};

export type PublishCourseBoundEvaluationInput = {
  academicYear: string;
  activationAt?: Date | null;
  deadlineAt?: Date | null;
  deploymentName: string;
  semester: AcademicSemester;
  term: AcademicTerm;
  templateId: string;
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
