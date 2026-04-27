import type {
  StoredWorldRuntimeState,
  WorldRuntimeChapterDraft,
  WorldRuntimeEvent,
  WorldRuntimeEventType,
  WorldRuntimeLatestChapter,
  WorldRuntimeState,
} from "@/types/world-runtime";

export const WORLD_RUNTIME_STORAGE_KEY =
  "worlds-in-motion.world-runtime-state.v1";

const WORLD_RUNTIME_CHANGED_EVENT = "worlds-in-motion:world-runtime-changed";
const STORAGE_VERSION = 1;
const DEFAULT_WORLD_DATE = "永泰二十三年 三月初八　辰时";
const DEFAULT_RUN_DAYS = 12;
const EVENT_TYPES = new Set<WorldRuntimeEventType>([
  "plot",
  "character",
  "faction",
  "location",
  "secret",
  "other",
]);
const CHINESE_DAYS = [
  "初一",
  "初二",
  "初三",
  "初四",
  "初五",
  "初六",
  "初七",
  "初八",
  "初九",
  "初十",
  "十一",
  "十二",
  "十三",
  "十四",
  "十五",
  "十六",
  "十七",
  "十八",
  "十九",
  "二十",
  "廿一",
  "廿二",
  "廿三",
  "廿四",
  "廿五",
  "廿六",
  "廿七",
  "廿八",
  "廿九",
  "三十",
];

export const defaultWorldRuntimeState: WorldRuntimeState = {
  currentWorldDate: DEFAULT_WORLD_DATE,
  runDays: DEFAULT_RUN_DAYS,
  isPaused: false,
  events: [],
  chapterDraft: {
    title: "",
    summary: "",
    tags: [],
    updatedAt: "",
  },
  latestChapter: null,
  updatedAt: "",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function readNonNegativeNumber(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.round(value));
}

function readTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((tag): tag is string => typeof tag === "string");
}

function normalizeEventType(value: unknown): WorldRuntimeEventType {
  if (typeof value === "string" && EVENT_TYPES.has(value as WorldRuntimeEventType)) {
    return value as WorldRuntimeEventType;
  }

  return "other";
}

function createRuntimeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseEvent(value: unknown): WorldRuntimeEvent | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = readString(value.title, "").trim();
  const summary = readString(value.summary, "").trim();

  if (!title || !summary) {
    return null;
  }

  return {
    id: readString(value.id, createRuntimeId("event")),
    date: readString(value.date, DEFAULT_WORLD_DATE),
    title,
    summary,
    type: normalizeEventType(value.type),
    createdAt: readString(value.createdAt, new Date().toISOString()),
  };
}

function parseEvents(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const parsed = parseEvent(item);
    return parsed ? [parsed] : [];
  });
}

function parseChapterDraft(value: unknown): WorldRuntimeChapterDraft {
  if (!isRecord(value)) {
    return defaultWorldRuntimeState.chapterDraft;
  }

  return {
    title: readString(value.title, ""),
    summary: readString(value.summary, ""),
    tags: readTags(value.tags),
    updatedAt: readString(value.updatedAt, ""),
  };
}

function parseLatestChapter(value: unknown): WorldRuntimeLatestChapter | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = readString(value.title, "").trim();
  const summary = readString(value.summary, "").trim();

  if (!title || !summary) {
    return null;
  }

  return {
    title,
    summary,
    tags: readTags(value.tags),
    date: readString(value.date, DEFAULT_WORLD_DATE),
    updatedAt: readString(value.updatedAt, ""),
  };
}

export function normalizeWorldRuntimeState(
  value: unknown,
): WorldRuntimeState {
  if (!isRecord(value)) {
    return defaultWorldRuntimeState;
  }

  return {
    currentWorldDate: readString(
      value.currentWorldDate,
      defaultWorldRuntimeState.currentWorldDate,
    ),
    runDays: readNonNegativeNumber(
      value.runDays,
      defaultWorldRuntimeState.runDays,
    ),
    isPaused: readBoolean(value.isPaused, defaultWorldRuntimeState.isPaused),
    events: parseEvents(value.events),
    chapterDraft: parseChapterDraft(value.chapterDraft),
    latestChapter: parseLatestChapter(value.latestChapter),
    updatedAt: readString(value.updatedAt, ""),
  };
}

