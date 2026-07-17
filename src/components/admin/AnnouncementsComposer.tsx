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
}: {
  announcements: Announcement[];
  candidates: CandidateOption[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetCandidateId, setTargetCandidateId] = useState("");
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
      setTargetCandidateId("");
      router.refresh();
    });
  };

  const candidateName = (id: string | null) => {
    if (!id) return "All candidates";
    return candidates.find((c) => c.id === id)?.fullName ?? "Specific candidate";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-text-muted">
          {announcements.length} announcement{announcements.length === 1 ? "" : "s"} published
        </p>
        <Button type="button" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={13} aria-hidden="true" /> New announcement
        </Button>
      </div>

      {showForm && (
        <Card variant="glass" className="p-5 mb-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
            />
            <Textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Message body"
              rows={4}
            />
            <Select
              value={targetCandidateId}
              onChange={(e) => setTargetCandidateId(e.target.value)}
              className="h-9 text-xs"
            >
              <option value="">All candidates</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} only
                </option>
              ))}
            </Select>
            {error && <p className="text-xs text-danger">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isPending} loading={isPending}>
                Publish
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <Card variant="glass" className="p-6 text-center">
            <Megaphone size={24} className="mx-auto mb-2 text-text-muted" />
            <p className="text-xs text-text-muted">No announcements yet.</p>
          </Card>
        ) : (
          announcements.map((a) => (
            <Card key={a.id} variant="glass" className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-sm font-semibold text-text-primary">{a.title}</h3>
                <span className="text-[11px] flex-shrink-0 text-text-muted">
                  {formatDate(a.createdAt)}
                </span>
              </div>
              <p className="text-xs mb-2 whitespace-pre-wrap text-text-muted">{a.body}</p>
              <Badge variant="default">{candidateName(a.targetCandidateId)}</Badge>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
