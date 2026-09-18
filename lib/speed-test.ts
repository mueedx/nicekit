import type { MeasurementConfig, Results } from "@cloudflare/speedtest";

export const SPEED_SOURCE = "speed.cloudflare.com";
export const SPEED_SOURCE_URL = "https://speed.cloudflare.com/";

export const SPEED_MEASUREMENTS = [
  { type: "latency", numPackets: 1 },
  { type: "download", bytes: 1e5, count: 1, bypassMinDuration: true },
  { type: "latency", numPackets: 20 },
  { type: "download", bytes: 1e5, count: 9 },
  { type: "download", bytes: 1e6, count: 8 },
  { type: "download", bytes: 1e7, count: 6 },
  { type: "upload", bytes: 1e5, count: 8 },
  { type: "upload", bytes: 1e6, count: 6 },
] as const satisfies readonly MeasurementConfig[];

export const LATENCY_ONLY_MEASUREMENTS = [
  { type: "latency", numPackets: 20 },
] as const satisfies readonly MeasurementConfig[];

export type SpeedSnapshot = {
  downloadMbps: number | null;
  uploadMbps: number | null;
  latencyMs: number | null;
  jitterMs: number | null;
  downLoadedLatencyMs: number | null;
  upLoadedLatencyMs: number | null;
  durationMs: number | null;
};

export const emptySnapshot: SpeedSnapshot = {
  downloadMbps: null,
  uploadMbps: null,
  latencyMs: null,
  jitterMs: null,
  downLoadedLatencyMs: null,
  upLoadedLatencyMs: null,
  durationMs: null,
};

function finiteNumber(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) return null;
  return value;
}

function bpsToMbps(bps: number | undefined): number | null {
  const value = finiteNumber(bps);
  if (value === null || value <= 0) return null;
  return value / 1e6;
}

export function snapshotFromResults(results: Results): SpeedSnapshot {
  const summary = results.getSummary();
  return {
    downloadMbps: bpsToMbps(summary.download ?? results.getDownloadBandwidth()),
    uploadMbps: bpsToMbps(summary.upload ?? results.getUploadBandwidth()),
    latencyMs:
      finiteNumber(summary.latency) ??
      finiteNumber(results.getUnloadedLatency()),
    jitterMs:
      finiteNumber(summary.jitter) ?? finiteNumber(results.getUnloadedJitter()),
    downLoadedLatencyMs:
      finiteNumber(summary.downLoadedLatency) ??
      finiteNumber(results.getDownLoadedLatency()),
    upLoadedLatencyMs:
      finiteNumber(summary.upLoadedLatency) ??
      finiteNumber(results.getUpLoadedLatency()),
    durationMs:
      finiteNumber(summary.totalDurationMs) ??
      finiteNumber(results.getTotalDurationMs()),
  };
}

export function formatMbps(mbps: number): string {
  if (mbps < 1) return mbps.toFixed(2);
  if (mbps < 10) return mbps.toFixed(1);
  return String(Math.round(mbps));
}

export function formatMs(ms: number): string {
  if (ms < 10) return ms.toFixed(1);
  return String(Math.round(ms));
}

export function formatDuration(ms: number): string {
  const seconds = ms / 1000;
  if (seconds < 10) return `${seconds.toFixed(1)} s`;
  return `${Math.round(seconds)} s`;
}

export function prefersLightData(): boolean {
  if (!("connection" in navigator)) return false;
  const connection = navigator.connection;
  if (typeof connection !== "object" || connection === null) return false;
  const saveData =
    "saveData" in connection && connection.saveData === true;
  const effectiveType =
    "effectiveType" in connection && typeof connection.effectiveType === "string"
      ? connection.effectiveType
      : "";
  return saveData || effectiveType === "slow-2g" || effectiveType === "2g";
}
