"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth/guards";
import { logAudit } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { staffProfiles, users } from "@/lib/db/schema";

const profileSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().trim().min(2).max(120),
  title: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional(),
  timezone: z.string().trim().min(2).max(80),
  maxActiveCandidates: z.number().int().min(1).max(250),
  isAvailable: z.boolean(),
});

export async function updateStaffProfileAction(input: z.infer<typeof profileSchema>) {
  const admin = await requireAdminAuth();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { error: "Enter valid staff profile and capacity details." };

  const [staff] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, parsed.data.userId))
    .limit(1);
  if (!staff || !["admin", "recruiter"].includes(staff.role)) return { error: "Staff user not found." };

  await db
    .insert(staffProfiles)
    .values({
      userId: staff.id,
      fullName: parsed.data.fullName,
      title: parsed.data.title,
      phone: parsed.data.phone || null,
      timezone: parsed.data.timezone,
      maxActiveCandidates: parsed.data.maxActiveCandidates,
      isAvailable: parsed.data.isAvailable,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: staffProfiles.userId,
      set: {
        fullName: parsed.data.fullName,
        title: parsed.data.title,
        phone: parsed.data.phone || null,
        timezone: parsed.data.timezone,
        maxActiveCandidates: parsed.data.maxActiveCandidates,
        isAvailable: parsed.data.isAvailable,
        updatedAt: new Date(),
      },
    });

  await logAudit({
    actorUserId: admin.userId,
    action: "update_staff_profile",
    targetTable: "staff_profiles",
    targetId: staff.id,
  });
  revalidatePath("/admin/team");
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/dashboard");
  return {};
}
