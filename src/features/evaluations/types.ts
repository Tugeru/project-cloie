import { AcademicSemester, AcademicTerm, CourseScope, DeploymentStatus, StudentSection, TargetStakeholder } from "@prisma/client";

export type { StudentSection };

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
  respondentIds?: string[]; // Final list of respondent IDs after preview/exclude
  section?: StudentSection | null;
  semester: AcademicSemester;
  targetPrograms?: string[]; // Multi-select for GE courses; falls back to publication context's program
  targetYearLevelId?: string; // Single year level; falls back to first item in yearLevelIds
  term: AcademicTerm;
  templateId: string;
  yearLevelIds?: string[]; // Deprecated: kept for backward compatibility
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
// Preview Respondents (Step 2 of publish flow)
// ============================================================================

export type PreviewRespondent = {
  email: string;
  firstName: string;
  lastName: string;
  majorId: string | null;
  majorName: string | null;
  programCode: string;
  programId: string;
  programName: string;
  section: StudentSection | null;
  studentId: string | null;
  userId: string;
  yearLevelId: string;
  yearLevelName: string;
};

export type PreviewCourseBoundRespondentsInput = {
  academicYear: string;
  section: StudentSection | null;
  targetPrograms: string[];
  targetYearLevelId: string;
};

export type PreviewCourseBoundRespondentsResult =
  | {
      error: string;
      success: false;
    }
  | {
      respondents: PreviewRespondent[];
      success: true;
      totalCount: number;
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

// ============================================================================
// Preview Central Deployment Respondents (Program Head publish flow)
// ============================================================================

export type PreviewCentralDeploymentInput = {
  academicYear: string;
  majorId?: string;
  programId: string;
  targetStakeholder: TargetStakeholder;
  yearLevelId?: string;
};

export type PreviewCentralDeploymentRespondent = {
  email: string;
  firstName: string;
  lastName: string;
  majorName: string | null;
  programCode: string | null;
  section: StudentSection | null;
  stakeholderType: TargetStakeholder;
  studentId: string | null;
  userId: string;
  yearLevelName: string | null;
};

export type PreviewCentralDeploymentResult =
  | {
      error: string;
      success: false;
    }
  | {
      respondents: PreviewCentralDeploymentRespondent[];
      success: true;
      totalCount: number;
    };
