/**
 * Outcomes Feature Module
 *
 * Manages GOs, CILOs, and outcome mapping.
 */

export {
  listProgramGOs,
  createGO,
  updateGO,
  deleteGO,
  reorderGOs,
  listCILOMappingsForProgram,
} from "./services/manage-program-head-outcomes";

export type {
  ProgramGOItem,
  ListProgramGOsResult,
  CourseCILOMappings,
  CILOMappingItem,
} from "./services/manage-program-head-outcomes";

export { createGOSchema, updateGOSchema } from "./schemas/go";
export type { CreateGOInput, UpdateGOInput } from "./schemas/go";
