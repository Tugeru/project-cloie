/**
 * Canonical discriminated-union return type for service functions.
 * - On success: `{ success: true; data: T }`
 * - On failure: `{ success: false; error: string }`
 *
 * Use ServiceResult (no generic arg) for void-data success cases.
 */
export type ServiceResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
