/**
 * Academic Structure Feature Module
 *
 * Manages programs, majors, courses, year levels,
 * and user affiliation records (faculty-program, PH-program, industry-program).
 */

// Services
export {
  listPrograms,
  getProgram,
  createProgram,
  updateProgram,
  toggleProgramActive,
  createMajor,
  updateMajor,
  toggleMajorActive,
  deleteMajor,
} from "./services/manage-programs";

// Schemas
export {
  createProgramSchema,
  updateProgramSchema,
  createMajorSchema,
  updateMajorSchema,
} from "./schemas/program";
export type {
  CreateProgramInput,
  UpdateProgramInput,
  CreateMajorInput,
  UpdateMajorInput,
} from "./schemas/program";
