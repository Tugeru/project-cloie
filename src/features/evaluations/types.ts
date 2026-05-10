import { AcademicSemester, AcademicTerm, CourseScope, DeploymentStatus, StudentSection, TargetStakeholder, YearLevel } from "@prisma/client";

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

/**
 * Phase 9: Simplified input using course assignment ID.
 * All class identity (term, program, year level, section) is resolved from the assignment.
 */
export type PublishCourseBoundEvaluationInput = {
  assignmentId: string;
  activationAt?: Date | null;
  deadlineAt?: Date | null;
  deploymentName: string;
  respondentIds?: string[]; // Final list of respondent IDs after preview/exclude
  templateId: string;
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
  yearLevel: YearLevel;
};

/**
 * Phase 9: Simplified preview input using course assignment ID.
 */
export type PreviewCourseBoundRespondentsInput = {
  assignmentId: string;
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
  targetYearLevels: YearLevel[];
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
  yearLevel: YearLevel | null;
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

/**
 * @deprecated Use PreviewCentralDeploymentInput with termInstanceId instead.
 * Legacy input kept for backward compatibility during Phase 7 transition.
 */
export type PreviewCentralDeploymentInputLegacy = {
  academicYear: string;
  majorId?: string;
  programId: string;
  targetStakeholder: TargetStakeholder;
  yearLevel?: YearLevel;
};

/**
 * Phase 7: Preview input supporting term instance ID for enrollment-based lookup.
 * Either termInstanceId OR academicYear should be provided.
 */
export type PreviewCentralDeploymentInput = {
  // Phase 7: term instance is the preferred way
  termInstanceId?: string;
  // Legacy fields (optional during transition)
  academicYear?: string;
  semester?: AcademicSemester;
  majorId?: string;
  programId: string;
  targetStakeholder: TargetStakeholder;
  yearLevel?: YearLevel;
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
  yearLevel: YearLevel | null;
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
