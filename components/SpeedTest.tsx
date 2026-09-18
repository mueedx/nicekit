"use client";

import SpeedTestEngine from "@cloudflare/speedtest";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  emptySnapshot,
  formatDuration,
  formatMbps,
  formatMs,
  LATENCY_ONLY_MEASUREMENTS,
  prefersLightData,
  snapshotFromResults,
  SPEED_MEASUREMENTS,
  type SpeedSnapshot,
} from "@/lib/speed-test";
import { dash, FactBox, Pulse } from "./FactRow";

type SpeedState =
  | { kind: "idle" }
  | { kind: "run"; snapshot: SpeedSnapshot }
  | { kind: "done"; snapshot: SpeedSnapshot }
  | { kind: "fail" };

const SpeedTestContext = createContext<{
  snapshot: SpeedSnapshot | null;
  setSnapshot: (snapshot: SpeedSnapshot | null) => void;
}>({
  snapshot: null,
  setSnapshot: () => {},
});

export function SpeedTestProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<SpeedSnapshot | null>(null);
  const value = useMemo(
    () => ({ snapshot, setSnapshot }),
    [snapshot],
  );
  return (
    <SpeedTestContext.Provider value={value}>{children}</SpeedTestContext.Provider>
  );
}

function useSpeedSnapshot(): SpeedSnapshot | null {
  return useContext(SpeedTestContext).snapshot;
}

function Metric({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="font-mono text-[13px] tracking-[0.16em] text-muted uppercase">
        {label}
      </dt>
      <dd
        dir="ltr"
        className="mt-1 min-w-0 text-balance break-words text-base text-foreground"
      >
        {children}
      </dd>
    </div>
  );
}

function mbpsLabel(mbps: number | null, running: boolean): ReactNode {
  if (mbps === null) return dash;
  return (
    <span>
      {formatMbps(mbps)}
      <span className="ml-1 font-mono text-[13px] text-muted">
        {running ? "Mbps" : "Mbps p90"}
      </span>
    </span>
  );
}

function msLabel(ms: number | null | undefined): ReactNode {
  if (ms === null || ms === undefined) return dash;
  return `${formatMs(ms)} ms`;
}

export function AdvancedSpeedFacts() {
  const snapshot = useSpeedSnapshot();
  if (snapshot === null) {
    return (
      <>
        <FactBox label="Upload">{dash}</FactBox>
        <FactBox label="Jitter">{dash}</FactBox>
        <FactBox label="Loaded down">{dash}</FactBox>
        <FactBox label="Loaded up">{dash}</FactBox>
        <FactBox label="Duration">{dash}</FactBox>
      </>
    );
  }
  return (
    <>
      <FactBox label="Upload">{mbpsLabel(snapshot.uploadMbps, false)}</FactBox>
      <FactBox label="Jitter">{msLabel(snapshot.jitterMs)}</FactBox>
      <FactBox label="Loaded down">
        {msLabel(snapshot.downLoadedLatencyMs)}
      </FactBox>
      <FactBox label="Loaded up">{msLabel(snapshot.upLoadedLatencyMs)}</FactBox>
      <FactBox label="Duration">
        {snapshot.durationMs === null
          ? dash
          : formatDuration(snapshot.durationMs)}
      </FactBox>
    </>
  );
}

export function SpeedTest() {
  const { setSnapshot } = useContext(SpeedTestContext);
  const [state, setState] = useState<SpeedState>({ kind: "idle" });
  const engineRef = useRef<SpeedTestEngine | null>(null);

  useEffect(() => {
    return () => {
      engineRef.current?.pause();
      engineRef.current = null;
    };
  }, []);

  function start() {
    engineRef.current?.pause();
    setSnapshot(null);
    const light = prefersLightData();
    const engine = new SpeedTestEngine({
      autoStart: false,
      logAimApiUrl: null,
      measurements: [
        ...(light ? LATENCY_ONLY_MEASUREMENTS : SPEED_MEASUREMENTS),
      ],
    });
    engineRef.current = engine;
    setState({ kind: "run", snapshot: emptySnapshot });

    engine.onResultsChange = () => {
      const next = snapshotFromResults(engine.results);
      setState({ kind: "run", snapshot: next });
      setSnapshot(next);
    };
    engine.onFinish = () => {
      const snapshot = snapshotFromResults(engine.results);
      if (snapshot.downloadMbps === null && snapshot.latencyMs === null) {
        setSnapshot(null);
        setState({ kind: "fail" });
        return;
      }
      setSnapshot(snapshot);
      setState({ kind: "done", snapshot });
    };
    engine.play();
  }

  if (state.kind === "idle") {
    return (
      <div className="rounded-[2px] border border-border bg-surface px-3 py-3">
        <p className="font-mono text-[13px] tracking-[0.16em] text-muted uppercase">
          Speedtest
        </p>
        <button
          type="button"
          className="mt-2 inline-flex items-center gap-1.5 font-mono text-[13px] tracking-[0.16em] text-foreground uppercase transition-colors duration-200 hover:text-accent"
          onClick={start}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="none"
            className="size-3.5"
          >
            <path
              d="M5.5 3.5v9l8-4.5-8-4.5Z"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinejoin="miter"
            />
          </svg>
          Start
        </button>
      </div>
    );
  }

  const failed = state.kind === "fail";
  const snapshot = state.kind === "fail" ? emptySnapshot : state.snapshot;
  const running = state.kind === "run";

  return (
    <dl className="rounded-[2px] border border-border bg-surface px-3 py-3">
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Download">
          {failed && snapshot.downloadMbps === null ? (
            dash
          ) : snapshot.downloadMbps === null ? (
            <Pulse className="h-5 w-[4ch]" />
          ) : (
            <span>
              {formatMbps(snapshot.downloadMbps)}
              <span className="ml-1 font-mono text-[13px] text-muted">
                {running ? "Mbps" : "Mbps p90"}
              </span>
            </span>
          )}
        </Metric>
        <Metric label="Latency">
          {failed && snapshot.latencyMs === null ? (
            dash
          ) : snapshot.latencyMs === null ? (
            <Pulse className="h-5 w-[5ch]" />
          ) : (
            `${formatMs(snapshot.latencyMs)} ms`
          )}
        </Metric>
      </div>
    </dl>
  );
}
