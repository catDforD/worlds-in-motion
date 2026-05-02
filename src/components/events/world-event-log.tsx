"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Badge,
  CalendarDays,
  Flag,
  ListOrdered,
  MapPin,
  PlusCircle,
  ScrollText,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  getActiveWorld,
  getWorldLibrarySnapshot,
  parseStoredWorldLibrary,
  subscribeToWorldLibrary,
} from "@/lib/world-library";
import {
  createWorldEventOnBackend,
  getRecentWorldRuntimeEvents,
  getWorldRuntimeSnapshot,
  loadWorldEventsFromBackend,
  parseStoredWorldRuntimeState,
  subscribeToWorldRuntime,
} from "@/lib/world-runtime";
import type { WorldLibraryState } from "@/types/world-library";
import type {
  WorldRuntimeEvent,
  WorldRuntimeEventImportance,
  WorldRuntimeEventType,
} from "@/types/world-runtime";

const emptyWorldLibrary: WorldLibraryState = {
  version: 1,
  activeWorldId: null,
  worlds: [],
};

const eventTypeLabels: Record<WorldRuntimeEventType, string> = {
  plot: "剧情",
  character: "角色",
  faction: "势力",
  location: "地点",
  secret: "秘密",
  other: "其他",
};

const importanceLabels: Record<WorldRuntimeEventImportance, string> = {
  normal: "普通",
  important: "重要",
  "turning-point": "转折",
};

const eventTypeOptions: Array<{
  value: WorldRuntimeEventType;
  label: string;
}> = [
  { value: "plot", label: "剧情" },
  { value: "character", label: "角色" },
  { value: "faction", label: "势力" },
  { value: "location", label: "地点" },
  { value: "secret", label: "秘密" },
  { value: "other", label: "其他" },
];

const eventImportanceOptions: Array<{
  value: WorldRuntimeEventImportance;
  label: string;
}> = [
  { value: "normal", label: "普通" },
  { value: "important", label: "重要" },
  { value: "turning-point", label: "转折" },
];

type EventCreateInput = {
  title: string;
  summary: string;
  type: WorldRuntimeEventType;
  participants?: string[];
  location?: string;
  impact?: string;
  detail?: string;
  importance?: WorldRuntimeEventImportance;
};

