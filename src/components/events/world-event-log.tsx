"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Badge,
  CalendarDays,
  Flag,
  ListOrdered,
  MapPin,
  ScrollText,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";

import {
  getActiveWorld,
  getWorldLibrarySnapshot,
  parseStoredWorldLibrary,
  subscribeToWorldLibrary,
} from "@/lib/world-library";
import {
  getRecentWorldRuntimeEvents,
  getWorldRuntimeSnapshot,
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

export function WorldEventLog() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
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

  const selectedEvent =
    events.find((event) => event.id === selectedEventId) ?? events[0] ?? null;
  const worldName = activeWorld?.name ?? "未选择世界";
  const hasActiveWorld = Boolean(activeWorldId);

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
              : "当前没有 active world，事件日志暂时只显示本地空状态。"}
          </p>
        </div>
        <div className="event-log-count" aria-label="事件数量">
          <span>{events.length}</span>
          <strong>事件</strong>
        </div>
      </section>

      <section className="event-log-layout" aria-label="事件日志内容">
        <div className="event-list-panel">
          <div className="event-log-panel-head">
            <div>
              <p className="eyebrow">倒序列表</p>
              <h2>{worldName}</h2>
            </div>
            <span>{events.length} 条</span>
          </div>

          {events.length > 0 ? (
            <div className="event-log-list">
              {events.map((event) => (
                <EventListItem
                  event={event}
                  selected={event.id === selectedEvent?.id}
                  onSelect={() => setSelectedEventId(event.id)}
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
                  ? "回到工作台记录第一条事件后，这里会按最新创建时间展示完整日志。"
                  : "创建或选择一个世界后，事件日志会读取对应 worldId 的本地运行记录。"}
              </p>
              <Link href="/" className="event-empty-link">
                回到工作台
              </Link>
            </div>
          )}
        </div>

        <div className="event-detail-panel">
          {selectedEvent ? (
            <EventDetail event={selectedEvent} />
          ) : (
            <div className="event-empty-state detail-empty">
              <ScrollText aria-hidden="true" className="size-8" />
              <h3>暂无可查看详情</h3>
              <p>事件详情会展示参与角色、地点、影响、类型、重要性和事实底稿。</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
