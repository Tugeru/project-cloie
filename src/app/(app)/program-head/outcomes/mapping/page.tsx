import { InteractivePlaceholderForm } from "@/components/ui/interactive-placeholder-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProgramHeadOutcomeMappingPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Outcome Mapping Matrix</h1>
        <p className="text-sm text-text-secondary">
          Use this scaffold to validate the shape of the future CILO-to-PLO/GO matrix experience.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Matrix Preview</CardTitle>
          <CardDescription>Interactive persistence is deferred, but the page structure is ready for the real matrix.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="py-2">CILO</th>
                <th className="py-2">PLO1</th>
                <th className="py-2">PLO2</th>
                <th className="py-2">GO1</th>
              </tr>
            </thead>
            <tbody>
              {["CILO 1", "CILO 2", "CILO 3"].map((label, index) => (
                <tr key={label} className="border-b border-border/60">
                  <td className="py-3 font-medium">{label}</td>
                  <td className="py-3">{index === 0 ? "Mapped" : "—"}</td>
                  <td className="py-3">{index === 1 ? "Mapped" : "—"}</td>
                  <td className="py-3">{index === 2 ? "Mapped" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <InteractivePlaceholderForm
        title="Mapping Adjustment Stub"
        description="Capture the interaction copy for changing mappings without persisting yet."
        submitLabel="Validate Mapping Draft"
        fields={[
          { id: "cilo", kind: "input", label: "CILO", placeholder: "CILO 2" },
          { id: "plo", kind: "input", label: "Mapped PLO", placeholder: "PLO2" },
          { id: "go", kind: "input", label: "Mapped GO", placeholder: "GO1" },
        ]}
      />
    </div>
  );
}
