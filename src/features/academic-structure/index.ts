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
export {
  listAdminProgramsSummary,
} from "./services/list-admin-programs-summary";
export type {
  AdminProgramSummaryItem,
  AdminProgramsKPI,
} from "./services/list-admin-programs-summary";
export {
  listAdminCoursesSummary,
} from "./services/list-admin-courses-summary";
export type {
  AdminCourseSummaryItem,
  AdminCoursesKPI,
  ProgramFilterOption,
} from "./services/list-admin-courses-summary";
export {
  listCourses,
  createCourse,
  updateCourse,
  toggleCourseActive,
  deleteCourse,
} from "./services/manage-courses";
export {
  listYearLevels,
  createYearLevel,
  updateYearLevel,
  deleteYearLevel,
} from "./services/manage-year-levels";

// Schemas
export {
  createProgramSchema,
  updateProgramSchema,
  createMajorSchema,
  updateMajorSchema,
} from "./schemas/program";
export { createCourseSchema, updateCourseSchema } from "./schemas/course";
export {
  createYearLevelSchema,
  updateYearLevelSchema,
} from "./schemas/year-level";
export type {
  CreateProgramInput,
  UpdateProgramInput,
  CreateMajorInput,
  UpdateMajorInput,
} from "./schemas/program";
export type { CreateCourseInput, UpdateCourseInput } from "./schemas/course";
export type {
  CreateYearLevelInput,
  UpdateYearLevelInput,
} from "./schemas/year-level";
