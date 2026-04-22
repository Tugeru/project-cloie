"use client";

import { useEffect, useRef, useState } from "react";
import { WordCloud } from "@isoterik/react-word-cloud";
import type { WordCloudConfig } from "@isoterik/react-word-cloud";
import type { WordCloudToken } from "@/features/analytics/types";

type QualitativeWordCloudProps = {
  title: string;
  tokens: WordCloudToken[];
};

const MIN_WIDTH = 280;
const MAX_WIDTH = 960;
const MIN_HEIGHT = 220;
const MAX_HEIGHT = 420;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildDimensions(containerWidth: number): Pick<WordCloudConfig, "height" | "width"> {
  const width = clamp(containerWidth, MIN_WIDTH, MAX_WIDTH);
  const height = clamp(Math.round(width * 0.55), MIN_HEIGHT, MAX_HEIGHT);
  return { height, width };
}

export function QualitativeWordCloud({ title, tokens }: QualitativeWordCloudProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState<Pick<WordCloudConfig, "height" | "width">>({
    height: 320,
    width: 360,
  });

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    if (typeof ResizeObserver === "undefined") {
      setDimensions(buildDimensions(containerRef.current.clientWidth));
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      setDimensions(buildDimensions(entry.contentRect.width));
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">{title}</h3>
      {tokens.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-sm text-text-muted">
          No qualitative responses yet.
        </div>
      ) : (
        <div ref={containerRef} className="rounded-xl border border-border p-3">
          <WordCloud
            words={tokens}
            width={dimensions.width}
            height={dimensions.height}
            font="ui-sans-serif, system-ui, sans-serif"
            fill="#1d4ed8"
            fontSize={(word) => 16 + word.value * 4}
            rotate={() => 0}
            enableTooltip
          />
        </div>
      )}
    </div>
  );
}
