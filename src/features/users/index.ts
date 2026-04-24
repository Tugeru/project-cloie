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
