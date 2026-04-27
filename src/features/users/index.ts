/**
 * Users Feature Module
 *
 * Handles user management, profiles, student academic profiles,
 * faculty affiliations, and role assignment.
 */

export {
  listAdminUsers,
  listExternalStakeholderInvites,
  toggleUserActive,
  assignUserRole,
  revokeUserRole,
  upsertStudentAcademicContext,
  deleteStudentAcademicContext,
  createFacultyProgramAffiliation,
  deactivateFacultyProgramAffiliation,
  createProgramHeadAssignment,
  deactivateProgramHeadAssignment,
  upsertIndustryPartnerProfile,
  deleteIndustryPartnerProfile,
  createExternalInviteDraft,
  updateExternalInviteStatus,
} from "./services/manage-users";

export {
  assignRoleSchema,
  updateStudentAcademicContextSchema,
  createFacultyAffiliationSchema,
  createProgramHeadAssignmentSchema,
  updateIndustryPartnerProfileSchema,
  createExternalInviteDraftSchema,
} from "./schemas/admin-user";

export { createAdminUserSchema, type CreateAdminUserInput } from "./schemas/create-user";

export { createAdminUser } from "./services/create-admin-user";

export {
  listAdminUsersSummary,
  type AdminUserSummaryItem,
  type AdminUsersKPI,
  type AdminUsersSummaryResult,
} from "./services/list-admin-users-summary";

export { AdminUsersList } from "./components/admin-users-list";

export { AddUserForm } from "./components/add-user-form";
