import type { Reversible, Stakes } from "./types";

export interface Draft {
  title: string;
  familyId?: string;
  prose: string;
  claim: string;
  objective: string;
  choice: string;
  stakes: Stakes;
  reversible: Reversible;
  episode?: "reviewer";
}
