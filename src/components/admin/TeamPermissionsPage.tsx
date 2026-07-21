"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, ShieldCheck, RefreshCw } from "lucide-react";
import { createStaffUser, updateStaffRole } from "@/lib/actions/settings";
import { formatDate } from "@/lib/utils/dates";
import { Badge, Button, Card, Input, Select } from "@/components/ui";

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
};

export function TeamPermissionsPage({
  staff,
  isAdmin,
}: {
  staff: StaffUser[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"recruiter" | "admin">("recruiter");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await createStaffUser(email, role, password);
      if (result.error) {
        setError(result.error);
        return;
      }
      setShowForm(false);
      setEmail("");
      setPassword("");
      router.refresh();
    });
  };

  const handleRoleChange = (userId: string, newRole: "recruiter" | "admin") => {
    startTransition(async () => {
      await updateStaffRole(userId, newRole);
      router.refresh();
    });
  };

  return (
    <div>
      <Card variant="glass" className="p-4 mb-5 flex items-start gap-3 bg-brand-50/15 border border-brand-500/20 rounded-2xl shadow-xs">
        <ShieldCheck size={16} className="text-brand-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
        <p className="text-xs text-text-primary leading-relaxed font-semibold">
          Every permission change on this console is logged. Only admins can create accounts or
          change roles.
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
        <Card variant="glass" className="p-6 mb-5 bg-white border border-border-strong/50 shadow-xs rounded-2xl">
          <form onSubmit={handleCreate} className="space-y-4 max-w-md">
            <h3 className="text-sm font-bold text-text-primary">Add New Team Member</h3>
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@thetechpath.com"
              className="h-9 text-xs border border-border-strong/50 shadow-xs focus:ring-1 focus:ring-brand-500 rounded-xl"
            />
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

      <Card variant="glass" className="overflow-hidden bg-white border border-border-strong/55 shadow-xs rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[480px]" aria-label="Team member privileges">
            <thead>
              <tr className="bg-surface/50 border-b border-border-strong/50">
                <th scope="col" className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">Email</th>
                <th scope="col" className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">Role</th>
                <th scope="col" className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">Added On</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((u) => (
                <tr key={u.id} className="border-t border-border-subtle align-middle bg-white transition-colors hover:bg-surface/30">
                  <td className="px-5 py-4 text-xs font-bold text-text-primary">{u.email}</td>
                  <td className="px-5 py-4">
                    {isAdmin ? (
                      <Select
                        value={u.role}
                        disabled={isPending}
                        onChange={(e) =>
                          handleRoleChange(u.id, e.target.value as "recruiter" | "admin")
                        }
                        className="h-8 text-xs w-auto border border-border-strong/50 shadow-xs focus:ring-1 focus:ring-brand-500 rounded-lg bg-white"
                      >
                        <option value="recruiter">Recruiter</option>
                        <option value="admin">Admin</option>
                      </Select>
                    ) : (
                      <Badge variant={u.role === "admin" ? "accent" : "muted"} className="capitalize text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                        {u.role}
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-text-muted">
                    {formatDate(u.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
