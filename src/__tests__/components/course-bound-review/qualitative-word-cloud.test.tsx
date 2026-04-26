import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QualitativeWordCloud } from "@/features/analytics/components/qualitative-word-cloud";

const wordCloudPropsMock = vi.fn();
const disconnectMock = vi.fn();
let resizeCallback: ((entries: Array<{ contentRect: { width: number } }>) => void) | null = null;

vi.mock("@isoterik/react-word-cloud", () => ({
  WordCloud: (props: {
    width: number;
    height: number;
    words: Array<{ text: string; value: number }>;
  }) => {
    wordCloudPropsMock(props);
    return <div data-testid="word-cloud-mock" />;
  },
}));

describe("QualitativeWordCloud", () => {
  beforeEach(() => {
    wordCloudPropsMock.mockClear();
    disconnectMock.mockClear();
    resizeCallback = null;

    function ResizeObserverMock(callback: typeof resizeCallback) {
      resizeCallback = callback;
      return {
        disconnect: disconnectMock,
        observe: vi.fn(),
        unobserve: vi.fn(),
      };
    }

    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("clamps responsive width between mobile and desktop bounds", async () => {
    wordCloudPropsMock.mockClear();

    render(
      <QualitativeWordCloud title="Qualitative Feedback" tokens={[{ text: "clarity", value: 3 }]} />
    );

    act(() => {
      resizeCallback?.([{ contentRect: { width: 220 } }]);
    });

    await waitFor(() => {
      expect(wordCloudPropsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          height: 220,
          width: 280,
        })
      );
    });

    act(() => {
      resizeCallback?.([{ contentRect: { width: 640 } }]);
    });

    await waitFor(() => {
      expect(wordCloudPropsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          height: 352,
          width: 640,
        })
      );
    });

    act(() => {
      resizeCallback?.([{ contentRect: { width: 1440 } }]);
    });

    await waitFor(() => {
      expect(wordCloudPropsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          height: 420,
          width: 960,
        })
      );
    });
  });

  it("renders empty-state text when no tokens exist", () => {
    render(<QualitativeWordCloud title="Qualitative Feedback" tokens={[]} />);
    expect(screen.getByText("No qualitative responses yet.")).toBeInTheDocument();
  });
});
