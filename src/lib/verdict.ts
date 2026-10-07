/** Client-safe shape of an image verdict (mirrors src/lib/server/aiDetect.ts). */
export type Verdict = "ai" | "human" | "unclear";
export type DetectorName = "provenance" | "sightengine" | "claude";
export interface Signal {
  source: DetectorName;
  aiProbability: number;
  summary: string;
  details: string[];
}
export interface ImageVerdict {
  allowed: boolean;
  verdict: Verdict;
  aiProbability: number;
  threshold: number;
  detectors: DetectorName[];
  signals: Signal[];
  summary: string;
  hash: string;
}

export const DETECTOR_LABEL: Record<DetectorName, string> = {
  provenance: "File provenance",
  sightengine: "Sightengine classifier",
  claude: "Claude vision",
};
