import type { WorldRecord } from "@/types/world-library";
import type { WorldRuntimeEvent, WorldRuntimeRunResult, WorldRuntimeState } from "@/types/world-runtime";
import type { WorldSeedAssets } from "@/types/world-seed-assets";
import type { WorldSettings } from "@/types/world-settings";

export type WorldRecordApi = WorldRecord & {
  createdAt: string;
  updatedAt: string;
};

export type WorldLibraryApi = {
  version: 1;
  activeWorldId: string | null;
  worlds: WorldRecordApi[];
};

export type WorldSettingsApi = WorldSettings & {
  updatedAt: string;
};

export type WorldSeedAssetsApi = WorldSeedAssets;

export type WorldRuntimeChapterDraftApi = {
  title: string;
  summary: string;
  tags: string[];
  updatedAt: string;
};

export type WorldRuntimeLatestChapterApi = {
  title: string;
  summary: string;
  tags: string[];
  date: string;
  updatedAt: string;
};

export type WorldRuntimeEventApi = WorldRuntimeEvent;

export type WorldEventApi = WorldRuntimeEventApi;

export type WorldRuntimeRunResultApi = WorldRuntimeRunResult;

export type WorldRuntimeStateApi = Omit<
  WorldRuntimeState,
  "chapterDraft" | "latestChapter" | "lastRunResult" | "events" | "updatedAt"
> & {
  events: WorldRuntimeEventApi[];
  chapterDraft: WorldRuntimeChapterDraftApi;
  latestChapter: WorldRuntimeLatestChapterApi | null;
  lastRunResult: WorldRuntimeRunResultApi | null;
  updatedAt: string;
};

export type CreateWorldRequestApi = {
  name: string;
  type: string;
  description: string;
  tags?: string[];
  active?: boolean;
};

export type SetActiveWorldRequestApi = {
  worldId: string;
};

export type SaveWorldSettingsRequestApi = WorldSettings;

export type SaveWorldSeedAssetsRequestApi = WorldSeedAssets;

export type CreateWorldEventRequestApi = {
  title: string;
  summary: string;
  type?: WorldRuntimeEventApi["type"];
  participants?: string[];
  location?: string;
  impact?: string;
  detail?: string;
  importance?: WorldRuntimeEventApi["importance"];
  date?: string | null;
};

export type PauseRuntimeRequestApi = {
  isPaused: boolean;
};

export type WorldSnapshotApi = {
  world: WorldRecordApi;
  settings: WorldSettingsApi | null;
  seedAssets: WorldSeedAssetsApi;
  runtime: WorldRuntimeStateApi;
};

export type LegacyImportRequestApi = {
  worldLibrary?: Record<string, unknown> | null;
  worldSettingsByWorldId?: Record<string, unknown> | null;
  worldSeedAssetsByWorldId?: Record<string, unknown> | null;
  worldRuntimeByWorldId?: Record<string, unknown> | null;
};

export type LegacyImportMappingApi = {
  sourceWorldId: string;
  targetWorldId: string;
};

export type LegacyImportResponseApi = {
  worldIdMap: LegacyImportMappingApi[];
  importedWorldIds: string[];
  skippedSections: string[];
};
