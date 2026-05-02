import type { WorldInfo } from "@/types/dashboard";
import type {
  StoredWorldLibrary,
  WorldLibraryState,
  WorldRecord,
  WorldRecordInput,
} from "@/types/world-library";
import type { WorldSettings } from "@/types/world-settings";

import {
  parseLegacyStoredWorldRuntimeState,
  saveWorldRuntimeState,
  WORLD_RUNTIME_STORAGE_KEY,
} from "./world-runtime";
import {
  parseLegacyStoredWorldSeedAssets,
  saveWorldSeedAssets,
  WORLD_SEED_ASSETS_STORAGE_KEY,
} from "./world-seed-assets";
import {
  parseLegacyStoredWorldSettings,
  saveWorldSettings,
  WORLD_SETTINGS_STORAGE_KEY,
  worldCreationToWorldSettings,
} from "./world-settings";
import {
  parseStoredCreatedWorld,
  WORLD_CREATION_STORAGE_KEY,
} from "./world-creation";

export const WORLD_LIBRARY_STORAGE_KEY = "worlds-in-motion.world-library.v1";

const WORLD_LIBRARY_CHANGED_EVENT = "worlds-in-motion:world-library-changed";
const STORAGE_VERSION = 1;

const emptyWorldLibrary: WorldLibraryState = {
  version: STORAGE_VERSION,
  activeWorldId: null,
  worlds: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeWorldRecord(value: unknown): WorldRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id).trim();
  if (!id) {
    return null;
  }

  const name = readString(value.name, "未命名世界").trim() || "未命名世界";
  const type = readString(value.type, "未定类型").trim() || "未定类型";
  const description =
    readString(value.description, "这个世界的背景仍在落墨成形。").trim() ||
    "这个世界的背景仍在落墨成形。";
  const createdAt = readString(value.createdAt, new Date().toISOString());
  const updatedAt = readString(value.updatedAt, createdAt);

  return {
    id,
    name,
    type,
    description,
    tags: uniqueStrings(readStringArray(value.tags)),
    createdAt,
    updatedAt,
  };
}

function normalizeWorldLibrary(payload: StoredWorldLibrary): WorldLibraryState {
  const worlds = payload.worlds.flatMap((world) => {
    const parsed = normalizeWorldRecord(world);

    return parsed ? [parsed] : [];
  });
  const ids = new Set(worlds.map((world) => world.id));
  const activeWorldId =
    payload.activeWorldId && ids.has(payload.activeWorldId)
      ? payload.activeWorldId
      : worlds[0]?.id ?? null;

  return {
    version: STORAGE_VERSION,
    activeWorldId,
    worlds,
  };
}

export function parseStoredWorldLibrary(value: string | null): WorldLibraryState | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (
      !isRecord(parsed) ||
      parsed.version !== STORAGE_VERSION ||
      !Array.isArray(parsed.worlds)
    ) {
      return null;
    }

    return normalizeWorldLibrary({
      version: STORAGE_VERSION,
      activeWorldId:
        typeof parsed.activeWorldId === "string" ? parsed.activeWorldId : null,
      worlds: parsed.worlds as WorldRecord[],
    });
  } catch {
    return null;
  }
}

