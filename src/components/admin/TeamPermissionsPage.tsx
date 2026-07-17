"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import { createStaffUser, updateStaffRole } from "@/lib/actions/settings";
import { formatDate } from "@/lib/utils/dates";
import { Badge, Button, Card, Input, Select } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

function generateClientPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
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
      <Card variant="solid" className="p-4 mb-4 flex items-start gap-3 bg-brand-50 border-brand-500/10">
        <ShieldCheck size={16} className="text-brand-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
        <p className="text-xs text-text-primary">
          Every permission change on this console is logged. Only admins can create accounts or
          change roles.
        </p>
      </Card>

      {isAdmin && (
        <div className="flex justify-end mb-4">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setShowForm(!showForm);
              if (!password) setPassword(generateClientPassword());
            }}
          >
            <Plus size={13} aria-hidden="true" /> Add team member
          </Button>
        </div>
      )}

      {showForm && isAdmin && (
        <Card variant="glass" className="p-5 mb-4">
          <form onSubmit={handleCreate} className="space-y-3">
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@thetechpath.com"
              className="h-9 text-xs"
            />
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as "recruiter" | "admin")}
              className="h-9 text-xs"
            >
              <option value="recruiter">Recruiter</option>
              <option value="admin">Admin</option>
            </Select>
            <div className="flex gap-1.5">
              <Input
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 text-xs font-mono flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPassword(generateClientPassword())}
              >
                Regenerate
              </Button>
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
            <Button type="submit" size="sm" disabled={isPending} loading={isPending}>
              Create account
            </Button>
          </form>
        </Card>
      )}

      <Card variant="glass" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 480 }}>
            <thead>
              <tr className="bg-surface/60 border-b border-border-subtle">
                <th className="px-4 py-3 text-[11px] font-medium text-text-muted">Email</th>
                <th className="px-4 py-3 text-[11px] font-medium text-text-muted">Role</th>
                <th className="px-4 py-3 text-[11px] font-medium text-text-muted">Added</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((u, i) => (
                <tr key={u.id} className={cn(i > 0 && "border-t border-border-subtle")}>
                  <td className="px-4 py-3.5 text-sm text-text-primary">{u.email}</td>
                  <td className="px-4 py-3.5">
                    {isAdmin ? (
                      <Select
                        value={u.role}
                        disabled={isPending}
                        onChange={(e) =>
                          handleRoleChange(u.id, e.target.value as "recruiter" | "admin")
                        }
                        className="h-8 text-xs w-auto"
                      >
                        <option value="recruiter">Recruiter</option>
                        <option value="admin">Admin</option>
                      </Select>
                    ) : (
                      <Badge variant="default" className="capitalize">
                        {u.role}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-text-muted">
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
