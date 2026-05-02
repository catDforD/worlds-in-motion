import type { Character, Relationship, StatItem } from "@/types/dashboard";
import type {
  StoredWorldSeedAssets,
  WorldSeedAssets,
  WorldSeedCharacter,
  WorldSeedFaction,
  WorldSeedLocation,
  WorldSeedRelationship,
} from "@/types/world-seed-assets";

import {
  fetchWorldSeedAssets as fetchWorldSeedAssetsApi,
  saveWorldSeedAssets as saveWorldSeedAssetsApi,
} from "./api/world-state";

export const WORLD_SEED_ASSETS_STORAGE_KEY =
  "worlds-in-motion.world-seed-assets.v1";

const WORLD_SEED_ASSETS_CHANGED_EVENT =
  "worlds-in-motion:world-seed-assets-changed";
const LEGACY_STORAGE_VERSION = 1;
const STORAGE_VERSION = 2;
const DEFAULT_TENSION = 50;

export const emptyWorldSeedAssets: WorldSeedAssets = {
  characters: [],
  factions: [],
  locations: [],
  relationships: [],
};

function isStringRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readStringField(source: Record<string, unknown>, field: string) {
  return typeof source[field] === "string" ? source[field] : null;
}

function clampTension(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_TENSION;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

function parseSeedArray<T>(
  value: unknown,
  parser: (item: Record<string, unknown>) => T | null,
) {
  if (!Array.isArray(value)) {
    return null;
  }

  const parsedItems: T[] = [];

  for (const item of value) {
    if (!isStringRecord(item)) {
      return null;
    }

    const parsed = parser(item);
    if (!parsed) {
      return null;
    }

    parsedItems.push(parsed);
  }

  return parsedItems;
}

function parseCharacterSeed(
  item: Record<string, unknown>,
): WorldSeedCharacter | null {
  const id = readStringField(item, "id");
  const name = readStringField(item, "name");
  const identity = readStringField(item, "identity");
  const goal = readStringField(item, "goal");
  const status = readStringField(item, "status");

  if (id === null || name === null || identity === null || goal === null || status === null) {
    return null;
  }

  return { id, name, identity, goal, status };
}

function parseFactionSeed(
  item: Record<string, unknown>,
): WorldSeedFaction | null {
  const id = readStringField(item, "id");
  const name = readStringField(item, "name");
  const stance = readStringField(item, "stance");
  const resources = readStringField(item, "resources");
  const conflict = readStringField(item, "conflict");

  if (id === null || name === null || stance === null || resources === null || conflict === null) {
    return null;
  }

  return { id, name, stance, resources, conflict };
}

function parseLocationSeed(
  item: Record<string, unknown>,
): WorldSeedLocation | null {
  const id = readStringField(item, "id");
  const name = readStringField(item, "name");
  const type = readStringField(item, "type");
  const importance = readStringField(item, "importance");

  if (id === null || name === null || type === null || importance === null) {
    return null;
  }

  return { id, name, type, importance };
}

function parseRelationshipSeed(
  item: Record<string, unknown>,
): WorldSeedRelationship | null {
  const id = readStringField(item, "id");
  const participantA = readStringField(item, "participantA");
  const participantB = readStringField(item, "participantB");
  const description = readStringField(item, "description");
  const note = readStringField(item, "note");

  if (
    id === null ||
    participantA === null ||
    participantB === null ||
    description === null ||
    note === null
  ) {
    return null;
  }

  return {
    id,
    participantA,
    participantB,
    description,
    note,
    tension: clampTension(item.tension),
  };
}

export function normalizeWorldSeedAssets(assets: WorldSeedAssets): WorldSeedAssets {
  return {
    characters: assets.characters.map((character) => ({
      ...character,
      id: character.id || createSeedId("character"),
    })),
    factions: assets.factions.map((faction) => ({
      ...faction,
      id: faction.id || createSeedId("faction"),
    })),
    locations: assets.locations.map((location) => ({
      ...location,
      id: location.id || createSeedId("location"),
    })),
    relationships: assets.relationships.map((relationship) => ({
      ...relationship,
      id: relationship.id || createSeedId("relationship"),
      tension: clampTension(relationship.tension),
    })),
  };
}

function parseWorldSeedAssetsValue(value: unknown) {
  if (!isStringRecord(value)) {
    return null;
  }

  const characters = parseSeedArray(value.characters, parseCharacterSeed);
  const factions = parseSeedArray(value.factions, parseFactionSeed);
  const locations = parseSeedArray(value.locations, parseLocationSeed);
  const relationships = parseSeedArray(
    value.relationships,
    parseRelationshipSeed,
  );

  if (
    characters === null ||
    factions === null ||
    locations === null ||
    relationships === null
  ) {
    return null;
  }

  return {
    characters,
    factions,
    locations,
    relationships,
  };
}

function parseStoredWorldSeedAssetsMap(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!isStringRecord(parsed) || parsed.version !== STORAGE_VERSION) {
      return null;
    }

    const byWorldIdValue = parsed.byWorldId;
    if (!isStringRecord(byWorldIdValue)) {
      return null;
    }

    const byWorldId: Record<string, WorldSeedAssets> = {};
    for (const [worldId, assetsValue] of Object.entries(byWorldIdValue)) {
      const parsedAssets = parseWorldSeedAssetsValue(assetsValue);

      if (parsedAssets) {
        byWorldId[worldId] = parsedAssets;
      }
    }

    return byWorldId;
  } catch {
    return null;
  }
}

