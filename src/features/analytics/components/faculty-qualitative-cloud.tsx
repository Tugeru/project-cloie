"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QualitativeWordCloud } from "./qualitative-word-cloud";
import type { FacultyAnalyticsData, WordCloudToken } from "../types";

type FacultyQualitativeCloudProps = {
  data: FacultyAnalyticsData[];
};

export function FacultyQualitativeCloud({ data }: FacultyQualitativeCloudProps) {
  // Aggregate all qualitative texts and word cloud tokens
  const allTexts: string[] = [];
  const tokenMap = new Map<string, number>();

  for (const evalData of data) {
    allTexts.push(...evalData.qualitativeTexts);

    for (const token of evalData.wordCloudTokens) {
      tokenMap.set(token.text, (tokenMap.get(token.text) || 0) + token.value);
    }
  }

  const aggregatedTokens: WordCloudToken[] = Array.from(tokenMap.entries())
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 100); // Top 100 words

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Qualitative Feedback</CardTitle>
        <CardDescription>
          {allTexts.length > 0
            ? `Word cloud from ${allTexts.length} qualitative responses`
            : "No qualitative data available"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <QualitativeWordCloud title="" tokens={aggregatedTokens} />
      </CardContent>
    </Card>
  );
}