function splitEventParticipants(value: string) {
  return [
    ...new Set(
      value
        .split(/[,，、\n]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function joinOrFallback(values: string[], fallback: string) {
  return values.length > 0 ? values.join("、") : fallback;
}

function textOrFallback(value: string, fallback: string) {
  const trimmed = value.trim();

  return trimmed || fallback;
}

function EventFact({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="event-fact">
      <Icon aria-hidden="true" className="size-4" />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EventListItem({
  event,
  selected,
  onSelect,
}: {
  event: WorldRuntimeEvent;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className="event-log-item"
      data-selected={selected}
      onClick={onSelect}
    >
      <span className="event-log-date">{textOrFallback(event.date, "时间未记录")}</span>
      <span className="event-log-item-body">
        <span className="event-log-item-head">
          <strong>{event.title}</strong>
          <span className="event-log-badges">
            <em>{eventTypeLabels[event.type]}</em>
            <em data-importance={event.importance}>
              {importanceLabels[event.importance]}
            </em>
          </span>
        </span>
        <span className="event-log-meta">
          <span>{joinOrFallback(event.participants, "未记录角色")}</span>
          <span>{textOrFallback(event.location, "未记录地点")}</span>
          <span>{textOrFallback(event.impact, "暂无影响记录")}</span>
        </span>
        <span className="event-log-summary">{event.summary}</span>
      </span>
    </button>
  );
}

function EventDetail({ event }: { event: WorldRuntimeEvent }) {
  return (
    <article className="event-detail">
      <div className="event-detail-stamp" aria-hidden="true">
        <ScrollText className="size-6" />
      </div>
      <div className="event-detail-head">
        <div>
          <p className="eyebrow">事件详情</p>
          <h2>{event.title}</h2>
        </div>
        <span data-importance={event.importance}>
          {importanceLabels[event.importance]}
        </span>
      </div>

      <div className="event-detail-facts">
        <EventFact
          icon={CalendarDays}
          label="世界时间"
          value={textOrFallback(event.date, "时间未记录")}
        />
        <EventFact
          icon={Users}
          label="参与角色"
          value={joinOrFallback(event.participants, "未记录角色")}
        />
        <EventFact
          icon={MapPin}
          label="地点"
          value={textOrFallback(event.location, "未记录地点")}
        />
        <EventFact
          icon={Flag}
          label="影响"
          value={textOrFallback(event.impact, "暂无影响记录")}
        />
        <EventFact icon={Badge} label="类型" value={eventTypeLabels[event.type]} />
        <EventFact
          icon={ListOrdered}
          label="创建时间"
          value={textOrFallback(event.createdAt, "未记录")}
        />
      </div>

      <section className="event-detail-copy" aria-label="事件底稿">
        <h3>事实底稿</h3>
        <p>{textOrFallback(event.detail, event.summary)}</p>
      </section>
    </article>
  );
}

function EventCreateForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (input: EventCreateInput) => boolean;
}) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [type, setType] = useState<WorldRuntimeEventType>("plot");
  const [importance, setImportance] =
    useState<WorldRuntimeEventImportance>("normal");
  const [participants, setParticipants] = useState("");
  const [location, setLocation] = useState("");
  const [impact, setImpact] = useState("");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !summary.trim()) {
      setError("标题和摘要都需要填写。");
      return;
    }

    const saved = onSubmit({
      title,
      summary,
      type,
      participants: splitEventParticipants(participants),
      location,
      impact,
      detail,
      importance,
    });

    if (!saved) {
      setError("当前没有可写入的 active world。");
      return;
    }

    setError("");
  }

  return (
    <form className="event-create-form" onSubmit={handleSubmit} noValidate>
      <div className="event-create-head">
        <div>
          <p className="eyebrow">记录事件</p>
          <h2>写入世界事实</h2>
        </div>
        <Button
          type="button"
          className="ink-action"
          variant="outline"
          size="sm"
          onClick={onCancel}
        >
          <X aria-hidden="true" className="size-4" />
          取消
        </Button>
      </div>

      <div className="event-create-grid">
        <label>
          <span>事件标题</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例如：密会破局"
          />
        </label>
        <label>
          <span>类型</span>
          <select
            value={type}
            onChange={(event) =>
              setType(event.target.value as WorldRuntimeEventType)
            }
          >
            {eventTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>重要性</span>
          <select
            value={importance}
            onChange={(event) =>
              setImportance(event.target.value as WorldRuntimeEventImportance)
            }
          >
            {eventImportanceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="event-create-wide">
          <span>摘要</span>
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="写下这件事发生了什么，以及它为什么重要。"
            rows={3}
          />
        </label>
        <label>
          <span>参与角色</span>
          <input
            value={participants}
            onChange={(event) => setParticipants(event.target.value)}
            placeholder="用顿号或逗号分隔"
          />
        </label>
        <label>
          <span>地点</span>
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="未记录地点"
          />
        </label>
        <label className="event-create-wide">
          <span>事件影响</span>
          <input
            value={impact}
            onChange={(event) => setImpact(event.target.value)}
            placeholder="例如：某个势力声望受损，某段关系进入公开冲突"
          />
        </label>
        <label className="event-create-wide">
          <span>详情</span>
          <textarea
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            placeholder="可选补充更完整的事实底稿；留空时使用摘要。"
            rows={5}
          />
        </label>
      </div>

      <div className="event-create-actions">
        <span role="status">{error}</span>
        <Button type="submit" className="ink-action" variant="outline" size="sm">
          <ScrollText aria-hidden="true" className="size-4" />
          保存事件
        </Button>
      </div>
    </form>
  );
}

export function WorldEventLog() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [mode, setMode] = useState<"detail" | "create">("detail");
  const worldLibraryValue = useSyncExternalStore(
    subscribeToWorldLibrary,
    getWorldLibrarySnapshot,
    () => null,
  );
  const runtimeValue = useSyncExternalStore(
    subscribeToWorldRuntime,
    getWorldRuntimeSnapshot,
    () => null,
  );
  const worldLibrary = useMemo(
    () => parseStoredWorldLibrary(worldLibraryValue) ?? emptyWorldLibrary,
    [worldLibraryValue],
  );
  const activeWorld = useMemo(() => getActiveWorld(worldLibrary), [worldLibrary]);
  const activeWorldId = activeWorld?.id ?? worldLibrary.activeWorldId;
  const runtimeState = useMemo(
    () => parseStoredWorldRuntimeState(runtimeValue, activeWorldId),
    [activeWorldId, runtimeValue],
  );
  const events = useMemo(
    () => getRecentWorldRuntimeEvents(runtimeState.events),
    [runtimeState.events],
  );

  useEffect(() => {
    if (activeWorldId) {
      loadWorldEventsFromBackend(activeWorldId).catch((error: unknown) => {
        console.error("加载世界事件失败", error);
      });
    }
  }, [activeWorldId]);

  const selectedEvent =
    events.find((event) => event.id === selectedEventId) ?? events[0] ?? null;
  const worldName = activeWorld?.name ?? "未选择世界";
  const hasActiveWorld = Boolean(activeWorldId);
  const isCreating = mode === "create" && hasActiveWorld;

  function openCreateMode() {
    if (hasActiveWorld) {
      setMode("create");
    }
  }

  function handleSelectEvent(eventId: string) {
    setSelectedEventId(eventId);
    setMode("detail");
  }

  function handleCreateEvent(input: EventCreateInput) {
    if (!activeWorldId) {
      return false;
    }

    createWorldEventOnBackend(activeWorldId, {
      ...input,
      date: runtimeState.currentWorldDate,
    })
      .then((createdEvent) => {
        setSelectedEventId(createdEvent.id);
        setMode("detail");
      })
      .catch((error: unknown) => {
        console.error("创建事件失败", error);
      });

    return true;
  }

  return (
    <main className="event-log-page">
      <section className="event-log-hero">
        <div>
          <Link href="/" className="event-back-link">
            <ArrowLeft aria-hidden="true" className="size-4" />
            回到工作台
          </Link>
          <p className="eyebrow">世界事件账本</p>
          <h1>事件日志</h1>
          <p>
            {hasActiveWorld
              ? `当前世界：${worldName}`
              : "当前没有 active world，事件日志暂时只显示空状态。"}
          </p>
        </div>
        <div className="event-log-hero-side">
          <div className="event-log-count" aria-label="事件数量">
            <span>{events.length}</span>
            <strong>事件</strong>
          </div>
          <Button
            type="button"
            className="ink-action event-log-create-action"
            variant="outline"
            size="sm"
            onClick={openCreateMode}
            disabled={!hasActiveWorld}
          >
            <PlusCircle aria-hidden="true" className="size-4" />
            记录事件
          </Button>
        </div>
      </section>

      <section className="event-log-layout" aria-label="事件日志内容">
        <div className="event-list-panel">
          <div className="event-log-panel-head">
            <div>
              <p className="eyebrow">倒序列表</p>
              <h2>{worldName}</h2>
            </div>
            <div className="event-log-panel-actions">
              <span>{events.length} 条</span>
              <Button
                type="button"
                className="ink-action"
                variant="outline"
                size="sm"
                onClick={openCreateMode}
                disabled={!hasActiveWorld}
              >
                <PlusCircle aria-hidden="true" className="size-4" />
                新增
              </Button>
            </div>
          </div>

          {events.length > 0 ? (
            <div className="event-log-list">
              {events.map((event) => (
                <EventListItem
                  event={event}
                  selected={event.id === selectedEvent?.id}
                  onSelect={() => handleSelectEvent(event.id)}
                  key={event.id}
                />
              ))}
            </div>
          ) : (
            <div className="event-empty-state">
              <ScrollText aria-hidden="true" className="size-8" />
              <h3>{hasActiveWorld ? "这个世界还没有事件" : "尚未选择世界"}</h3>
              <p>
                {hasActiveWorld
                  ? "记录第一条事件后，这里会按最新创建时间展示完整日志。"
                  : "创建或选择一个世界后，事件日志会读取对应 worldId 的后端运行记录。"}
              </p>
              {hasActiveWorld ? (
                <Button
                  type="button"
                  className="ink-action event-empty-link"
                  variant="outline"
                  size="sm"
                  onClick={openCreateMode}
                >
                  <PlusCircle aria-hidden="true" className="size-4" />
                  记录第一条事件
                </Button>
              ) : (
                <Link href="/" className="event-empty-link">
                  回到工作台
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="event-detail-panel">
          {isCreating ? (
            <EventCreateForm
              onCancel={() => setMode("detail")}
              onSubmit={handleCreateEvent}
            />
          ) : selectedEvent ? (
            <EventDetail event={selectedEvent} />
          ) : (
            <div className="event-empty-state detail-empty">
              <ScrollText aria-hidden="true" className="size-8" />
              <h3>{hasActiveWorld ? "暂无可查看详情" : "尚未选择世界"}</h3>
              <p>
                {hasActiveWorld
                  ? "事件详情会展示参与角色、地点、影响、类型、重要性和事实底稿。"
                  : "创建或选择一个世界后，才能记录并维护事件日志。"}
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
