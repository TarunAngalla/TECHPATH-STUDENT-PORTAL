"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FileText, Play, Plus } from "lucide-react";
import { toast } from "sonner";
import { createTrainingModule } from "@/lib/actions/trainings";
import { getDocumentViewerUrl, isGoogleDocUrl } from "@/lib/utils/documents";
import { extractYouTubeId } from "@/lib/utils/youtube";
import { Button, Card, Input, Select, Badge } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

type Training = {
  id: string;
  title: string;
  type: string;
  contentUrl: string | null;
};

export function TrainingsLibrary({
  trainings,
  canCreate = true,
}: {
  trainings: Training[];
  canCreate?: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"video" | "pdf">("video");
  const [contentUrl, setContentUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const youtubePreviewId = type === "video" ? extractYouTubeId(contentUrl) : null;
  const docPreview =
    type === "pdf" && contentUrl.trim()
      ? (() => {
          try {
            // Only preview once URL looks parseable
            new URL(contentUrl.trim());
            return getDocumentViewerUrl(contentUrl);
          } catch {
            return null;
          }
        })()
      : null;

  const resetForm = () => {
    setShowForm(false);
    setTitle("");
    setContentUrl("");
    setType("video");
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createTrainingModule({
        title,
        type,
        contentUrl,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      const assigned = result.assignedCount ?? 0;
      toast.success(
        assigned > 0
          ? `Module saved and assigned to ${assigned} candidate${assigned === 1 ? "" : "s"}`
          : "Module saved to the library",
      );
      resetForm();
      router.refresh();
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <p className="text-xs font-semibold text-text-muted">
          {trainings.length} training module{trainings.length === 1 ? "" : "s"} in the library
        </p>
        {canCreate && (
          <Button
            type="button"
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="text-xs font-semibold bg-brand-500 text-white flex items-center gap-1.5 shadow-xs hover:bg-brand-600 transition-colors"
          >
            <Plus size={13} aria-hidden="true" /> Add module
          </Button>
        )}
      </div>

      {showForm && canCreate && (
        <Card variant="glass" className="p-6 mb-5 bg-white border border-border-strong/50 shadow-xs rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary mb-2">Create New Training Module</h3>
            <p className="text-[11px] text-text-muted font-medium -mt-1 mb-1">
              New modules are automatically assigned to all candidates. YouTube videos mark complete
              when a candidate finishes watching.
            </p>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Module title"
              className="h-9 text-xs border border-border-strong/50 shadow-xs focus:ring-1 focus:ring-brand-500 rounded-xl"
            />
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as "video" | "pdf")}
              className="h-9 text-xs border border-border-strong/50 shadow-xs focus:ring-1 focus:ring-brand-500 rounded-xl bg-white"
            >
              <option value="video">Video Content</option>
              <option value="pdf">PDF / Document</option>
            </Select>
            <Input
              required
              type="url"
              value={contentUrl}
              onChange={(e) => setContentUrl(e.target.value)}
              placeholder={
                type === "video"
                  ? "YouTube URL (e.g. https://www.youtube.com/watch?v=...)"
                  : "Google Doc / Drive / PDF URL (share: Anyone with the link)"
              }
              className="h-9 text-xs border border-border-strong/50 shadow-xs focus:ring-1 focus:ring-brand-500 rounded-xl"
            />
            {type === "pdf" && (
              <p className="text-[11px] text-text-muted font-medium">
                Paste a Google Docs/Drive share link or a public PDF URL. Docs open in an in-site
                reader for candidates.
              </p>
            )}
            {youtubePreviewId && (
              <div className="relative w-full aspect-video max-w-md rounded-xl overflow-hidden border border-border-strong/40 bg-black">
                <iframe
                  title="YouTube preview"
                  src={`https://www.youtube.com/embed/${youtubePreviewId}`}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            {docPreview && (
              <div className="space-y-1.5">
                <iframe
                  title="Document preview"
                  src={docPreview.embedUrl}
                  className="w-full h-56 max-w-xl rounded-xl border border-border-strong/40 bg-white"
                  allow="autoplay; fullscreen"
                />
                {isGoogleDocUrl(contentUrl) && (
                  <p className="text-[11px] text-text-muted font-medium">
                    If preview is blank, set sharing to “Anyone with the link” → Viewer.
                  </p>
                )}
              </div>
            )}
            {error && <p className="text-xs font-semibold text-danger">{error}</p>}
            <div className="flex gap-2.5 pt-2">
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="text-xs font-semibold bg-brand-500 text-white shadow-xs hover:bg-brand-600 transition-colors"
              >
                {isPending ? "Saving Module…" : "Save Module"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetForm}
                className="text-xs font-semibold border border-border-strong/30 hover:bg-surface text-text-primary"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card variant="glass" className="overflow-hidden bg-white border border-border-strong/55 shadow-xs rounded-2xl">
        {trainings.length === 0 ? (
          <p className="text-xs p-8 text-center text-text-muted font-semibold">
            No training modules yet. Add one to get started.
          </p>
        ) : (
          trainings.map((t, i) => {
            const isVideo = t.type === "video";
            const ytId = t.contentUrl ? extractYouTubeId(t.contentUrl) : null;
            const isGoogle = t.contentUrl ? isGoogleDocUrl(t.contentUrl) : false;
            return (
              <div
                key={t.id}
                className={cn(
                  "flex items-center justify-between px-5 py-4 bg-white transition-colors hover:bg-surface/30 gap-4",
                  i > 0 && "border-t border-border-subtle",
                )}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-xs",
                      isVideo
                        ? "bg-blue-50 border-blue-100/50 text-blue-600"
                        : "bg-purple-50 border-purple-100/50 text-purple-600",
                    )}
                  >
                    {isVideo ? (
                      <Play size={14} aria-hidden="true" fill="currentColor" />
                    ) : (
                      <FileText size={14} aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-text-primary leading-tight truncate">
                      {t.title}
                    </div>
                    <div className="text-[11px] text-text-muted truncate mt-1 font-medium flex items-center gap-1.5">
                      <Badge
                        variant="muted"
                        className="px-1.5 py-0 rounded-md font-bold text-[9px] capitalize"
                      >
                        {t.type}
                      </Badge>
                      {ytId && (
                        <Badge
                          variant="danger"
                          className="px-1.5 py-0 rounded-md font-bold text-[9px]"
                        >
                          YouTube
                        </Badge>
                      )}
                      {isGoogle && (
                        <Badge
                          variant="accent"
                          className="px-1.5 py-0 rounded-md font-bold text-[9px]"
                        >
                          Google Doc
                        </Badge>
                      )}
                      {t.contentUrl && <span className="truncate">{t.contentUrl}</span>}
                    </div>
                  </div>
                </div>
                {ytId && (
                  <div className="hidden sm:block w-28 aspect-video rounded-lg overflow-hidden border border-border-strong/30 bg-black flex-shrink-0">
                    <iframe
                      title={`${t.title} preview`}
                      src={`https://www.youtube.com/embed/${ytId}`}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
