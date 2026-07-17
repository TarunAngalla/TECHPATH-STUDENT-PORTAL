import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge, Skeleton, Avatar } from "@/components/ui";

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") {
    return <p className="p-8 text-text-muted">Not available in production.</p>;
  }

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gradient">Design System</h1>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="outline">Outline</Button>
          <Button loading>Loading</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Cards</h2>
        <div className="grid grid-cols-2 gap-4">
          <Card variant="glass" hover="lift">
            <CardHeader><CardTitle>Glass Card</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-text-muted">With hover lift</p></CardContent>
          </Card>
          <Card variant="solid">
            <CardHeader><CardTitle>Solid Card</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-text-muted">Elevated surface</p></CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Badges</h2>
        <div className="flex gap-2">
          <Badge>Default</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="accent">Accent</Badge>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Inputs</h2>
        <Input placeholder="Text input" className="max-w-sm" />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Skeleton</h2>
        <Skeleton className="h-12 w-full" />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Avatar</h2>
        <Avatar name="Ravi Kumar" size="lg" />
      </section>
    </div>
  );
}
