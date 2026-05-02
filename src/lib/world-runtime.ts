import type {
  StoredWorldRuntimeState,
  WorldRuntimeChapterDraft,
  WorldRuntimeEventImportance,
  WorldRuntimeEvent,
  WorldRuntimeEventType,
  WorldRuntimeLatestChapter,
  WorldRuntimeRunResult,
  WorldRuntimeRunResultCounts,
  WorldRuntimeRunResultDetails,
  WorldRuntimeState,
} from "@/types/world-runtime";

import {
  fetchWorldRuntime as fetchWorldRuntimeApi,
  updateRuntimePause as updateRuntimePauseApi,
  runWorldDay as runWorldDayApi,
  fetchWorldEvents as fetchWorldEventsApi,
  createWorldEvent as createWorldEventApi,
} from "./api/world-state";

export const WORLD_RUNTIME_STORAGE_KEY =
  "worlds-in-motion.world-runtime-state.v1";

const WORLD_RUNTIME_CHANGED_EVENT = "worlds-in-motion:world-runtime-changed";
const LEGACY_STORAGE_VERSION = 1;
const STORAGE_VERSION = 2;
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
const EVENT_IMPORTANCE_LEVELS = new Set<WorldRuntimeEventImportance>([
  "normal",
  "important",
  "turning-point",
]);
const RUN_RESULT_DETAIL_KEYS = [
  "events",
  "relationshipChanges",
  "secretsDiscovered",
  "goalChanges",
  "storyDrafts",
] as const;
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
  lastRunResult: null,
  updatedAt: "",
};

export type WorldRuntimeRunContext = {
  characters?: Array<{
    name: string;
    goal?: string;
    status?: string;
  }>;
  relationships?: Array<{
    left: string;
    right: string;
    description?: string;
    note?: string;
    tension?: number;
  }>;
  secrets?: Array<{
    text: string;
  }>;
  chapter?: {
    title: string;
    summary?: string;
  };
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

function readStringList(value: unknown) {
  const rawValues = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,，、\n]/)
      : [];

  return [
    ...new Set(
      rawValues
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function normalizeEventType(value: unknown): WorldRuntimeEventType {
  if (typeof value === "string" && EVENT_TYPES.has(value as WorldRuntimeEventType)) {
    return value as WorldRuntimeEventType;
  }

  return "other";
}

function normalizeEventImportance(value: unknown): WorldRuntimeEventImportance {
  if (
    typeof value === "string" &&
    EVENT_IMPORTANCE_LEVELS.has(value as WorldRuntimeEventImportance)
  ) {
    return value as WorldRuntimeEventImportance;
  }

  return "normal";
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
    participants: readStringList(value.participants),
    location: readString(value.location, "").trim(),
    impact: readString(value.impact, "").trim(),
    detail: readString(value.detail, "").trim() || summary,
    importance: normalizeEventImportance(value.importance),
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

function createEmptyRunResultCounts(): WorldRuntimeRunResultCounts {
  return {
    events: 0,
    relationshipChanges: 0,
    secretsDiscovered: 0,
    goalChanges: 0,
    storyDrafts: 0,
  };
}

function createEmptyRunResultDetails(): WorldRuntimeRunResultDetails {
  return {
    events: [],
    relationshipChanges: [],
    secretsDiscovered: [],
    goalChanges: [],
    storyDrafts: [],
  };
}

function parseRunResultCounts(value: unknown): WorldRuntimeRunResultCounts {
  if (!isRecord(value)) {
    return createEmptyRunResultCounts();
  }

  return {
    events: readNonNegativeNumber(value.events, 0),
    relationshipChanges: readNonNegativeNumber(value.relationshipChanges, 0),
    secretsDiscovered: readNonNegativeNumber(value.secretsDiscovered, 0),
    goalChanges: readNonNegativeNumber(value.goalChanges, 0),
    storyDrafts: readNonNegativeNumber(value.storyDrafts, 0),
  };
}

function parseRunResultDetails(value: unknown): WorldRuntimeRunResultDetails {
  if (!isRecord(value)) {
    return createEmptyRunResultDetails();
  }

  return RUN_RESULT_DETAIL_KEYS.reduce<WorldRuntimeRunResultDetails>(
    (details, key) => ({
      ...details,
      [key]: readStringList(value[key]).slice(0, 4),
    }),
    createEmptyRunResultDetails(),
  );
}

function parseRunResult(value: unknown): WorldRuntimeRunResult | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    (value.id !== undefined && typeof value.id !== "string") ||
    (value.date !== undefined && typeof value.date !== "string") ||
    (value.generatedAt !== undefined && typeof value.generatedAt !== "string") ||
    (value.runDay !== undefined &&
      (typeof value.runDay !== "number" || !Number.isFinite(value.runDay))) ||
    (value.counts !== undefined && !isRecord(value.counts)) ||
    (value.details !== undefined && !isRecord(value.details))
  ) {
    return null;
  }

  return {
    id: readString(value.id, createRuntimeId("run")),
    date: readString(value.date, DEFAULT_WORLD_DATE),
    runDay: readNonNegativeNumber(value.runDay, 0),
    generatedAt: readString(value.generatedAt, ""),
    counts: parseRunResultCounts(value.counts),
    details: parseRunResultDetails(value.details),
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
    lastRunResult: parseRunResult(value.lastRunResult),
    updatedAt: readString(value.updatedAt, ""),
  };
}

function parseStoredWorldRuntimeMap(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!isRecord(parsed) || parsed.version !== STORAGE_VERSION) {
      return null;
    }

    const byWorldIdValue = parsed.byWorldId;
    if (!isRecord(byWorldIdValue)) {
      return null;
    }

    const byWorldId: Record<string, WorldRuntimeState> = {};
    for (const [worldId, stateValue] of Object.entries(byWorldIdValue)) {
      if (isRecord(stateValue)) {
        byWorldId[worldId] = normalizeWorldRuntimeState(stateValue);
      }
    }

    return byWorldId;
  } catch {
    return null;
  }
}

