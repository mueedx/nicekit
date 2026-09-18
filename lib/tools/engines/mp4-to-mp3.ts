import type { ToolRunContext } from "../types";

const FFMPEG_CORE_VERSION = "0.12.10";

export async function mp4ToMp3(ctx: ToolRunContext): Promise<Blob> {
  const { files, onProgress } = ctx;
  if (files.length !== 1) {
    throw new Error("Select one MP4 file.");
  }

  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { fetchFile, toBlobURL } = await import("@ffmpeg/util");

  const ffmpeg = new FFmpeg();
  ffmpeg.on("progress", ({ progress }) => {
    onProgress?.(Math.min(95, Math.round(progress * 100)), "Converting…");
  });

  onProgress?.(5, "Loading encoder…");
  const baseURL = `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`;
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  const inputName = "input.mp4";
  const outputName = "output.mp3";
  const file = files[0];

  onProgress?.(15, "Reading video…");
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  onProgress?.(25, "Extracting audio…");
  await ffmpeg.exec([
    "-i",
    inputName,
    "-vn",
    "-acodec",
    "libmp3lame",
    "-q:a",
    "2",
    outputName,
  ]);

  onProgress?.(98, "Finalizing…");
  const data = await ffmpeg.readFile(outputName);
  const bytes =
    data instanceof Uint8Array
      ? data
      : new TextEncoder().encode(data as string);

  onProgress?.(100, "Done");
  return new Blob([bytes.buffer as ArrayBuffer], { type: "audio/mpeg" });
}
