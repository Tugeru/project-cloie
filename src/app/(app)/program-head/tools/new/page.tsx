import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function ProgramHeadNewToolPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="space-y-3">
        <Link href="/program-head/tools" className="text-sm font-medium text-primary hover:underline">
          Back to Evaluation Tools
        </Link>
        <div>
          <h1 className="font-heading text-4xl font-bold tracking-tight">Template Builder</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Draft a program-scoped tool with section settings, Likert items, and guided
            open-ended prompts. This screen now mirrors the intended builder IA even
            before persistence is fully wired.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template Settings</CardTitle>
          <CardDescription>
            Define the identity and governance state of this template.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input id="template-name" defaultValue="Industry Partners Evaluation Tool" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-description">Template Description</Label>
            <Textarea
              id="template-description"
              rows={3}
              defaultValue="For evaluating industry partner performance and engagement."
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Template Status</Label>
              <Select defaultValue="active">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Faculty Access</Label>
              <Select defaultValue="disabled">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disabled">Program Head only</SelectItem>
                  <SelectItem value="enabled">Faculty accessible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Section Builder</CardTitle>
          <CardDescription>
            Prototype section-based question authoring with both supported question types.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4 rounded-xl border border-border p-6">
            <div className="space-y-2">
              <Label htmlFor="section-title">Section Title</Label>
              <Input id="section-title" defaultValue="Industry Readiness" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section-description">Section Description</Label>
              <Textarea
                id="section-description"
                rows={2}
                defaultValue="Gather feedback about communication, competence, and professional readiness."
              />
            </div>

            <div className="space-y-6 rounded-xl bg-surface-container-low p-5">
              <div className="space-y-4 rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Question 1
                  </p>
                  <Select defaultValue="likert">
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="likert">Likert Scale</SelectItem>
                      <SelectItem value="guided-open">Guided Open-Ended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="question-1">Prompt</Label>
                  <Input
                    id="question-1"
                    defaultValue="How would you rate the communication and responsiveness?"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-5">
                  {[
                    "Strongly Disagree",
                    "Disagree",
                    "Neutral",
                    "Agree",
                    "Strongly Agree",
                  ].map((descriptor) => (
                    <div key={descriptor} className="space-y-2">
                      <Label className="text-xs">Point</Label>
                      <Input defaultValue={descriptor} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Question 2
                  </p>
                  <Select defaultValue="guided-open">
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="likert">Likert Scale</SelectItem>
                      <SelectItem value="guided-open">Guided Open-Ended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="question-2">Prompt</Label>
                  <Input
                    id="question-2"
                    defaultValue="What recommendations do you have for the program?"
                  />
                </div>
                <div className="space-y-3">
                  <Label>Suggested Responses</Label>
                  <Textarea
                    rows={4}
                    defaultValue={[
                      "Strengthen communication and coordination during practicum.",
                      "Provide more industry-aligned technical preparation.",
                      "Improve professionalism coaching before deployment.",
                    ].join("\n")}
                  />
                </div>
              </div>
            </div>

            <Button variant="outline">Add Question</Button>
          </div>

          <Button variant="outline">Add Section</Button>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline">Save Draft</Button>
        <Button>Publish Template</Button>
      </div>
    </div>
  );
}
