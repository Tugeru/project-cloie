import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/utils/site-url";
import { resolveAuthSessionFromUser } from "@/features/auth/services/resolve-auth-session";
import { resolvePostLoginDestination } from "@/features/auth/services/resolve-post-login-destination";
import { validateRoleDomain } from "@/features/auth/services/validate-role-domain";
import { SystemRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

const VALID_SELF_SERVICE_INTENTS: Record<string, SystemRole> = {
  student: SystemRole.STUDENT,
  alumni: SystemRole.ALUMNI,
  "industry-partner": SystemRole.INDUSTRY_PARTNER,
  "industry_partner": SystemRole.INDUSTRY_PARTNER,
  faculty: SystemRole.FACULTY,
};

const VALID_INTENTS: Record<string, SystemRole> = {
  ...VALID_SELF_SERVICE_INTENTS,
  secretary: SystemRole.SECRETARY,
  dean: SystemRole.DEAN,
  "program-head": SystemRole.PROGRAM_HEAD,
  "program_head": SystemRole.PROGRAM_HEAD,
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const siteUrl = getSiteUrl(origin);

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/login?error=auth-failure`);
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${siteUrl}/login?error=auth-failure`);
  }

  const email = data.user.email || "";
  const normalizedEmail = email.trim().toLowerCase();
  const intentParam = searchParams.get("intent");
  const authUserId = data.user.id;

  let dbUser = null;

  const bootstrapEmail = process.env.BOOTSTRAP_SECRETARY_EMAIL?.trim().toLowerCase();
  const isBootstrapEmail = bootstrapEmail && normalizedEmail === bootstrapEmail;

  if (isBootstrapEmail) {
    dbUser = await prisma.$transaction(async (tx) => {
      const adminExists = await tx.userRole.findFirst({
        where: { role: SystemRole.SECRETARY },
      });

      if (!adminExists) {
        const existingUser = await tx.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (existingUser) {
          await tx.user.update({
            where: { id: existingUser.id },
            data: { auth_user_id: authUserId },
          });
          await tx.userRole.upsert({
            where: { user_id: existingUser.id },
            update: { role: SystemRole.SECRETARY },
            create: { user_id: existingUser.id, role: SystemRole.SECRETARY },
          });
          return tx.user.findUnique({
            where: { id: existingUser.id },
            include: { roles: true },
          });
        } else {
          const meta = data.user.user_metadata || {};
          const googleFirstName = meta.given_name || meta.first_name || "System";
          const googleLastName = meta.family_name || meta.last_name || "Admin";

          return tx.user.create({
            data: {
              auth_user_id: authUserId,
              email: normalizedEmail,
              first_name: googleFirstName,
              last_name: googleLastName,
              roles: {
                create: {
                  role: SystemRole.SECRETARY,
                },
              },
            },
            include: { roles: true },
          });
        }
      }
      return null;
    });
  }

  // 1. Try to find an existing user by auth_user_id
  if (!dbUser) {
    dbUser = await prisma.user.findUnique({
      where: { auth_user_id: authUserId },
      include: { roles: true },
    });
  }

  // 2. If not found by auth_user_id, link by normalized email
  if (!dbUser && normalizedEmail) {
    const matchedUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { roles: true },
    });

    if (matchedUser) {
      const meta = data.user.user_metadata || {};
      const googleFirstName = meta.given_name || meta.first_name || "";
      const googleLastName = meta.family_name || meta.last_name || "";

      dbUser = await prisma.user.update({
        where: { id: matchedUser.id },
        data: {
          auth_user_id: authUserId,
          first_name: matchedUser.first_name || googleFirstName || "User",
          last_name: matchedUser.last_name || googleLastName || "Name",
        },
        include: { roles: true },
      });
    }
  }

  // 3. Perform validations based on role intent or stored role
  const targetRole = intentParam ? VALID_INTENTS[intentParam.toLowerCase()] : null;

  if (dbUser) {
    const userRole = dbUser.roles[0]?.role;

    if (userRole) {
      // Reject on role mismatch if intent was explicitly requested
      if (targetRole && userRole !== targetRole) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${siteUrl}/status/role-mismatch`);
      }

      // ACD-domain validation for internal roles
      const isInternal =
        userRole === SystemRole.STUDENT ||
        userRole === SystemRole.FACULTY ||
        userRole === SystemRole.SECRETARY ||
        userRole === SystemRole.DEAN ||
        userRole === SystemRole.PROGRAM_HEAD;
      if (isInternal) {
        const isACD =
          normalizedEmail.endsWith("@acd.edu.ph") ||
          normalizedEmail.endsWith("@acdeducation.com") ||
          isBootstrapEmail; // Bypass for bootstrap admin
        if (!isACD) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${siteUrl}/status/invalid-domain`);
        }
      }
    } else {
      // User exists but has no roles (i.e. roleless user)
      if (targetRole) {
        // Pre-provisioned roles cannot be self-claimed
        const isPreProvisioned =
          targetRole === SystemRole.SECRETARY ||
          targetRole === SystemRole.DEAN ||
          targetRole === SystemRole.PROGRAM_HEAD;
        if (isPreProvisioned) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${siteUrl}/status/pre-provisioning-required`);
        }

        // Validate domain for self-service roles
        const validation = validateRoleDomain(normalizedEmail, targetRole);
        if (!validation.valid) {
          await supabase.auth.signOut();
          return NextResponse.redirect(
            `${siteUrl}/status/invalid-domain?role=${encodeURIComponent(intentParam ?? "")}`
          );
        }

        // Create user role record
        const newRole = await prisma.userRole.create({
          data: {
            user_id: dbUser.id,
            role: targetRole,
          },
        });

        dbUser.roles = [newRole];
      }
    }
  } else {
    // New user signup
    if (intentParam) {
      if (targetRole) {
        // Pre-provisioned roles cannot be self-claimed
        const isPreProvisioned =
          targetRole === SystemRole.SECRETARY ||
          targetRole === SystemRole.DEAN ||
          targetRole === SystemRole.PROGRAM_HEAD;
        if (isPreProvisioned) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${siteUrl}/status/pre-provisioning-required`);
        }

        // Validate domain for self-service roles
        const validation = validateRoleDomain(normalizedEmail, targetRole);
        if (!validation.valid) {
          await supabase.auth.signOut();
          return NextResponse.redirect(
            `${siteUrl}/status/invalid-domain?role=${encodeURIComponent(intentParam ?? "")}`
          );
        }

        // Create domain user and their single role record
        const meta = data.user.user_metadata || {};
        const googleFirstName = meta.given_name || meta.first_name || "User";
        const googleLastName = meta.family_name || meta.last_name || "Name";

        dbUser = await prisma.user.create({
          data: {
            auth_user_id: authUserId,
            email: normalizedEmail,
            first_name: googleFirstName,
            last_name: googleLastName,
            roles: {
              create: {
                role: targetRole,
              },
            },
          },
          include: { roles: true },
        });
      } else {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${siteUrl}/status/invalid-domain`);
      }
    } else {
      // No intent and no user: redirect to portal
      await supabase.auth.signOut();
      return NextResponse.redirect(`${siteUrl}/portal`);
    }
  }

  const session = await resolveAuthSessionFromUser({
    id: authUserId,
    email: normalizedEmail,
  });

  const nextUrl = resolvePostLoginDestination({
    requestedPath: searchParams.get("next") ?? "/dashboard",
    intent: intentParam,
    activeRole: session?.activeRole ?? null,
    profileGate: session?.profileGate ?? { status: "ROLE_SELECTION_REQUIRED" },
  });

  return NextResponse.redirect(`${siteUrl}${nextUrl}`);
}

