import type { WorldInfo } from "@/types/dashboard";
import type { WorldCreationForm } from "@/types/world-creation";
import type { StoredWorldSettings, WorldSettings } from "@/types/world-settings";

import { getWorldTypeLabel } from "./world-creation";

export const WORLD_SETTINGS_STORAGE_KEY = "worlds-in-motion.world-settings.v1";

const WORLD_SETTINGS_CHANGED_EVENT = "worlds-in-motion:world-settings-changed";
const STORAGE_VERSION = 1;

function isStringRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readStringField(source: Record<string, unknown>, field: keyof WorldSettings) {
  return typeof source[field] === "string" ? source[field] : null;
}

export function parseStoredWorldSettings(value: string | null): WorldSettings | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!isStringRecord(parsed) || parsed.version !== STORAGE_VERSION) {
      return null;
    }

    const settingsValue = parsed.settings;
    if (!isStringRecord(settingsValue)) {
      return null;
    }

    const worldName = readStringField(settingsValue, "worldName");
    const worldType = readStringField(settingsValue, "worldType");
    const background = readStringField(settingsValue, "background");
    const worldRules = readStringField(settingsValue, "worldRules");
    const stylePreferences = readStringField(settingsValue, "stylePreferences");
    const prohibitedContent = readStringField(settingsValue, "prohibitedContent");
    const coreConflict = readStringField(settingsValue, "coreConflict");

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
  } catch {
    return null;
  }
}

export function getWorldSettingsSnapshot() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(WORLD_SETTINGS_STORAGE_KEY);
}

export function getStoredWorldSettings() {
  return parseStoredWorldSettings(getWorldSettingsSnapshot());
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

export function saveWorldSettings(settings: WorldSettings) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: StoredWorldSettings = {
    version: STORAGE_VERSION,
    settings,
  };

  window.localStorage.setItem(WORLD_SETTINGS_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event(WORLD_SETTINGS_CHANGED_EVENT));
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
