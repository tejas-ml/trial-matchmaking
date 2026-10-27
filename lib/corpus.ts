import trialsJson from "@/data/trials.json";
import type { Trial } from "./types";

export const CORPUS: Trial[] = (trialsJson as Trial[]).map((t) => ({
  ...t,
  source: t.source ?? "corpus",
}));
