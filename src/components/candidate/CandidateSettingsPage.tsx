"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { candidateChangePasswordAction } from "@/lib/actions/auth";
import {
  removeCandidateAvatar,
  updateCandidatePhone,
  uploadCandidateAvatar,
} from "@/lib/actions/settings";
import { Avatar, Button, Input } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-semibold mb-1.5 text-text-muted">
      {children}
    </label>
  );
}

function ReadOnlyField({ label, value, id }: { label: string; value: string; id: string }) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} value={value} readOnly className="bg-surface text-text-muted" />
    </div>
  );
}

export function CandidateSettingsPage({
  fullName,
  email,
  phone: initialPhone,
  avatarUrl: initialAvatarUrl,
  lastAdminReset,
  allowPhoneEdit = false,
}: {
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  lastAdminReset: Date | string | null;
  allowPhoneEdit?: boolean;
  storageMode?: "local" | "supabase";
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phone, setPhone] = useState(initialPhone);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSavePhone = () => {
    startTransition(async () => {
      const result = await updateCandidatePhone(phone);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Phone number saved.");
    });
  };

  const handlePasswordChange = () => {
    startTransition(async () => {
      const result = await candidateChangePasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated.");
    });
  };

  const handleAvatarSelected = (file: File | undefined) => {
    if (!file) return;
    const formData = new FormData();
    formData.set("avatar", file);
    startTransition(async () => {
      const result = await uploadCandidateAvatar(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setAvatarUrl(result.avatarUrl ?? null);
      toast.success("Profile photo updated.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  const handleRemoveAvatar = () => {
    startTransition(async () => {
      const result = await removeCandidateAvatar();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setAvatarUrl(null);
      toast.success("Profile photo removed.");
    });
  };

  return (
    <section aria-labelledby="settings-heading" className="w-full space-y-5">
      <h2 id="settings-heading" className="sr-only">
        Account Settings
      </h2>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
        <Card variant="glass" className="bg-white border border-border-strong/50 shadow-xs rounded-2xl h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-text-primary">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative shrink-0">
                <Avatar
                  name={fullName}
                  src={avatarUrl}
                  size="lg"
                  className="h-20 w-20 text-lg ring-2 ring-border-strong/40"
                />
                <span className="pointer-events-none absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white shadow-xs">
                  <Camera size={13} aria-hidden="true" />
                </span>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm font-semibold text-text-primary">{fullName}</p>
                <p className="text-xs text-text-muted">JPG, PNG, WEBP, or GIF · max 2 MB</p>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    id="avatar-upload"
                    onChange={(event) => handleAvatarSelected(event.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={isPending}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={13} aria-hidden="true" />
                    {avatarUrl ? "Change photo" : "Upload photo"}
                  </Button>
                  {avatarUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={isPending}
                      onClick={handleRemoveAvatar}
                    >
                      <Trash2 size={13} aria-hidden="true" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ReadOnlyField label="Full name" value={fullName} id="settings-name" />
              <ReadOnlyField label="Email address" value={email} id="settings-email" />
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="settings-phone">Phone number</FieldLabel>
                <Input
                  id="settings-phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  readOnly={!allowPhoneEdit}
                  className={cn(!allowPhoneEdit && "bg-surface text-text-muted")}
                />
              </div>
            </div>

            {allowPhoneEdit && (
              <Button type="button" size="sm" onClick={handleSavePhone} disabled={isPending} loading={isPending}>
                Save phone number
              </Button>
            )}
          </CardContent>
        </Card>

        <Card
          variant="glass"
          className="bg-white border border-border-strong/50 shadow-xs rounded-2xl h-full"
          aria-labelledby="password-section-heading"
        >
          <CardHeader className="pb-2">
            <CardTitle id="password-section-heading" className="text-base font-bold text-text-primary">
              Password
            </CardTitle>
            {lastAdminReset && (
              <p className="mt-1 text-xs text-text-muted">
                Last admin reset: {formatDateTime(lastAdminReset)}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <FieldLabel htmlFor="current-password">Current password</FieldLabel>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel htmlFor="new-password">New password</FieldLabel>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={8}
              />
            </div>
            <div>
              <FieldLabel htmlFor="confirm-password">Confirm new password</FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
              />
            </div>
            <Button
              type="button"
              onClick={handlePasswordChange}
              disabled={isPending || !currentPassword || !newPassword || !confirmPassword}
              loading={isPending}
            >
              Update password
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
