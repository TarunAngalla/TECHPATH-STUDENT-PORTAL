"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { createStaffUser, deleteStaffUser, updateStaffRole } from "@/lib/actions/settings";
import { updateStaffProfileAction } from "@/lib/actions/staff-profiles";
import { formatDate } from "@/lib/utils/dates";
import { Badge, Button, Card, Input, Select } from "@/components/ui";
import { AdminActionDialog } from "@/components/admin/AdminActionDialog";

function generateClientPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const values = new Uint32Array(12);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => chars[value % chars.length]).join("");
}

type StaffUser = {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
  fullName: string;
  title: string;
  phone: string | null;
  timezone: string;
  maxActiveCandidates: number;
  isAvailable: boolean;
};

export function TeamPermissionsPage({
  staff,
  isAdmin,
  staffEmailDomain,
}: {
  staff: StaffUser[];
  isAdmin: boolean;
  /** From ORG_EMAIL_DOMAIN / ADMIN_EMAIL_DOMAIN — required, no hardcoded brand. */
  staffEmailDomain: string;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"recruiter" | "admin">("recruiter");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [profileUser, setProfileUser] = useState<StaffUser | null>(null);
  const [roleChange, setRoleChange] = useState<{ userId: string; role: "recruiter" | "admin" } | null>(
    null,
  );
  const [deleteUser, setDeleteUser] = useState<StaffUser | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith(`@${staffEmailDomain.toLowerCase()}`)) {
      const message = `Staff accounts must use an @${staffEmailDomain} email address.`;
      setError(message);
      toast.error(message);
      return;
    }
    startTransition(async () => {
      try {
        const result = await createStaffUser(normalizedEmail, role, password);
        if (result?.error) {
          setError(result.error);
          toast.error(result.error);
          return;
        }
        setShowForm(false);
        setEmail("");
        setPassword("");
        toast.success("Team member created.");
        router.refresh();
      } catch {
        const message = "Could not create this staff account. Please try again.";
        setError(message);
        toast.error(message);
      }
    });
  };

  return (
    <div>
      <Card
        variant="glass"
        className="p-4 mb-5 flex items-start gap-3 bg-brand-50/15 border border-brand-500/20 rounded-2xl shadow-xs"
      >
        <ShieldCheck size={16} className="text-brand-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
        <p className="text-xs text-text-primary leading-relaxed font-semibold">
          Every permission change on this console is logged. Only admins can create accounts or change
          roles.
        </p>
      </Card>

      {isAdmin && (
        <div className="flex justify-end mb-5">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setShowForm(!showForm);
              if (!password) setPassword(generateClientPassword());
            }}
            className="text-xs font-semibold bg-brand-500 text-white flex items-center gap-1.5 shadow-xs hover:bg-brand-600 transition-colors"
          >
            <Plus size={13} aria-hidden="true" /> Add team member
          </Button>
        </div>
      )}

      {showForm && isAdmin && (
        <Card
          variant="glass"
          className="p-6 mb-5 bg-white border border-border-strong/50 shadow-xs rounded-2xl"
        >
          <form onSubmit={handleCreate} className="space-y-4 max-w-md">
            <h3 className="text-sm font-bold text-text-primary">Add New Team Member</h3>
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={`you@${staffEmailDomain}`}
              className="h-9 text-xs border border-border-strong/50 shadow-xs focus:ring-1 focus:ring-brand-500 rounded-xl"
            />
            <p className="text-[11px] text-text-muted -mt-2">
              Must use a company email (@{staffEmailDomain}). Other domains are blocked.
            </p>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as "recruiter" | "admin")}
              className="h-9 text-xs border border-border-strong/50 shadow-xs focus:ring-1 focus:ring-brand-500 rounded-xl bg-white"
            >
              <option value="recruiter">Recruiter Role</option>
              <option value="admin">Administrator Role</option>
            </Select>
            <div className="flex gap-2">
              <Input
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 text-xs font-mono flex-1 border border-border-strong/50 shadow-xs focus:ring-1 focus:ring-brand-500 rounded-xl"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPassword(generateClientPassword())}
                className="text-xs font-semibold border border-border-strong/30 hover:bg-surface text-text-primary shadow-xs"
              >
                <RefreshCw size={12} className="mr-1 inline-block" /> Regenerate
              </Button>
            </div>
            {error && <p className="text-xs font-semibold text-danger">{error}</p>}
            <div className="flex gap-2.5 pt-1">
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="text-xs font-semibold bg-brand-500 text-white shadow-xs hover:bg-brand-600 transition-colors"
              >
                {isPending ? "Creating Account…" : "Create Account"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
                className="text-xs font-semibold border border-border-strong/30 hover:bg-surface text-text-primary"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card
        variant="glass"
        className="overflow-hidden bg-white border border-border-strong/55 shadow-xs rounded-2xl"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[480px]" aria-label="Team member privileges">
            <thead>
              <tr className="bg-surface/50 border-b border-border-strong/50">
                <th
                  scope="col"
                  className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-muted"
                >
                  Team Member
                </th>
                <th
                  scope="col"
                  className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-muted"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-muted"
                >
                  Capacity
                </th>
                <th
                  scope="col"
                  className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-muted"
                >
                  Availability
                </th>
                <th
                  scope="col"
                  className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-muted"
                >
                  Added On
                </th>
                {isAdmin && (
                  <th
                    scope="col"
                    className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-muted"
                  >
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {staff.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-border-subtle align-middle bg-white transition-colors hover:bg-surface/30"
                >
                  <td className="px-5 py-4">
                    <div className="text-xs font-bold text-text-primary">{u.fullName}</div>
                    <div className="mt-0.5 text-[11px] text-text-muted">
                      {u.title} · {u.email}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {isAdmin ? (
                      <Select
                        value={u.role}
                        disabled={isPending}
                        onChange={(e) => {
                          const nextRole = e.target.value as "recruiter" | "admin";
                          if (nextRole === u.role) return;
                          setDialogError(null);
                          setRoleChange({ userId: u.id, role: nextRole });
                        }}
                        className="h-8 text-xs w-auto border border-border-strong/50 shadow-xs focus:ring-1 focus:ring-brand-500 rounded-lg bg-white"
                      >
                        <option value="recruiter">Recruiter</option>
                        <option value="admin">Admin</option>
                      </Select>
                    ) : (
                      <Badge
                        variant={u.role === "admin" ? "accent" : "muted"}
                        className="capitalize text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                      >
                        {u.role}
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-text-primary">
                    {u.maxActiveCandidates}
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={u.isAvailable ? "success" : "muted"} className="text-[10px]">
                      {u.isAvailable ? "Available" : "Unavailable"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-text-muted">
                    {formatDate(u.createdAt)}
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-4">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDialogError(null);
                          setProfileUser(u);
                        }}
                        disabled={isPending}
                      >
                        Edit profile
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AdminActionDialog
        open={profileUser !== null}
        title="Edit staff profile"
        description="These details appear on the candidate dashboard when this recruiter is assigned."
        fields={
          profileUser
            ? [
                {
                  name: "fullName",
                  label: "Full name",
                  required: true,
                  defaultValue: profileUser.fullName,
                },
                {
                  name: "title",
                  label: "Job title",
                  required: true,
                  defaultValue: profileUser.title,
                },
                {
                  name: "phone",
                  label: "Phone (optional)",
                  defaultValue: profileUser.phone ?? "",
                },
                {
                  name: "timezone",
                  label: "IANA timezone",
                  required: true,
                  defaultValue: profileUser.timezone,
                  helpText: "Example: America/Chicago",
                },
                {
                  name: "maxActiveCandidates",
                  label: "Maximum active candidates",
                  type: "number",
                  required: true,
                  min: 1,
                  defaultValue: profileUser.maxActiveCandidates,
                },
                {
                  name: "isAvailable",
                  label: "Available for new assignments",
                  type: "checkbox",
                  defaultValue: profileUser.isAvailable,
                },
              ]
            : []
        }
        confirmLabel="Save profile"
        pending={isPending}
        error={dialogError}
        dangerActionLabel={profileUser?.role === "recruiter" ? "Delete member" : undefined}
        onDangerAction={
          profileUser?.role === "recruiter"
            ? () => {
                setDialogError(null);
                setDeleteUser(profileUser);
                setProfileUser(null);
              }
            : undefined
        }
        onClose={() => {
          if (!isPending) {
            setProfileUser(null);
            setDialogError(null);
          }
        }}
        onConfirm={(values) => {
          if (!profileUser) return;
          const maxActiveCandidates = Number(values.maxActiveCandidates);
          if (!Number.isInteger(maxActiveCandidates) || maxActiveCandidates < 1) {
            setDialogError("Capacity must be a positive whole number.");
            return;
          }
          startTransition(async () => {
            const result = await updateStaffProfileAction({
              userId: profileUser.id,
              fullName: String(values.fullName ?? "").trim(),
              title: String(values.title ?? "").trim(),
              phone: String(values.phone ?? "").trim() || undefined,
              timezone: String(values.timezone ?? "").trim(),
              maxActiveCandidates,
              isAvailable: Boolean(values.isAvailable),
            });
            if (result.error) {
              setDialogError(result.error);
              toast.error(result.error);
              return;
            }
            setProfileUser(null);
            setDialogError(null);
            toast.success("Staff profile updated.");
            router.refresh();
          });
        }}
      />

      <AdminActionDialog
        open={deleteUser !== null}
        title="Delete team member"
        description={
          deleteUser
            ? `Remove ${deleteUser.fullName} (${deleteUser.email})? They will lose portal access immediately. Admin accounts cannot be deleted.`
            : undefined
        }
        confirmLabel="Delete member"
        danger
        pending={isPending}
        error={dialogError}
        onClose={() => {
          if (!isPending) {
            setDeleteUser(null);
            setDialogError(null);
          }
        }}
        onConfirm={() => {
          if (!deleteUser) return;
          startTransition(async () => {
            const result = await deleteStaffUser(deleteUser.id);
            if (result.error) {
              setDialogError(result.error);
              toast.error(result.error);
              return;
            }
            setDeleteUser(null);
            setDialogError(null);
            toast.success("Team member removed.");
            router.refresh();
          });
        }}
      />

      <AdminActionDialog
        open={roleChange !== null}
        title="Change staff role"
        description={
          roleChange
            ? `Change this account to ${roleChange.role}. Active recruiter assignments may block demoting a recruiter.`
            : undefined
        }
        confirmLabel="Update role"
        danger
        pending={isPending}
        error={dialogError}
        onClose={() => {
          if (!isPending) {
            setRoleChange(null);
            setDialogError(null);
          }
        }}
        onConfirm={() => {
          if (!roleChange) return;
          startTransition(async () => {
            const result = await updateStaffRole(roleChange.userId, roleChange.role);
            if (result.error) {
              setDialogError(result.error);
              toast.error(result.error);
              return;
            }
            setRoleChange(null);
            setDialogError(null);
            toast.success("Role updated.");
            router.refresh();
          });
        }}
      />
    </div>
  );
}