export function createWorldId(existingIds: Iterable<string> = []) {
  const taken = new Set(existingIds);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `world-${crypto.randomUUID()}`
        : `world-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    if (!taken.has(id)) {
      return id;
    }
  }

  return `world-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createWorldRecord(
  input: WorldRecordInput,
  existingIds: Iterable<string> = [],
): WorldRecord {
  const now = new Date().toISOString();
  const type = input.type.trim() || "未定类型";
  const styleTags = input.tags ?? [];

  return {
    id: createWorldId(existingIds),
    name: input.name.trim() || "未命名世界",
    type,
    description: input.description.trim() || "这个世界的背景仍在落墨成形。",
    tags: uniqueStrings([type, ...styleTags]),
    createdAt: now,
    updatedAt: now,
  };
}

function readLegacyCreatedWorld() {
  const fromLocalStorage = window.localStorage.getItem(WORLD_CREATION_STORAGE_KEY);
  const fromSessionStorage = window.sessionStorage.getItem(WORLD_CREATION_STORAGE_KEY);

  return parseStoredCreatedWorld(fromLocalStorage ?? fromSessionStorage);
}

function buildMigratedWorldRecord(worldId: string): WorldRecord {
  const createdWorld = readLegacyCreatedWorld();
  const legacySettings = parseLegacyStoredWorldSettings(
    window.localStorage.getItem(WORLD_SETTINGS_STORAGE_KEY),
  );
  const settings = legacySettings ?? (createdWorld ? worldCreationToWorldSettings(createdWorld) : null);
  const now = new Date().toISOString();

  return {
    id: worldId,
    name: settings?.worldName.trim() || createdWorld?.worldName.trim() || "迁移世界",
    type: settings?.worldType.trim() || "未定类型",
    description:
      settings?.background.trim() ||
      createdWorld?.background.trim() ||
      "这个世界来自旧版本本地状态迁移。",
    tags: uniqueStrings([
      settings?.worldType ?? "",
      settings?.stylePreferences ?? "",
    ]),
    createdAt: now,
    updatedAt: now,
  };
}

function migrateLegacySingleWorldState(): WorldLibraryState {
  const createdWorld = readLegacyCreatedWorld();
  const legacySettings = parseLegacyStoredWorldSettings(
    window.localStorage.getItem(WORLD_SETTINGS_STORAGE_KEY),
  );
  const legacySeedAssets = parseLegacyStoredWorldSeedAssets(
    window.localStorage.getItem(WORLD_SEED_ASSETS_STORAGE_KEY),
  );
  const legacyRuntime = parseLegacyStoredWorldRuntimeState(
    window.localStorage.getItem(WORLD_RUNTIME_STORAGE_KEY),
  );
  const shouldMigrate = Boolean(
    createdWorld || legacySettings || legacySeedAssets || legacyRuntime,
  );

  if (!shouldMigrate) {
    return emptyWorldLibrary;
  }

  const worldId = createWorldId();
  const world = buildMigratedWorldRecord(worldId);

  if (legacySettings) {
    saveWorldSettings(worldId, legacySettings, { localOnly: true });
  } else if (createdWorld) {
    saveWorldSettings(worldId, worldCreationToWorldSettings(createdWorld), {
      localOnly: true,
    });
  }

  if (legacySeedAssets) {
    saveWorldSeedAssets(worldId, legacySeedAssets, { localOnly: true });
  }

  if (legacyRuntime) {
    saveWorldRuntimeState(worldId, legacyRuntime);
  }

  return {
    version: STORAGE_VERSION,
    activeWorldId: worldId,
    worlds: [world],
  };
}

function writeWorldLibrary(library: WorldLibraryState, notify = true) {
  window.localStorage.setItem(WORLD_LIBRARY_STORAGE_KEY, JSON.stringify(library));

  if (notify) {
    window.dispatchEvent(new Event(WORLD_LIBRARY_CHANGED_EVENT));
  }
}

function ensureWorldLibraryInitialized() {
  const value = window.localStorage.getItem(WORLD_LIBRARY_STORAGE_KEY);
  const parsed = parseStoredWorldLibrary(value);

  if (parsed) {
    if (JSON.stringify(parsed) !== value) {
      writeWorldLibrary(parsed, false);
    }

    return parsed;
  }

  const next = value === null ? migrateLegacySingleWorldState() : emptyWorldLibrary;
  writeWorldLibrary(next, false);

  return next;
}

export function getWorldLibrarySnapshot() {
  if (typeof window === "undefined") {
    return null;
  }

  ensureWorldLibraryInitialized();

  return window.localStorage.getItem(WORLD_LIBRARY_STORAGE_KEY);
}

export function getStoredWorldLibrary() {
  if (typeof window === "undefined") {
    return emptyWorldLibrary;
  }

  return ensureWorldLibraryInitialized();
}

export function subscribeToWorldLibrary(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  function handleStorage(event: StorageEvent) {
    if (
      event.key === WORLD_LIBRARY_STORAGE_KEY ||
      event.key === WORLD_CREATION_STORAGE_KEY ||
      event.key === WORLD_SETTINGS_STORAGE_KEY ||
      event.key === WORLD_SEED_ASSETS_STORAGE_KEY ||
      event.key === WORLD_RUNTIME_STORAGE_KEY
    ) {
      callback();
    }
  }

  window.addEventListener(WORLD_LIBRARY_CHANGED_EVENT, callback);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(WORLD_LIBRARY_CHANGED_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}

export function saveWorldLibrary(library: WorldLibraryState) {
  if (typeof window === "undefined") {
    return library;
  }

  const normalized = normalizeWorldLibrary(library);
  writeWorldLibrary(normalized);

  return normalized;
}

export function addWorldRecord(record: WorldRecord) {
  const library = getStoredWorldLibrary();
  const existingIds = new Set(library.worlds.map((world) => world.id));
  const world = existingIds.has(record.id)
    ? { ...record, id: createWorldId(existingIds) }
    : record;
  const next = saveWorldLibrary({
    version: STORAGE_VERSION,
    activeWorldId: world.id,
    worlds: [...library.worlds, world],
  });

  return { library: next, world };
}

export function setActiveWorldId(worldId: string) {
  const library = getStoredWorldLibrary();
  const hasWorld = library.worlds.some((world) => world.id === worldId);

  if (!hasWorld) {
    return saveWorldLibrary({
      ...library,
      activeWorldId: library.activeWorldId ?? library.worlds[0]?.id ?? null,
    });
  }

  return saveWorldLibrary({
    ...library,
    activeWorldId: worldId,
  });
}

export function getActiveWorld(library: WorldLibraryState) {
  return (
    library.worlds.find((world) => world.id === library.activeWorldId) ??
    library.worlds[0] ??
    null
  );
}

export function worldRecordToWorldInfo(world: WorldRecord): WorldInfo {
  return {
    title: world.name,
    description: world.description,
    tags: world.tags.length > 0 ? world.tags.map((label) => ({ label })) : [{ label: world.type }],
  };
}

export function worldRecordToWorldSettings(world: WorldRecord): WorldSettings {
  const [firstTag, ...remainingTags] = world.tags;

  return {
    worldName: world.name,
    worldType: firstTag ?? world.type,
    background: world.description,
    worldRules: "",
    stylePreferences: remainingTags.join("、"),
    prohibitedContent: "",
    coreConflict: "",
  };
}
