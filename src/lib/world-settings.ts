import type { WorldInfo } from "@/types/dashboard";
import type { WorldCreationForm } from "@/types/world-creation";
import type { StoredWorldSettings, WorldSettings } from "@/types/world-settings";

import {
  fetchWorldSettings as fetchWorldSettingsApi,
  saveWorldSettings as saveWorldSettingsApi,
} from "./api/world-state";
import { getWorldTypeLabel } from "./world-creation";

export const WORLD_SETTINGS_STORAGE_KEY = "worlds-in-motion.world-settings.v1";

const WORLD_SETTINGS_CHANGED_EVENT = "worlds-in-motion:world-settings-changed";
const LEGACY_STORAGE_VERSION = 1;
const STORAGE_VERSION = 2;

function isStringRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readStringField(source: Record<string, unknown>, field: keyof WorldSettings) {
  return typeof source[field] === "string" ? source[field] : null;
}

function parseWorldSettingsValue(value: unknown): WorldSettings | null {
  if (!isStringRecord(value)) {
    return null;
  }

  const worldName = readStringField(value, "worldName");
  const worldType = readStringField(value, "worldType");
  const background = readStringField(value, "background");
  const worldRules = readStringField(value, "worldRules");
  const stylePreferences = readStringField(value, "stylePreferences");
  const prohibitedContent = readStringField(value, "prohibitedContent");
  const coreConflict = readStringField(value, "coreConflict");

  if (
    worldName === null ||
    worldType === null ||
    background === null ||
    worldRules === null ||
    stylePreferences === null ||
    prohibitedContent === null ||
    coreConflict === null
  ) {
    return null;
  }

  return {
    worldName,
    worldType,
    background,
    worldRules,
    stylePreferences,
    prohibitedContent,
    coreConflict,
  };
}

function parseStoredWorldSettingsMap(value: string | null) {
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

    const byWorldId: Record<string, WorldSettings> = {};
    for (const [worldId, settingsValue] of Object.entries(byWorldIdValue)) {
      const parsedSettings = parseWorldSettingsValue(settingsValue);

      if (parsedSettings) {
        byWorldId[worldId] = parsedSettings;
      }
    }

    return byWorldId;
  } catch {
    return null;
  }
}

export function parseLegacyStoredWorldSettings(value: string | null): WorldSettings | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!isStringRecord(parsed) || parsed.version !== LEGACY_STORAGE_VERSION) {
      return null;
    }

    return parseWorldSettingsValue(parsed.settings);
  } catch {
    return null;
  }
}

export function parseStoredWorldSettings(
  value: string | null,
  worldId: string | null,
): WorldSettings | null {
  if (!worldId) {
    return null;
  }

  return parseStoredWorldSettingsMap(value)?.[worldId] ?? null;
}

export function getWorldSettingsSnapshot() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(WORLD_SETTINGS_STORAGE_KEY);
}

export function getStoredWorldSettings(worldId: string | null) {
  return parseStoredWorldSettings(getWorldSettingsSnapshot(), worldId);
}

export function writeWorldSettingsCache(worldId: string, settings: WorldSettings) {
  const byWorldId = parseStoredWorldSettingsMap(getWorldSettingsSnapshot()) ?? {};
  const payload: StoredWorldSettings = {
    version: STORAGE_VERSION,
    byWorldId: {
      ...byWorldId,
      [worldId]: settings,
    },
  };

  window.localStorage.setItem(WORLD_SETTINGS_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event(WORLD_SETTINGS_CHANGED_EVENT));
}

export function loadWorldSettings(worldId: string) {
  return fetchWorldSettingsApi(worldId)
    .then((settings) => {
      writeWorldSettingsCache(worldId, settings);
      return settings;
    })
    .catch((error: unknown) => {
      console.error("从后端读取世界设定失败", error);
      throw error;
    });
}

export function subscribeToWorldSettings(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  function handleStorage(event: StorageEvent) {
    if (event.key === WORLD_SETTINGS_STORAGE_KEY) {
      callback();
    }
  }

  window.addEventListener(WORLD_SETTINGS_CHANGED_EVENT, callback);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(WORLD_SETTINGS_CHANGED_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}

export function saveWorldSettings(
  worldId: string,
  settings: WorldSettings,
  options: { localOnly?: boolean } = {},
) {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (options.localOnly) {
    writeWorldSettingsCache(worldId, settings);
    return Promise.resolve();
  }

  return saveWorldSettingsApi(worldId, settings)
    .then((savedSettings) => {
      writeWorldSettingsCache(worldId, savedSettings);
    })
    .catch((error: unknown) => {
      console.error("保存世界设定到后端失败", error);
      throw error;
    });
}

export function worldCreationToWorldSettings(form: WorldCreationForm): WorldSettings {
  return {
    worldName: form.worldName,
    worldType: getWorldTypeLabel(form),
    background: form.background,
    worldRules: form.worldRules,
    stylePreferences: form.narrativeStyle,
    prohibitedContent: "",
    coreConflict: form.initialConflict,
  };
}

export function worldInfoToWorldSettings(world: WorldInfo): WorldSettings {
  const [firstTag, ...remainingTags] = world.tags;

  return {
    worldName: world.title,
    worldType: firstTag?.label ?? "未定类型",
    background: world.description,
    worldRules: "",
    stylePreferences: remainingTags.map((tag) => tag.label).join("、"),
    prohibitedContent: "",
    coreConflict: "",
  };
}

export function worldSettingsToWorldInfo(settings: WorldSettings): WorldInfo {
  const title = settings.worldName.trim() || "未命名世界";
  const description = settings.background.trim() || "这个世界的背景仍在落墨成形。";
  const worldType = settings.worldType.trim() || "未定类型";
  const stylePreferences = settings.stylePreferences.trim();

  return {
    title,
    description,
    tags: [
      { label: worldType },
      ...(stylePreferences ? [{ label: stylePreferences }] : []),
    ],
  };
}
