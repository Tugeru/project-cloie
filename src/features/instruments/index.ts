/**
 * Instruments Feature Module
 *
 * Manages evaluation instrument templates, versions,
 * and the program-level template builder.
 */

export {
  listBaselineTemplates,
  createBaselineTemplate,
  updateBaselineTemplate,
  toggleBaselineTemplateActive,
} from "./services/manage-instruments";

export {
  createBaselineTemplateSchema,
  updateBaselineTemplateSchema,
} from "./schemas/template";

// ─── Program Head Template Management ────────────────────────────────────────

export {
  listProgramHeadTemplates,
  createProgramHeadTemplate,
  updateProgramHeadTemplate,
  duplicateTemplate,
  toggleTemplateActive,
  toggleFacultyAccessible,
  getProgramHeadTemplate,
} from "./services/manage-program-head-templates";

export type {
  ProgramHeadTemplateItem,
  ListProgramHeadTemplatesResult,
} from "./services/manage-program-head-templates";

export {
  createProgramHeadTemplateSchema,
  updateProgramHeadTemplateSchema,
  templateStructureSchema,
  templateSectionSchema,
  templateQuestionSchema,
} from "./schemas/program-head-template";

export type {
  CreateProgramHeadTemplateInput,
  UpdateProgramHeadTemplateInput,
} from "./schemas/program-head-template";

// ─── Template Structure Types ────────────────────────────────────────────────

export type {
  QuestionType,
  LikertDescriptor,
  TemplateQuestion,
  TemplateSection,
  TemplateStructure,
} from "./types";

export { DEFAULT_LIKERT_5_DESCRIPTORS } from "./types";

// ─── Components ──────────────────────────────────────────────────────────────

export { TemplateBuilder } from "./components/template-builder";
export { ProgramHeadToolsPage } from "./components/program-head-tools-page";
