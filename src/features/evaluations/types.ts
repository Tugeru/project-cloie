import { AcademicSemester, AcademicTerm, CourseScope, DeploymentStatus } from "@prisma/client";

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

// ============================================================================
// Faculty Published Evaluations
// ============================================================================

export type FacultyPublishedEvaluationItem = {
  academicYear: string;
  activationAt: Date | null;
  courseCode: string;
  courseId: string;
  courseTitle: string;
  courseScope: CourseScope;
  deadlineAt: Date | null;
  deploymentName: string;
  evaluationId: string;
  majorId: string | null;
  majorName: string | null;
  programCode: string;
  programId: string;
  programName: string;
  publishedAt: Date | null;
  responseCount: number;
  semester: AcademicSemester;
  status: DeploymentStatus;
  targetYearLevels: string[];
  term: AcademicTerm;
  totalAssignments: number;
};

export type FacultyPublishedEvaluationCiloBinding = {
  ciloDescriptionSnapshot: string;
  ciloId: string | null;
  itemKey: string;
  questionPromptSnapshot: string;
  sectionKey: string;
};

export type FacultyPublishedEvaluationTarget = {
  programCode: string;
  programId: string;
  yearLevelId: string | null;
  yearLevelName: string | null;
};

export type FacultyEvaluationDetail = {
  academicYear: string;
  activationAt: Date | null;
  cilos: Array<{
    description: string;
    id: string;
    label: string;
  }>;
  courseInfo: {
    courseCode: string;
    courseScope: string;
    courseTitle: string;
    majorName: string | null;
    programCode: string;
    programName: string;
  };
  deadlineAt: Date | null;
  deploymentName: string;
  evaluationId: string;
  publishedAt: Date | null;
  responseCount: number;
  semester: AcademicSemester;
  status: DeploymentStatus;
  targets: FacultyPublishedEvaluationTarget[];
  templateBindings: FacultyPublishedEvaluationCiloBinding[];
  term: AcademicTerm;
  totalAssignments: number;
};

export type ListFacultyPublishedEvaluationsResult =
  | {
      error: string;
      success: false;
    }
  | {
      evaluations: FacultyPublishedEvaluationItem[];
      program: { code: string; id: string; name: string };
      success: true;
    };

export type GetFacultyEvaluationDetailResult =
  | {
      error: string;
      success: false;
    }
  | {
      detail: FacultyEvaluationDetail;
      success: true;
    };

export type CloseFacultyEvaluationResult =
  | {
      error: string;
      success: false;
    }
  | {
      success: true;
    };
