/**
 * Auth Feature Module
 *
 * Handles authentication, session management, role resolution,
 * and access control policies.
 */

// Services
export { resolveAuthSession, resolveAuthSessionFromUser } from "./services/resolve-auth-session";
export { buildAuthSessionSnapshot } from "./services/build-auth-session-snapshot";
export { resolvePrimaryRole } from "./services/resolve-primary-role";
export { resolvePostLoginDestination } from "./services/resolve-post-login-destination";

// Policies
export { ensureRoleAccess } from "./policies/ensure-role-access";
