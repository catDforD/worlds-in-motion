import { apiRequest } from "@/lib/api/http";
import type {
  CreateWorldEventRequestApi,
  CreateWorldRequestApi,
  LegacyImportRequestApi,
  LegacyImportResponseApi,
  PauseRuntimeRequestApi,
  SaveWorldSeedAssetsRequestApi,
  SaveWorldSettingsRequestApi,
  SetActiveWorldRequestApi,
  WorldEventApi,
  WorldLibraryApi,
  WorldRuntimeStateApi,
  WorldSeedAssetsApi,
  WorldSettingsApi,
  WorldSnapshotApi,
  WorldRecordApi,
} from "@/types/world-state-api";

export function fetchWorldLibrary() {
  return apiRequest<WorldLibraryApi>("/world-library");
}

export function createWorld(payload: CreateWorldRequestApi) {
  return apiRequest<WorldRecordApi>("/worlds", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchWorldSnapshot(worldId: string) {
  return apiRequest<WorldSnapshotApi>(`/worlds/${worldId}`);
}

export function setActiveWorld(payload: SetActiveWorldRequestApi) {
  return apiRequest<WorldLibraryApi>("/world-library/active", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchWorldSettings(worldId: string) {
  return apiRequest<WorldSettingsApi>(`/worlds/${worldId}/settings`);
}

export function saveWorldSettings(worldId: string, payload: SaveWorldSettingsRequestApi) {
  return apiRequest<WorldSettingsApi>(`/worlds/${worldId}/settings`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function fetchWorldSeedAssets(worldId: string) {
  return apiRequest<WorldSeedAssetsApi>(`/worlds/${worldId}/seed-assets`);
}

export function saveWorldSeedAssets(
  worldId: string,
  payload: SaveWorldSeedAssetsRequestApi,
) {
  return apiRequest<WorldSeedAssetsApi>(`/worlds/${worldId}/seed-assets`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function fetchWorldRuntime(worldId: string) {
  return apiRequest<WorldRuntimeStateApi>(`/worlds/${worldId}/runtime`);
}

export function updateRuntimePause(
  worldId: string,
  payload: PauseRuntimeRequestApi,
) {
  return apiRequest<WorldRuntimeStateApi>(`/worlds/${worldId}/runtime/pause`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function runWorldDay(worldId: string) {
  return apiRequest<WorldRuntimeStateApi>(`/worlds/${worldId}/runtime/run-day`, {
    method: "POST",
  });
}

export function fetchWorldEvents(worldId: string) {
  return apiRequest<WorldEventApi[]>(`/worlds/${worldId}/events`);
}

export function createWorldEvent(
  worldId: string,
  payload: CreateWorldEventRequestApi,
) {
  return apiRequest<WorldEventApi>(`/worlds/${worldId}/events`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function importLegacyWorldState(payload: LegacyImportRequestApi) {
  return apiRequest<LegacyImportResponseApi>("/import/local-state", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

