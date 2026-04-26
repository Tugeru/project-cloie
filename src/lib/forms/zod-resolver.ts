import type { FieldValues, ResolverResult, Resolver } from "react-hook-form";
import type { z } from "zod";

/**
 * Custom Zod resolver for react-hook-form.
 *
 * Bypasses @hookform/resolvers/zod which has a broken Zod version
 * detection mechanism that fails under Turbopack client bundling
 * with Zod 4's "classic" API.
 *
 * This resolver calls schema.safeParse() directly, avoiding all
 * internal version sniffing (_def.typeName, _zod checks).
 */
export function customZodResolver<T extends FieldValues>(schema: z.ZodType<T>): Resolver<T> {
  return async (values): Promise<ResolverResult<T>> => {
    const result = schema.safeParse(values);

    if (result.success) {
      return { values: result.data, errors: {} } as unknown as ResolverResult<T>;
    }

    // Convert Zod issues to react-hook-form's FieldErrors format
    const fieldErrors: Record<string, { type: string; message: string }> = {};

    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (path && !(path in fieldErrors)) {
        fieldErrors[path] = {
          type: issue.code,
          message: issue.message,
        };
      }
    }

    return { values: {}, errors: fieldErrors } as unknown as ResolverResult<T>;
  };
}
