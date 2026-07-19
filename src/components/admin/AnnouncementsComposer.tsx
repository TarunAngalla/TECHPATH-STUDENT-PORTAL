"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Megaphone, Plus } from "lucide-react";
import { createAnnouncement } from "@/lib/actions/announcements";
import { formatDate } from "@/lib/utils/dates";
import { Badge, Button, Card, Input, Select, Textarea } from "@/components/ui";

type Announcement = {
  id: string;
  title: string;
  body: string;
  targetCandidateId: string | null;
  createdAt: Date;
};

type CandidateOption = {
  id: string;
  fullName: string;
};

export function AnnouncementsComposer({
  announcements,
  candidates,
  requireTarget = false,
}: {
  announcements: Announcement[];
  candidates: CandidateOption[];
  requireTarget?: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetCandidateId, setTargetCandidateId] = useState(
    requireTarget && candidates[0] ? candidates[0].id : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await createAnnouncement({
        title,
        body,
        targetCandidateId: targetCandidateId || null,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setShowForm(false);
      setTitle("");
      setBody("");
      setTargetCandidateId(requireTarget && candidates[0] ? candidates[0].id : "");
      router.refresh();
    });
  };

  const candidateName = (id: string | null) => {
    if (!id) return "All candidates";
    return candidates.find((c) => c.id === id)?.fullName ?? "Specific candidate";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <p className="text-xs font-semibold text-text-muted">
          {announcements.length} announcement{announcements.length === 1 ? "" : "s"} published
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-semibold bg-brand-500 text-white flex items-center gap-1.5 shadow-xs hover:bg-brand-600 transition-colors"
        >
          <Plus size={13} aria-hidden="true" /> New Announcement
        </Button>
      </div>

      {showForm && (
        <Card variant="glass" className="p-6 mb-5 bg-white border border-border-strong/50 shadow-xs rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <h3 className="text-sm font-bold text-text-primary">Publish New Announcement</h3>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              className="h-9 text-xs border border-border-strong/50 shadow-xs focus:ring-1 focus:ring-brand-500 rounded-xl"
            />
            <Textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write the announcement details here..."
              rows={4}
              className="text-xs border border-border-strong/50 shadow-xs focus:ring-1 focus:ring-brand-500 rounded-xl bg-white"
            />
            <Select
              value={targetCandidateId}
              onChange={(e) => setTargetCandidateId(e.target.value)}
              required={requireTarget}
              className="h-9 text-xs border border-border-strong/50 shadow-xs focus:ring-1 focus:ring-brand-500 rounded-xl bg-white"
            >
              {!requireTarget && <option value="">Broadcast to: All Candidates</option>}
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  Target to: {c.fullName}
                </option>
              ))}
            </Select>
            {error && <p className="text-xs font-semibold text-danger">{error}</p>}
            <div className="flex gap-2.5 pt-1">
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="text-xs font-semibold bg-brand-500 text-white shadow-xs hover:bg-brand-600 transition-colors"
              >
                {isPending ? "Publishing…" : "Publish Now"}
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

      <div className="space-y-3.5">
        {announcements.length === 0 ? (
          <Card variant="glass" className="p-8 text-center bg-white border border-border-strong/50 shadow-xs rounded-2xl">
            <Megaphone size={24} className="mx-auto mb-2 text-text-muted" />
            <p className="text-xs text-text-muted font-semibold">No announcements yet.</p>
          </Card>
        ) : (
          announcements.map((a) => (
            <Card key={a.id} variant="glass" className="p-5 bg-white border border-border-strong/50 shadow-xs rounded-2xl transition-all duration-200 hover:border-border-strong">
              <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-500">
                    <Megaphone size={12} aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-bold text-text-primary leading-tight">{a.title}</h3>
                </div>
                <span className="text-[11px] text-text-muted font-semibold">
                  {formatDate(a.createdAt)}
                </span>
              </div>
              <p className="text-xs mb-3 whitespace-pre-wrap text-text-muted font-medium leading-relaxed pl-8 mt-1.5">{a.body}</p>
              <div className="pl-8">
                <Badge variant={a.targetCandidateId ? "accent" : "muted"} className="text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-border-strong/10">
                  {candidateName(a.targetCandidateId)}
                </Badge>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
