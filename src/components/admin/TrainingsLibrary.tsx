"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FileText, Play, Plus } from "lucide-react";
import { createTrainingModule } from "@/lib/actions/trainings";
import { Button, Card, Input, Select } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

type Training = {
  id: string;
  title: string;
  type: string;
  contentUrl: string | null;
};

export function TrainingsLibrary({ trainings }: { trainings: Training[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"video" | "pdf">("video");
  const [contentUrl, setContentUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await createTrainingModule({
        title,
        type,
        contentUrl: contentUrl || undefined,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setShowForm(false);
      setTitle("");
      setContentUrl("");
      router.refresh();
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-text-muted">
          {trainings.length} training module{trainings.length === 1 ? "" : "s"} in the library
        </p>
        <Button type="button" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={13} aria-hidden="true" /> Add module
        </Button>
      </div>

      {showForm && (
        <Card variant="glass" className="p-5 mb-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Module title"
              className="h-9 text-xs"
            />
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as "video" | "pdf")}
              className="h-9 text-xs"
            >
              <option value="video">Video</option>
              <option value="pdf">PDF</option>
            </Select>
            <Input
              value={contentUrl}
              onChange={(e) => setContentUrl(e.target.value)}
              placeholder="Content URL (optional)"
              className="h-9 text-xs"
            />
            {error && <p className="text-xs text-danger">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isPending} loading={isPending}>
                Save module
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card variant="glass" className="overflow-hidden">
        {trainings.length === 0 ? (
          <p className="text-xs p-6 text-center text-text-muted">
            No training modules yet. Add one to get started.
          </p>
        ) : (
          trainings.map((t, i) => (
            <div
              key={t.id}
              className={cn(
                "flex items-center justify-between px-5 py-4",
                i > 0 && "border-t border-border-subtle",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-brand-50">
                  {t.type === "video" ? (
                    <Play size={14} className="text-brand-500" aria-hidden="true" />
                  ) : (
                    <FileText size={14} className="text-brand-500" aria-hidden="true" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">{t.title}</div>
                  <div className="text-xs capitalize text-text-muted">
                    {t.type}
                    {t.contentUrl ? ` · ${t.contentUrl}` : ""}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