export function parseLegacyStoredWorldSeedAssets(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!isStringRecord(parsed) || parsed.version !== LEGACY_STORAGE_VERSION) {
      return null;
    }

    return parseWorldSeedAssetsValue(parsed.assets);
  } catch {
    return null;
  }
}

export function parseStoredWorldSeedAssets(
  value: string | null,
  worldId: string | null,
) {
  if (!worldId) {
    return emptyWorldSeedAssets;
  }

  return parseStoredWorldSeedAssetsMap(value)?.[worldId] ?? emptyWorldSeedAssets;
}

export function getWorldSeedAssetsSnapshot() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(WORLD_SEED_ASSETS_STORAGE_KEY);
}

export function getStoredWorldSeedAssets(worldId: string | null) {
  return parseStoredWorldSeedAssets(getWorldSeedAssetsSnapshot(), worldId);
}

export function writeWorldSeedAssetsCache(
  worldId: string,
  assets: WorldSeedAssets,
) {
  const byWorldId = parseStoredWorldSeedAssetsMap(getWorldSeedAssetsSnapshot()) ?? {};
  const payload: StoredWorldSeedAssets = {
    version: STORAGE_VERSION,
    byWorldId: {
      ...byWorldId,
      [worldId]: normalizeWorldSeedAssets(assets),
    },
  };

  window.localStorage.setItem(
    WORLD_SEED_ASSETS_STORAGE_KEY,
    JSON.stringify(payload),
  );
  window.dispatchEvent(new Event(WORLD_SEED_ASSETS_CHANGED_EVENT));
}

export function loadWorldSeedAssets(worldId: string) {
  return fetchWorldSeedAssetsApi(worldId)
    .then((assets) => {
      writeWorldSeedAssetsCache(worldId, assets);
      return assets;
    })
    .catch((error: unknown) => {
      console.error("从后端读取世界内容种子失败", error);
      throw error;
    });
}

export function subscribeToWorldSeedAssets(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  function handleStorage(event: StorageEvent) {
    if (event.key === WORLD_SEED_ASSETS_STORAGE_KEY) {
      callback();
    }
  }

  window.addEventListener(WORLD_SEED_ASSETS_CHANGED_EVENT, callback);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(WORLD_SEED_ASSETS_CHANGED_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}

export function saveWorldSeedAssets(
  worldId: string,
  assets: WorldSeedAssets,
  options: { localOnly?: boolean } = {},
) {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (options.localOnly) {
    writeWorldSeedAssetsCache(worldId, assets);
    return Promise.resolve();
  }

  return saveWorldSeedAssetsApi(worldId, assets)
    .then((savedAssets) => {
      writeWorldSeedAssetsCache(worldId, savedAssets);
    })
    .catch((error: unknown) => {
      console.error("保存世界内容种子到后端失败", error);
      throw error;
    });
}

export function hasWorldSeedAssets(assets: WorldSeedAssets) {
  return (
    assets.characters.length > 0 ||
    assets.factions.length > 0 ||
    assets.locations.length > 0 ||
    assets.relationships.length > 0
  );
}

export function deriveSeedStats(
  assets: WorldSeedAssets,
  defaults: StatItem[],
) {
  const countsByLabel = new Map([
    ["角色", assets.characters.length],
    ["势力", assets.factions.length],
    ["地点", assets.locations.length],
  ]);

  return defaults.map((stat) => {
    const count = countsByLabel.get(stat.label);

    if (count === undefined || count === 0) {
      return stat;
    }

    return {
      ...stat,
      value: String(count),
    };
  });
}

export function deriveSeedCharacters(
  assets: WorldSeedAssets,
  defaults: Character[],
  defaultImageSrc: string,
) {
  if (assets.characters.length === 0) {
    return defaults;
  }

  return assets.characters.map((character, index) => ({
    name: character.name.trim() || "未命名角色",
    role: character.identity.trim() || "身份未定",
    goal: character.goal.trim() || "目标未定",
    status: character.status.trim() || "状态未定",
    influence: Math.min(92, 48 + ((index * 11) % 38)),
    imageSrc: defaultImageSrc,
  }));
}

export function deriveSeedRelationships(
  assets: WorldSeedAssets,
  defaults: Relationship[],
) {
  if (assets.relationships.length === 0) {
    return defaults;
  }

  return assets.relationships.map((relationship) => ({
    left: relationship.participantA.trim() || "未定参与方 A",
    right: relationship.participantB.trim() || "未定参与方 B",
    description: relationship.description.trim() || "关系未定",
    note: relationship.note.trim() || "暂无备注",
    tension: clampTension(relationship.tension),
  }));
}

export function createSeedId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
