import type { Role } from "@/lib/constants/roles";

export type ReviewerRole = Extract<Role, "FACULTY" | "PROGRAM_HEAD" | "DEAN">;

export type CourseBoundReviewListItem = {
  evaluationId: string;
  evaluationTitle: string;
  courseTitle: string;
  programLabel: string;
  academicYear: string;
  semester: string;
  term: string;
  deadlineAt: Date | null;
  responseCount: number;
  overallMean: number | null;
  reviewerRole: ReviewerRole;
};

export type CourseBoundReviewSectionQuestion = {
  itemKey: string;
  prompt: string;
  mean: number | null;
};

export type CourseBoundReviewSectionMetric = {
  id: string;
  name: string;
  mean: number | null;
  quantitativeQuestionCount: number;
  qualitativePromptCount: number;
  questions: CourseBoundReviewSectionQuestion[];
};

export type CourseBoundCiloMetric = {
  bindingId: string;
  ciloId: string | null;
  ciloLabel: string;
  ciloDescription: string;
  sectionKey: string;
  itemKey: string;
  questionPrompt: string;
  mean: number | null;
};

export type CourseBoundReviewResponseCard = {
  responseId: string;
  respondentLabel: string;
  submittedAt: Date;
  overallMean: number | null;
};

export type WordCloudToken = {
  text: string;
  value: number;
};

export type CourseBoundReviewDetail = {
  evaluationId: string;
  evaluationTitle: string;
  courseTitle: string;
  programLabel: string;
  academicYear: string;
  semester: string;
  term: string;
  deadlineAt: Date | null;
  responseCount: number;
  overallMean: number | null;
  reviewerRole: ReviewerRole;
  ciloMetrics: CourseBoundCiloMetric[];
  sections: CourseBoundReviewSectionMetric[];
  responseCards: CourseBoundReviewResponseCard[];
  wordCloudTokens: WordCloudToken[];
};

export type CourseBoundResponseQuantitativeEntry = {
  itemKey: string;
  prompt: string;
  rating: number;
};

export type CourseBoundResponseQualitativeEntry = {
  promptKey: string;
  prompt: string;
  text: string;
};

export type CourseBoundResponseSection = {
  id: string;
  name: string;
  mean: number | null;
  quantitativeResponses: CourseBoundResponseQuantitativeEntry[];
  qualitativeResponses: CourseBoundResponseQualitativeEntry[];
};

export type CourseBoundResponseReview = {
  responseId: string;
  respondentLabel: string;
  submittedAt: Date;
  evaluationId: string;
  evaluationTitle: string;
  courseTitle: string;
  programLabel: string;
  academicYear: string;
  overallMean: number | null;
  reviewerRole: ReviewerRole;
  sections: CourseBoundResponseSection[];
};