export function parseLegacyStoredWorldRuntimeState(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!isRecord(parsed)) {
      return null;
    }

    if (parsed.version === LEGACY_STORAGE_VERSION && isRecord(parsed.state)) {
      return normalizeWorldRuntimeState(parsed.state);
    }

    return normalizeWorldRuntimeState(parsed);
  } catch {
    return null;
  }
}

export function parseStoredWorldRuntimeState(
  value: string | null,
  worldId: string | null,
) {
  if (!worldId) {
    return defaultWorldRuntimeState;
  }

  return parseStoredWorldRuntimeMap(value)?.[worldId] ?? defaultWorldRuntimeState;
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

export function hasStoredWorldRuntime(value: string | null, worldId: string | null) {
  if (!worldId) {
    return false;
  }

  return Boolean(parseStoredWorldRuntimeMap(value)?.[worldId]);
}

export function writeWorldRuntimeCache(worldId: string, state: WorldRuntimeState) {
  if (typeof window === "undefined") {
    return;
  }

  const byWorldId = parseStoredWorldRuntimeMap(getWorldRuntimeSnapshot()) ?? {};
  const payload: StoredWorldRuntimeState = {
    version: STORAGE_VERSION,
    byWorldId: {
      ...byWorldId,
      [worldId]: normalizeWorldRuntimeState({
        ...state,
        updatedAt: new Date().toISOString(),
      }),
    },
  };

  window.localStorage.setItem(WORLD_RUNTIME_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event(WORLD_RUNTIME_CHANGED_EVENT));
}

export function saveWorldRuntimeState(worldId: string, state: WorldRuntimeState) {
  writeWorldRuntimeCache(worldId, state);
}

export function loadWorldRuntimeFromBackend(worldId: string) {
  return fetchWorldRuntimeApi(worldId)
    .then((apiState) => {
      writeWorldRuntimeCache(worldId, apiState as WorldRuntimeState);
      return apiState;
    })
    .catch((error: unknown) => {
      console.error("从后端读取世界运行时状态失败", error);
      throw error;
    });
}

export function updateWorldRuntimePauseOnBackend(
  worldId: string,
  isPaused: boolean,
) {
  return updateRuntimePauseApi(worldId, { isPaused })
    .then((apiState) => {
      writeWorldRuntimeCache(worldId, apiState as WorldRuntimeState);
      return apiState;
    })
    .catch((error: unknown) => {
      console.error("更新世界暂停状态失败", error);
      throw error;
    });
}

export function advanceWorldDayOnBackend(worldId: string) {
  return runWorldDayApi(worldId)
    .then((apiState) => {
      writeWorldRuntimeCache(worldId, apiState as WorldRuntimeState);
      return apiState;
    })
    .catch((error: unknown) => {
      console.error("推进世界日期失败", error);
      throw error;
    });
}

export function loadWorldEventsFromBackend(worldId: string) {
  return fetchWorldEventsApi(worldId)
    .then((apiEvents) => {
      const current = parseStoredWorldRuntimeState(getWorldRuntimeSnapshot(), worldId);
      writeWorldRuntimeCache(worldId, { ...current, events: apiEvents });
      return apiEvents;
    })
    .catch((error: unknown) => {
      console.error("从后端读取世界事件失败", error);
      throw error;
    });
}

export function createWorldEventOnBackend(
  worldId: string,
  payload: {
    title: string;
    summary: string;
    type?: WorldRuntimeEventType;
    participants?: string[];
    location?: string;
    impact?: string;
    detail?: string;
    importance?: WorldRuntimeEventImportance;
    date?: string | null;
  },
) {
  return createWorldEventApi(worldId, payload)
    .then((apiEvent) => {
      const current = parseStoredWorldRuntimeState(getWorldRuntimeSnapshot(), worldId);
      const updatedEvents = [apiEvent, ...current.events];
      writeWorldRuntimeCache(worldId, { ...current, events: updatedEvents });
      return apiEvent;
    })
    .catch((error: unknown) => {
      console.error("创建世界事件失败", error);
      throw error;
    });
}

export function updateWorldRuntimeState(
  worldId: string,
  updater: (state: WorldRuntimeState) => WorldRuntimeState,
) {
  const current = parseStoredWorldRuntimeState(getWorldRuntimeSnapshot(), worldId);
  const next = updater(current);
  saveWorldRuntimeState(worldId, next);

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

function limitDetailText(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 96);
}

function pickByRunDay<T>(items: T[], runDay: number, offset = 0) {
  if (items.length === 0) {
    return null;
  }

  return items[(runDay + offset) % items.length];
}

function buildRunResult(
  state: WorldRuntimeState,
  date: string,
  runDay: number,
  context: WorldRuntimeRunContext = {},
): WorldRuntimeRunResult {
  const recentEvents = getRecentWorldRuntimeEvents(state.events);
  const eventCount =
    recentEvents.length > 0 ? Math.min(5, recentEvents.length) : context.characters?.length ? 1 : 0;
  const relationshipCount = context.relationships?.length
    ? Math.min(2, Math.max(1, context.relationships.length))
    : 0;
  const secretCount = context.secrets?.length ? 1 : 0;
  const goalCount = context.characters?.length ? 1 : 0;
  const storyDraftCount = context.chapter?.title ? 1 : 0;
  const character = pickByRunDay(context.characters ?? [], runDay);
  const relationship = pickByRunDay(context.relationships ?? [], runDay, 1);
  const secret = pickByRunDay(context.secrets ?? [], runDay, 2);

  const eventDetails =
    recentEvents.length > 0
      ? recentEvents.slice(0, eventCount).map((event) =>
          limitDetailText(`${event.title}：${event.summary}`),
        )
      : character
        ? [
            limitDetailText(
              `${character.name}围绕“${character.goal || "当前目标"}”推进了一条新线索。`,
            ),
          ]
        : [];
  const relationshipDetails = relationship
    ? [
        limitDetailText(
          `${relationship.left}与${relationship.right}的张力被重新校准：${
            relationship.description || relationship.note || "关系进入新的观察点"
          }。`,
        ),
      ]
    : [];
  const secretDetails = secret
    ? [limitDetailText(`${secret.text}出现可追踪痕迹，暂未写入事件日志。`)]
    : [];
  const goalDetails = character
    ? [
        limitDetailText(
          `${character.name}的目标“${character.goal || "未命名目标"}”进入${
            character.status || "新的"
          }阶段。`,
        ),
      ]
    : [];
  const storyDraftDetails = context.chapter?.title
    ? [
        limitDetailText(
          `围绕《${context.chapter.title}》生成一段本地草稿提示，等待后续整理。`,
        ),
      ]
    : [];

  return {
    id: createRuntimeId("run"),
    date,
    runDay,
    generatedAt: new Date().toISOString(),
    counts: {
      events: eventCount,
      relationshipChanges: relationshipCount,
      secretsDiscovered: secretCount,
      goalChanges: goalCount,
      storyDrafts: storyDraftCount,
    },
    details: {
      events: eventDetails,
      relationshipChanges: relationshipDetails,
      secretsDiscovered: secretDetails,
      goalChanges: goalDetails,
      storyDrafts: storyDraftDetails,
    },
  };
}

export function runWorldRuntimeOneDay(
  state: WorldRuntimeState,
  context?: WorldRuntimeRunContext,
) {
  const currentWorldDate = advanceWorldDate(state.currentWorldDate);
  const runDays = state.runDays + 1;

  return {
    ...state,
    currentWorldDate,
    runDays,
    lastRunResult: buildRunResult(state, currentWorldDate, runDays, context),
  };
}

export function advanceWorldRuntimeOneDay(
  state: WorldRuntimeState,
  context?: WorldRuntimeRunContext,
) {
  return runWorldRuntimeOneDay(state, context);
}

export function appendWorldRuntimeEvent(
  state: WorldRuntimeState,
  input: {
    title: string;
    summary: string;
    type?: WorldRuntimeEventType;
    participants?: string[];
    location?: string;
    impact?: string;
    detail?: string;
    importance?: WorldRuntimeEventImportance;
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
    type: normalizeEventType(input.type),
    participants: readStringList(input.participants),
    location: readString(input.location, "").trim(),
    impact: readString(input.impact, "").trim(),
    detail: readString(input.detail, "").trim() || summary,
    importance: normalizeEventImportance(input.importance),
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
    const leftTime = getEventSortTime(left);
    const rightTime = getEventSortTime(right);

    if (leftTime !== null && rightTime !== null) {
      return rightTime - leftTime;
    }

    if (leftTime !== null) {
      return -1;
    }

    if (rightTime !== null) {
      return 1;
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

function getEventSortTime(event: WorldRuntimeEvent) {
  const createdAtTime = Date.parse(event.createdAt);

  if (!Number.isNaN(createdAtTime)) {
    return createdAtTime;
  }

  const dateTime = Date.parse(event.date);

  return Number.isNaN(dateTime) ? null : dateTime;
}
