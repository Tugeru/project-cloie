export type FacultyCourseContext = {
  courseCode: string;
  courseId: string;
  courseTitle: string;
  programCode: string;
  programId: string;
  programName: string;
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
  semester: string;
  term: string;
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