export function parseStoredWorldRuntimeState(value: string | null) {
  if (!value) {
    return defaultWorldRuntimeState;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!isRecord(parsed)) {
      return defaultWorldRuntimeState;
    }

    if (parsed.version === STORAGE_VERSION && isRecord(parsed.state)) {
      return normalizeWorldRuntimeState(parsed.state);
    }

    return normalizeWorldRuntimeState(parsed);
  } catch {
    return defaultWorldRuntimeState;
  }
}

export function getWorldRuntimeSnapshot() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(WORLD_RUNTIME_STORAGE_KEY);
}

export function subscribeToWorldRuntime(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  function handleStorage(event: StorageEvent) {
    if (event.key === WORLD_RUNTIME_STORAGE_KEY) {
      callback();
    }
  }

  window.addEventListener(WORLD_RUNTIME_CHANGED_EVENT, callback);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(WORLD_RUNTIME_CHANGED_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}

export function hasStoredWorldRuntime(value: string | null) {
  return Boolean(value);
}

export function saveWorldRuntimeState(state: WorldRuntimeState) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: StoredWorldRuntimeState = {
    version: STORAGE_VERSION,
    state: normalizeWorldRuntimeState({
      ...state,
      updatedAt: new Date().toISOString(),
    }),
  };

  window.localStorage.setItem(WORLD_RUNTIME_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event(WORLD_RUNTIME_CHANGED_EVENT));
}

export function updateWorldRuntimeState(
  updater: (state: WorldRuntimeState) => WorldRuntimeState,
) {
  const current = parseStoredWorldRuntimeState(getWorldRuntimeSnapshot());
  const next = updater(current);
  saveWorldRuntimeState(next);

  return next;
}

export function toggleWorldRuntimePaused(state: WorldRuntimeState) {
  return {
    ...state,
    isPaused: !state.isPaused,
  };
}

export function advanceWorldDate(value: string) {
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  }

  const day = CHINESE_DAYS.find((candidate) => value.includes(candidate));
  if (!day) {
    return `${value} +1日`;
  }

  const currentIndex = CHINESE_DAYS.indexOf(day);
  const nextDay = CHINESE_DAYS[(currentIndex + 1) % CHINESE_DAYS.length];

  return value.replace(day, nextDay);
}

export function advanceWorldRuntimeOneDay(state: WorldRuntimeState) {
  return {
    ...state,
    currentWorldDate: advanceWorldDate(state.currentWorldDate),
    runDays: state.runDays + 1,
  };
}

export function appendWorldRuntimeEvent(
  state: WorldRuntimeState,
  input: {
    title: string;
    summary: string;
    type?: WorldRuntimeEventType;
  },
) {
  const title = input.title.trim();
  const summary = input.summary.trim();

  if (!title || !summary) {
    return null;
  }

  const createdAt = new Date().toISOString();
  const event: WorldRuntimeEvent = {
    id: createRuntimeId("event"),
    date: state.currentWorldDate,
    title,
    summary,
    type: input.type ?? "other",
    createdAt,
  };

  return {
    ...state,
    events: [event, ...state.events],
  };
}

export function updateWorldRuntimeChapterDraft(
  state: WorldRuntimeState,
  chapterDraft: Partial<WorldRuntimeChapterDraft>,
) {
  return {
    ...state,
    chapterDraft: {
      ...state.chapterDraft,
      ...chapterDraft,
      tags: chapterDraft.tags ?? state.chapterDraft.tags,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function updateWorldRuntimeLatestChapter(
  state: WorldRuntimeState,
  latestChapter: WorldRuntimeLatestChapter | null,
) {
  return {
    ...state,
    latestChapter: latestChapter
      ? {
          ...latestChapter,
          updatedAt: new Date().toISOString(),
        }
      : null,
  };
}

export function getRecentWorldRuntimeEvents(events: WorldRuntimeEvent[]) {
  return [...events].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt || left.date);
    const rightTime = Date.parse(right.createdAt || right.date);

    if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
      return right.createdAt.localeCompare(left.createdAt);
    }

    return rightTime - leftTime;
  });
}
