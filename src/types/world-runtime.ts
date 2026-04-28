export type WorldRuntimeEventType =
  | "plot"
  | "character"
  | "faction"
  | "location"
  | "secret"
  | "other";

export type WorldRuntimeEventImportance =
  | "normal"
  | "important"
  | "turning-point";

export type WorldRuntimeEvent = {
  id: string;
  date: string;
  title: string;
  summary: string;
  type: WorldRuntimeEventType;
  participants: string[];
  location: string;
  impact: string;
  detail: string;
  importance: WorldRuntimeEventImportance;
  createdAt: string;
};

export type WorldRuntimeChapterDraft = {
  title: string;
  summary: string;
  tags: string[];
  updatedAt: string;
};

export type WorldRuntimeLatestChapter = {
  title: string;
  summary: string;
  tags: string[];
  date: string;
  updatedAt: string;
};

export type WorldRuntimeState = {
  currentWorldDate: string;
  runDays: number;
  isPaused: boolean;
  events: WorldRuntimeEvent[];
  chapterDraft: WorldRuntimeChapterDraft;
  latestChapter: WorldRuntimeLatestChapter | null;
  updatedAt: string;
};

export type StoredWorldRuntimeState = {
  version: 2;
  byWorldId: Record<string, WorldRuntimeState>;
};

export type LegacyStoredWorldRuntimeState = {
  version: 1;
  state: WorldRuntimeState;
};
