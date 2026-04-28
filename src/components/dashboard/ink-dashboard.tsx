"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  Box,
  CalendarPlus,
  Castle,
  Check,
  ChevronDown,
  Compass,
  Flag,
  Globe,
  LogOut,
  Network,
  NotebookTabs,
  Package,
  Pause,
  Pencil,
  Play,
  PlusCircle,
  Scroll,
  ScrollText,
  Settings,
  ShieldQuestionMark,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserRound,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { dashboardData } from "@/lib/dashboard-data";
import {
  getActiveWorld,
  getWorldLibrarySnapshot,
  parseStoredWorldLibrary,
  setActiveWorldId,
  subscribeToWorldLibrary,
  worldRecordToWorldInfo,
  worldRecordToWorldSettings,
} from "@/lib/world-library";
import {
  createSeedId,
  deriveSeedCharacters,
  deriveSeedRelationships,
  deriveSeedStats,
  getWorldSeedAssetsSnapshot,
  normalizeWorldSeedAssets,
  parseStoredWorldSeedAssets,
  saveWorldSeedAssets,
  subscribeToWorldSeedAssets,
} from "@/lib/world-seed-assets";
import {
  advanceWorldRuntimeOneDay,
  appendWorldRuntimeEvent,
  getRecentWorldRuntimeEvents,
  getWorldRuntimeSnapshot,
  hasStoredWorldRuntime,
  parseStoredWorldRuntimeState,
  saveWorldRuntimeState,
  subscribeToWorldRuntime,
  toggleWorldRuntimePaused,
} from "@/lib/world-runtime";
import {
  getWorldSettingsSnapshot,
  parseStoredWorldSettings,
  saveWorldSettings,
  subscribeToWorldSettings,
  worldInfoToWorldSettings,
  worldSettingsToWorldInfo,
} from "@/lib/world-settings";
import type {
  Character,
  DashboardIconKey,
  Relationship,
  RuntimeStatus,
  StatItem,
  StoryChapter,
  TimeInfo,
  TimelineEvent,
  WorldInfo,
} from "@/types/dashboard";
import type {
  WorldRuntimeEventImportance,
  WorldRuntimeEventType,
  WorldRuntimeState,
} from "@/types/world-runtime";
import type {
  WorldSeedAssets,
  WorldSeedCharacter,
  WorldSeedFaction,
  WorldSeedLocation,
  WorldSeedRelationship,
} from "@/types/world-seed-assets";
import type { WorldSettings } from "@/types/world-settings";
import type { WorldLibraryState, WorldRecord } from "@/types/world-library";

const iconMap: Record<DashboardIconKey, LucideIcon> = {
  world: Globe,
  users: Users,
  network: Network,
  compass: Compass,
  scroll: ScrollText,
  book: BookOpen,
  settings: Settings,
  journal: NotebookTabs,
  tools: Wrench,
  roles: UserRound,
  forces: Flag,
  places: Castle,
  events: Scroll,
  secrets: ShieldQuestionMark,
  up: TrendingUp,
  down: TrendingDown,
};

function DashboardIcon({
  icon,
  className,
}: {
  icon: DashboardIconKey;
  className?: string;
}) {
  const Icon = iconMap[icon];

  return <Icon aria-hidden="true" className={className} strokeWidth={1.8} />;
}

function ReferenceImage({
  alt,
  src,
  className,
  priority = false,
}: {
  alt: string;
  src: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes="(max-width: 768px) 100vw, 44vw"
      className={className}
      style={{ objectFit: "cover" }}
    />
  );
}

function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg" ? "size-20" : size === "sm" ? "size-7" : "size-10";

  return (
    <span className={`ink-avatar ${sizeClass}`} title={name}>
      <Image
        src={src}
        alt={name}
        fill
        sizes={size === "lg" ? "80px" : size === "sm" ? "28px" : "40px"}
        style={{ objectFit: "cover" }}
      />
    </span>
  );
}

const avatarSrcByName = new Map(
  dashboardData.characters.map((character) => [character.name, character.imageSrc]),
);

const emptyWorldLibrary: WorldLibraryState = {
  version: 1,
  activeWorldId: null,
  worlds: [],
};

const runtimeEventTypeOptions: Array<{
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

const runtimeEventImportanceOptions: Array<{
  value: WorldRuntimeEventImportance;
  label: string;
}> = [
  { value: "normal", label: "普通" },
  { value: "important", label: "重要" },
  { value: "turning-point", label: "转折" },
];

function getAvatarSrc(name: string) {
  return avatarSrcByName.get(name) ?? dashboardData.assets.writer;
}

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

function clampProgress(value: number) {
  return Math.min(100, Math.max(6, Math.round(value)));
}

function deriveRuntimeStatus(runtime: WorldRuntimeState): RuntimeStatus {
  const dailyProgress = runtime.runDays === 0 ? 6 : (runtime.runDays % 30) * (100 / 30);

  return {
    title: runtime.isPaused ? "世界已暂停" : "世界运行中",
    days: runtime.runDays,
    progress: clampProgress(dailyProgress || 100),
    nextTime: runtime.isPaused ? "等待继续运行" : runtime.currentWorldDate,
  };
}

function deriveRuntimeStats(
  stats: StatItem[],
  runtime: WorldRuntimeState,
) {
  if (runtime.events.length === 0) {
    return stats;
  }

  return stats.map((stat) =>
    stat.label === "事件" ? { ...stat, value: String(runtime.events.length) } : stat,
  );
}

function deriveRuntimeEvents(runtime: WorldRuntimeState): TimelineEvent[] {
  if (runtime.events.length === 0) {
    return dashboardData.events;
  }

  return getRecentWorldRuntimeEvents(runtime.events)
    .slice(0, 4)
    .map((event) => ({
      date: event.date,
      title: event.title,
      description: event.summary,
      participants: event.participants,
    }));
}

function deriveRuntimeChapter(runtime: WorldRuntimeState): StoryChapter {
  if (!runtime.latestChapter) {
    return dashboardData.chapter;
  }

  return {
    ...dashboardData.chapter,
    title: runtime.latestChapter.title,
    summary: runtime.latestChapter.summary,
    tags:
      runtime.latestChapter.tags.length > 0
        ? runtime.latestChapter.tags
        : dashboardData.chapter.tags,
    date: runtime.latestChapter.date,
  };
}

function deriveRuntimeTime(runtime: WorldRuntimeState): TimeInfo {
  return {
    era: dashboardData.time.era,
    date: runtime.currentWorldDate,
    day: `第 ${runtime.runDays} 天`,
  };
}

function Sidebar() {
  return (
    <aside className="ink-sidebar">
      <div className="sidebar-brand">
        <span className="brand-title">织世录</span>
        <span className="brand-seal">印</span>
      </div>

      <nav className="sidebar-nav" aria-label="主导航">
        <Link href="/worlds/new" className="sidebar-link sidebar-create-link">
          <PlusCircle aria-hidden="true" className="size-5" />
          <span>新建世界</span>
        </Link>
        {dashboardData.navItems.map((item) => {
          const href = item.label === "事件" ? "/events" : "#";

          return (
            <Link
              href={href}
              aria-current={item.active ? "page" : undefined}
              className="sidebar-link"
              key={item.label}
            >
              <DashboardIcon icon={item.icon} className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="writer-card">
          <Avatar name="墨染青衫" src={dashboardData.assets.writer} size="md" />
          <div className="min-w-0">
            <p className="truncate text-xs text-[#c9b98c]/80">执笔者</p>
            <p className="truncate text-sm font-medium text-[#eadfbd]">
              墨染青衫
            </p>
          </div>
          <ChevronDown aria-hidden="true" className="ml-auto size-4" />
        </div>
        <div className="sidebar-tools">
          <button type="button" aria-label="世界偏好设置">
            <Settings aria-hidden="true" className="size-5" />
          </button>
          <button type="button" aria-label="退出工作台">
            <LogOut aria-hidden="true" className="size-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function WorldSwitcher({
  worlds,
  activeWorldId,
  onSwitchWorld,
}: {
  worlds: WorldRecord[];
  activeWorldId: string | null;
  onSwitchWorld: (worldId: string) => void;
}) {
  if (worlds.length === 0) {
    return null;
  }

  return (
    <label className="world-switcher">
      <Globe aria-hidden="true" className="size-4" />
      <span>当前世界</span>
      <select
        value={activeWorldId ?? worlds[0]?.id ?? ""}
        onChange={(event) => onSwitchWorld(event.target.value)}
        aria-label="切换当前世界"
      >
        {worlds.map((world) => (
          <option value={world.id} key={world.id}>
            {world.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function WorldBanner({
  world,
  worlds,
  activeWorldId,
  onEditSettings,
  onEditSeeds,
  onSwitchWorld,
}: {
  world: WorldInfo;
  worlds: WorldRecord[];
  activeWorldId: string | null;
  onEditSettings: () => void;
  onEditSeeds: () => void;
  onSwitchWorld: (worldId: string) => void;
}) {
  return (
    <section className="world-banner">
      <div className="banner-art" aria-hidden="true">
        <ReferenceImage
          alt=""
          src={dashboardData.assets.hero}
          className="opacity-85 mix-blend-multiply"
          priority
        />
      </div>
      <div className="banner-content">
        <div className="title-row">
          <h1>{world.title}</h1>
          <button type="button" aria-label="编辑世界名称" className="icon-ink">
            <Pencil aria-hidden="true" className="size-5" />
          </button>
        </div>
        <p>{world.description}</p>
        <div className="tag-row">
          {world.tags.map((tag) => (
            <span key={tag.label}>{tag.label}</span>
          ))}
        </div>
        <WorldSwitcher
          worlds={worlds}
          activeWorldId={activeWorldId}
          onSwitchWorld={onSwitchWorld}
        />
      </div>
      <div className="banner-actions" aria-label="世界操作">
        <Button
          type="button"
          className="ink-action"
          variant="outline"
          size="sm"
          onClick={onEditSettings}
        >
          <Settings aria-hidden="true" className="size-4" />
          世界设定
        </Button>
        <button
          type="button"
          aria-label="管理内容种子"
          className="round-action"
          onClick={onEditSeeds}
        >
          <Package aria-hidden="true" className="size-5" />
        </button>
        <button type="button" aria-label="消息提醒" className="round-action">
          <Bell aria-hidden="true" className="size-5" />
        </button>
        <button type="button" aria-label="打开全屏" className="round-action">
          <Box aria-hidden="true" className="size-5" />
        </button>
      </div>
    </section>
  );
}

const settingsFields: Array<{
  name: keyof Pick<
    WorldSettings,
    | "background"
    | "worldRules"
    | "stylePreferences"
    | "prohibitedContent"
    | "coreConflict"
  >;
  label: string;
  hint: string;
  placeholder: string;
  rows: number;
}> = [
  {
    name: "background",
    label: "世界背景",
    hint: "用于工作台顶部横幅摘要，适合写时代、地域、秩序与正在变化的处境。",
    placeholder: "写下这个世界的来历、局势、地域和主要秩序。",
    rows: 5,
  },
  {
    name: "worldRules",
    label: "世界规则",
    hint: "保存为设定约束，本阶段不会改写运行状态或事件模块。",
    placeholder: "列出力量、社会、资源、技术或禁忌规则。",
    rows: 5,
  },
  {
    name: "stylePreferences",
    label: "风格偏好",
    hint: "保存后会作为顶部横幅标签展示；留空时隐藏该标签。",
    placeholder: "例如：冷峻群像、温柔怪谈、史诗冒险。",
    rows: 3,
  },
  {
    name: "prohibitedContent",
    label: "禁止事项",
    hint: "用于记录内容边界；当前只保存，不代表系统已经强制执行。",
    placeholder: "写下不希望在世界中出现的题材、走向或处理方式。",
    rows: 4,
  },
  {
    name: "coreConflict",
    label: "核心矛盾",
    hint: "记录世界长期张力；不会自动生成或重写事件、秘密和趋势。",
    placeholder: "写下推动角色、势力和秘密长期滚动的主要矛盾。",
    rows: 5,
  },
];

function WorldSettingsEditor({
  settings,
  onClose,
  onSave,
}: {
  settings: WorldSettings;
  onClose: () => void;
  onSave: (settings: WorldSettings) => void;
}) {
  const [form, setForm] = useState(settings);

  function setField(field: keyof WorldSettings, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(form);
    onClose();
  }

  return (
    <div className="settings-overlay" role="presentation">
      <form
        className="settings-panel"
        aria-labelledby="world-settings-title"
        onSubmit={handleSubmit}
      >
        <header className="settings-panel-head">
          <div>
            <p className="eyebrow">当前世界设定</p>
            <h2 id="world-settings-title">整理世界底稿</h2>
          </div>
          <button
            type="button"
            className="round-action settings-close"
            aria-label="关闭世界设定"
            onClick={onClose}
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>

        <div className="settings-summary" aria-label="世界基础信息">
          <div>
            <span>世界名称</span>
            <strong>{form.worldName.trim() || "未命名世界"}</strong>
          </div>
          <div>
            <span>世界类型</span>
            <strong>{form.worldType.trim() || "未定类型"}</strong>
          </div>
        </div>

        <div className="settings-fields">
          {settingsFields.map((field) => (
            <label className="settings-field" key={field.name}>
              <span>
                <strong>{field.label}</strong>
                <small>{field.hint}</small>
              </span>
              <textarea
                value={form[field.name]}
                onChange={(event) => setField(field.name, event.target.value)}
                placeholder={field.placeholder}
                rows={field.rows}
              />
            </label>
          ))}
        </div>

        <footer className="settings-actions">
          <Button
            type="button"
            className="ink-action"
            variant="outline"
            onClick={onClose}
          >
            取消
          </Button>
          <Button type="submit" className="save-settings-action">
            <Check aria-hidden="true" className="size-4" />
            保存设定
          </Button>
        </footer>
      </form>
    </div>
  );
}

const characterSeedFields: Array<{
  name: keyof Omit<WorldSeedCharacter, "id">;
  label: string;
  placeholder: string;
  multiline?: boolean;
}> = [
  { name: "name", label: "姓名", placeholder: "例如：沈清辞" },
  { name: "identity", label: "身份", placeholder: "例如：盐务巡检" },
  {
    name: "goal",
    label: "目标",
    placeholder: "写下角色正在追逐或回避的事。",
    multiline: true,
  },
  {
    name: "status",
    label: "状态",
    placeholder: "例如：潜伏、受伤、结盟观望。",
    multiline: true,
  },
];

const factionSeedFields: Array<{
  name: keyof Omit<WorldSeedFaction, "id">;
  label: string;
  placeholder: string;
  multiline?: boolean;
}> = [
  { name: "name", label: "名称", placeholder: "例如：江南盐帮" },
  { name: "stance", label: "立场", placeholder: "例如：拥护新政" },
  {
    name: "resources",
    label: "资源",
    placeholder: "写下钱粮、人脉、据点或秘术。",
    multiline: true,
  },
  {
    name: "conflict",
    label: "冲突点",
    placeholder: "写下它与谁、因何事发生长期摩擦。",
    multiline: true,
  },
];

const locationSeedFields: Array<{
  name: keyof Omit<WorldSeedLocation, "id">;
  label: string;
  placeholder: string;
  multiline?: boolean;
}> = [
  { name: "name", label: "名称", placeholder: "例如：听雨楼" },
  { name: "type", label: "类型", placeholder: "例如：码头、禁宫、书院" },
  {
    name: "importance",
    label: "重要性",
    placeholder: "写下地点为什么会影响世界走向。",
    multiline: true,
  },
];

function newCharacterSeed(): WorldSeedCharacter {
  return {
    id: createSeedId("character"),
    name: "",
    identity: "",
    goal: "",
    status: "",
  };
}

function newFactionSeed(): WorldSeedFaction {
  return {
    id: createSeedId("faction"),
    name: "",
    stance: "",
    resources: "",
    conflict: "",
  };
}

function newLocationSeed(): WorldSeedLocation {
  return {
    id: createSeedId("location"),
    name: "",
    type: "",
    importance: "",
  };
}

function newRelationshipSeed(): WorldSeedRelationship {
  return {
    id: createSeedId("relationship"),
    participantA: "",
    participantB: "",
    description: "",
    tension: 50,
    note: "",
  };
}

function SeedAssetsEditor({
  assets,
  onClose,
  onSave,
}: {
  assets: WorldSeedAssets;
  onClose: () => void;
  onSave: (assets: WorldSeedAssets) => void;
}) {
  const [form, setForm] = useState(() => normalizeWorldSeedAssets(assets));

  function updateCharacter(
    id: string,
    field: keyof Omit<WorldSeedCharacter, "id">,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      characters: current.characters.map((character) =>
        character.id === id ? { ...character, [field]: value } : character,
      ),
    }));
  }

  function updateFaction(
    id: string,
    field: keyof Omit<WorldSeedFaction, "id">,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      factions: current.factions.map((faction) =>
        faction.id === id ? { ...faction, [field]: value } : faction,
      ),
    }));
  }

  function updateLocation(
    id: string,
    field: keyof Omit<WorldSeedLocation, "id">,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      locations: current.locations.map((location) =>
        location.id === id ? { ...location, [field]: value } : location,
      ),
    }));
  }

  function updateRelationship(
    id: string,
    field: keyof Omit<WorldSeedRelationship, "id">,
    value: string | number,
  ) {
    setForm((current) => ({
      ...current,
      relationships: current.relationships.map((relationship) =>
        relationship.id === id
          ? { ...relationship, [field]: value }
          : relationship,
      ),
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(form);
    onClose();
  }

  return (
    <div className="settings-overlay seed-overlay" role="presentation">
      <form
        className="settings-panel seed-panel"
        aria-labelledby="world-seeds-title"
        onSubmit={handleSubmit}
      >
        <header className="settings-panel-head">
          <div>
            <p className="eyebrow">本地内容种子</p>
            <h2 id="world-seeds-title">整理世界资产</h2>
          </div>
          <button
            type="button"
            className="round-action settings-close"
            aria-label="关闭内容种子"
            onClick={onClose}
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>

        <div className="seed-summary" aria-label="种子统计">
          <span>角色 {form.characters.length}</span>
          <span>势力 {form.factions.length}</span>
          <span>地点 {form.locations.length}</span>
          <span>关系 {form.relationships.length}</span>
        </div>

        <div className="seed-sections">
          <section className="seed-section" aria-labelledby="character-seeds-title">
            <div className="seed-section-head">
              <div>
                <h3 id="character-seeds-title">角色种子</h3>
                <p>姓名、身份、目标和当前状态会同步到活跃角色。</p>
              </div>
              <Button
                type="button"
                className="ink-action"
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    characters: [...current.characters, newCharacterSeed()],
                  }))
                }
              >
                <PlusCircle aria-hidden="true" className="size-4" />
                新增角色
              </Button>
            </div>
            <div className="seed-list">
              {form.characters.length === 0 ? (
                <p className="seed-empty">还没有角色种子。</p>
              ) : (
                form.characters.map((character) => (
                  <article className="seed-row" key={character.id}>
                    <div className="seed-field-grid">
                      {characterSeedFields.map((field) => (
                        <label className="seed-field" key={field.name}>
                          <span>{field.label}</span>
                          {field.multiline ? (
                            <textarea
                              value={character[field.name]}
                              onChange={(event) =>
                                updateCharacter(
                                  character.id,
                                  field.name,
                                  event.target.value,
                                )
                              }
                              placeholder={field.placeholder}
                              rows={2}
                            />
                          ) : (
                            <input
                              value={character[field.name]}
                              onChange={(event) =>
                                updateCharacter(
                                  character.id,
                                  field.name,
                                  event.target.value,
                                )
                              }
                              placeholder={field.placeholder}
                            />
                          )}
                        </label>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="seed-delete"
                      aria-label="删除角色种子"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          characters: current.characters.filter(
                            (item) => item.id !== character.id,
                          ),
                        }))
                      }
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </button>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="seed-section" aria-labelledby="faction-seeds-title">
            <div className="seed-section-head">
              <div>
                <h3 id="faction-seeds-title">势力种子</h3>
                <p>记录立场、资源与冲突点，用于统计概览。</p>
              </div>
              <Button
                type="button"
                className="ink-action"
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    factions: [...current.factions, newFactionSeed()],
                  }))
                }
              >
                <PlusCircle aria-hidden="true" className="size-4" />
                新增势力
              </Button>
            </div>
            <div className="seed-list">
              {form.factions.length === 0 ? (
                <p className="seed-empty">还没有势力种子。</p>
              ) : (
                form.factions.map((faction) => (
                  <article className="seed-row" key={faction.id}>
                    <div className="seed-field-grid">
                      {factionSeedFields.map((field) => (
                        <label className="seed-field" key={field.name}>
                          <span>{field.label}</span>
                          {field.multiline ? (
                            <textarea
                              value={faction[field.name]}
                              onChange={(event) =>
                                updateFaction(
                                  faction.id,
                                  field.name,
                                  event.target.value,
                                )
                              }
                              placeholder={field.placeholder}
                              rows={2}
                            />
                          ) : (
                            <input
                              value={faction[field.name]}
                              onChange={(event) =>
                                updateFaction(
                                  faction.id,
                                  field.name,
                                  event.target.value,
                                )
                              }
                              placeholder={field.placeholder}
                            />
                          )}
                        </label>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="seed-delete"
                      aria-label="删除势力种子"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          factions: current.factions.filter(
                            (item) => item.id !== faction.id,
                          ),
                        }))
                      }
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </button>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="seed-section" aria-labelledby="location-seeds-title">
            <div className="seed-section-head">
              <div>
                <h3 id="location-seeds-title">地点种子</h3>
                <p>地点类型和重要性会作为世界底稿资产保存。</p>
              </div>
              <Button
                type="button"
                className="ink-action"
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    locations: [...current.locations, newLocationSeed()],
                  }))
                }
              >
                <PlusCircle aria-hidden="true" className="size-4" />
                新增地点
              </Button>
            </div>
            <div className="seed-list">
              {form.locations.length === 0 ? (
                <p className="seed-empty">还没有地点种子。</p>
              ) : (
                form.locations.map((location) => (
                  <article className="seed-row" key={location.id}>
                    <div className="seed-field-grid compact">
                      {locationSeedFields.map((field) => (
                        <label className="seed-field" key={field.name}>
                          <span>{field.label}</span>
                          {field.multiline ? (
                            <textarea
                              value={location[field.name]}
                              onChange={(event) =>
                                updateLocation(
                                  location.id,
                                  field.name,
                                  event.target.value,
                                )
                              }
                              placeholder={field.placeholder}
                              rows={2}
                            />
                          ) : (
                            <input
                              value={location[field.name]}
                              onChange={(event) =>
                                updateLocation(
                                  location.id,
                                  field.name,
                                  event.target.value,
                                )
                              }
                              placeholder={field.placeholder}
                            />
                          )}
                        </label>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="seed-delete"
                      aria-label="删除地点种子"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          locations: current.locations.filter(
                            (item) => item.id !== location.id,
                          ),
                        }))
                      }
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </button>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="seed-section" aria-labelledby="relationship-seeds-title">
            <div className="seed-section-head">
              <div>
                <h3 id="relationship-seeds-title">关系种子</h3>
                <p>A、B、关系描述、紧张度和备注会同步到紧张关系。</p>
              </div>
              <Button
                type="button"
                className="ink-action"
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    relationships: [
                      ...current.relationships,
                      newRelationshipSeed(),
                    ],
                  }))
                }
              >
                <PlusCircle aria-hidden="true" className="size-4" />
                新增关系
              </Button>
            </div>
            <div className="seed-list">
              {form.relationships.length === 0 ? (
                <p className="seed-empty">还没有关系种子。</p>
              ) : (
                form.relationships.map((relationship) => (
                  <article className="seed-row" key={relationship.id}>
                    <div className="seed-field-grid relation-fields">
                      <label className="seed-field">
                        <span>A</span>
                        <input
                          value={relationship.participantA}
                          onChange={(event) =>
                            updateRelationship(
                              relationship.id,
                              "participantA",
                              event.target.value,
                            )
                          }
                          placeholder="例如：叶晚棠"
                        />
                      </label>
                      <label className="seed-field">
                        <span>B</span>
                        <input
                          value={relationship.participantB}
                          onChange={(event) =>
                            updateRelationship(
                              relationship.id,
                              "participantB",
                              event.target.value,
                            )
                          }
                          placeholder="例如：盐帮"
                        />
                      </label>
                      <label className="seed-field">
                        <span>关系描述</span>
                        <input
                          value={relationship.description}
                          onChange={(event) =>
                            updateRelationship(
                              relationship.id,
                              "description",
                              event.target.value,
                            )
                          }
                          placeholder="例如：互相利用"
                        />
                      </label>
                      <label className="seed-field tension-field">
                        <span>紧张度 {relationship.tension}</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={relationship.tension}
                          onChange={(event) =>
                            updateRelationship(
                              relationship.id,
                              "tension",
                              Number(event.target.value),
                            )
                          }
                        />
                      </label>
                      <label className="seed-field seed-note">
                        <span>备注</span>
                        <textarea
                          value={relationship.note}
                          onChange={(event) =>
                            updateRelationship(
                              relationship.id,
                              "note",
                              event.target.value,
                            )
                          }
                          placeholder="补充关系的隐情、触发点或未公开信息。"
                          rows={2}
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      className="seed-delete"
                      aria-label="删除关系种子"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          relationships: current.relationships.filter(
                            (item) => item.id !== relationship.id,
                          ),
                        }))
                      }
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </button>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <footer className="settings-actions">
          <Button
            type="button"
            className="ink-action"
            variant="outline"
            onClick={onClose}
          >
            取消
          </Button>
          <Button type="submit" className="save-settings-action">
            <Check aria-hidden="true" className="size-4" />
            保存内容种子
          </Button>
        </footer>
      </form>
    </div>
  );
}

function StatsAndRuntime({
  stats,
  runtime,
  onTogglePaused,
  onAdvanceDay,
}: {
  stats: StatItem[];
  runtime: RuntimeStatus;
  onTogglePaused: () => void;
  onAdvanceDay: () => void;
}) {
  const isPaused = runtime.title.includes("暂停");

  return (
    <div className="overview-grid">
      <section className="ink-panel stat-panel" aria-label="统计概览">
        {stats.map((stat) => (
          <article className="stat-item" key={stat.label}>
            <DashboardIcon icon={stat.icon} className="size-7" />
            <div>
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">
                {stat.value}
                <span>{stat.unit}</span>
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="ink-panel runtime-panel" aria-label="运行状态">
        <div className="status-orb" aria-hidden="true">
          <Sparkles className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="section-top compact">
            <h2>运行状态</h2>
            <div className="runtime-actions">
              <Button
                className="ink-action"
                variant="outline"
                size="sm"
                onClick={onTogglePaused}
                type="button"
              >
                {isPaused ? (
                  <Play aria-hidden="true" className="size-4" />
                ) : (
                  <Pause aria-hidden="true" className="size-4" />
                )}
                {isPaused ? "继续运行" : "暂停运行"}
              </Button>
              <Button
                className="ink-action"
                variant="outline"
                size="sm"
                onClick={onAdvanceDay}
                type="button"
              >
                <CalendarPlus aria-hidden="true" className="size-4" />
                推进一日
              </Button>
            </div>
          </div>
          <p className="runtime-title">{runtime.title}</p>
          <p className="runtime-meta">
            已连续运行 {runtime.days} 天
          </p>
          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${runtime.progress}%` }} />
          </div>
          <p className="runtime-next">
            下个时间点：{runtime.nextTime}
          </p>
        </div>
      </section>
    </div>
  );
}

function EventsPanel({
  events,
  onRecordEvent,
}: {
  events: TimelineEvent[];
  onRecordEvent: (input: {
    title: string;
    summary: string;
    type: WorldRuntimeEventType;
    participants?: string[];
    location?: string;
    impact?: string;
    detail?: string;
    importance?: WorldRuntimeEventImportance;
  }) => boolean;
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = onRecordEvent({
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
      setError("标题和摘要都需要填写。");
      return;
    }

    setTitle("");
    setSummary("");
    setType("plot");
    setImportance("normal");
    setParticipants("");
    setLocation("");
    setImpact("");
    setDetail("");
    setError("");
  }

  return (
    <section className="ink-panel content-panel">
      <div className="section-top">
        <h2>近期事件</h2>
        <Link href="/events">查看全部</Link>
      </div>
      <form className="event-entry" onSubmit={handleSubmit}>
        <div className="event-entry-grid">
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
              {runtimeEventTypeOptions.map((option) => (
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
              {runtimeEventImportanceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="event-summary-field">
            <span>摘要</span>
            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="写下这件事发生了什么，以及它为什么重要。"
              rows={2}
            />
          </label>
          <label>
            <span>参与角色</span>
            <input
              value={participants}
              onChange={(event) => setParticipants(event.target.value)}
              placeholder="用顿号分隔，可留空"
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
          <label className="event-summary-field">
            <span>事件影响</span>
            <input
              value={impact}
              onChange={(event) => setImpact(event.target.value)}
              placeholder="可留空，稍后在日志中回看"
            />
          </label>
          <label className="event-summary-field">
            <span>详情</span>
            <textarea
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              placeholder="可选补充更完整的事实底稿；留空时使用摘要。"
              rows={2}
            />
          </label>
        </div>
        <div className="event-entry-actions">
          <span role="status">{error}</span>
          <Button type="submit" className="ink-action" variant="outline" size="sm">
            <Scroll aria-hidden="true" className="size-4" />
            记录事件
          </Button>
        </div>
      </form>
      <div className="event-list">
        {events.map((event) => (
          <article className="event-row" key={event.title}>
            <time>{event.date}</time>
            <div className="min-w-0">
              <h3>{event.title}</h3>
              <p>{event.description}</p>
            </div>
            <div className="participant-stack" aria-label="相关角色">
              {event.participants.map((position, index) => (
                <Avatar
                  key={`${event.title}-${position}-${index}`}
                  name={position}
                  src={getAvatarSrc(position)}
                  size="sm"
                />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ChapterPanel({ chapter }: { chapter: StoryChapter }) {
  return (
    <section className="ink-panel content-panel">
      <div className="section-top">
        <h2>最新故事章节</h2>
        <a href="#">查看全部</a>
      </div>
      <div className="chapter-layout">
        <div className="chapter-art">
          <ReferenceImage
            alt="烟雨江南章节插图"
            src={chapter.imageSrc}
            className="mix-blend-multiply"
          />
        </div>
        <div className="chapter-copy">
          <h3>{chapter.title}</h3>
          <p>{chapter.summary}</p>
          <div className="tag-row compact-tags">
            {chapter.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <div className="chapter-bottom">
            <span>{chapter.date}</span>
            <Button className="ink-action" variant="outline" size="sm">
              继续阅读
            </Button>
          </div>
        </div>
      </div>
      <div className="story-dots" aria-label="章节分页">
        {Array.from({ length: chapter.progressDots }, (_, index) => (
          <span
            aria-current={chapter.activeDot === index ? "step" : undefined}
            key={index}
          />
        ))}
      </div>
    </section>
  );
}

function CharactersPanel({ characters }: { characters: Character[] }) {
  return (
    <section className="ink-panel character-panel">
      <div className="section-top">
        <h2>活跃角色</h2>
        <a href="#">查看全部</a>
      </div>
      <div className="character-strip">
        {characters.map((character) => (
          <article className="character-card" key={character.name}>
            <Avatar
              name={character.name}
              src={character.imageSrc}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <h3>{character.name}</h3>
              <p>{character.role}</p>
              <dl>
                <div>
                  <dt>目标：</dt>
                  <dd>{character.goal}</dd>
                </div>
                <div>
                  <dt>状态：</dt>
                  <dd>{character.status}</dd>
                </div>
              </dl>
              <div className="influence-row">
                <span>影响力 {character.influence}</span>
                <div className="mini-track" aria-hidden="true">
                  <span style={{ width: `${character.influence}%` }} />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TimeCard({ time }: { time: TimeInfo }) {
  return (
    <section className="ink-panel time-card">
      <div>
        <p className="eyebrow">当前时间</p>
        <p className="time-era">{time.era}</p>
        <p className="time-date">{time.date}</p>
        <p className="time-day">{time.day}</p>
      </div>
      <div className="compass-clock" aria-hidden="true">
        <ClockDial />
      </div>
    </section>
  );
}

function ClockDial() {
  return (
    <div className="clock-dial">
      {["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉"].map(
        (mark, index) => (
          <span key={mark} style={{ transform: `rotate(${index * 36}deg)` }}>
            <i style={{ transform: `rotate(-${index * 36}deg)` }}>{mark}</i>
          </span>
        ),
      )}
      <div className="clock-hand" />
      <Target className="size-7" />
    </div>
  );
}

function RelationshipsPanel({
  relationships,
}: {
  relationships: Relationship[];
}) {
  return (
    <section className="ink-panel side-panel">
      <div className="section-top">
        <h2>紧张关系</h2>
        <a href="#">查看全部</a>
      </div>
      <div className="relation-list">
        {relationships.map((relation) => (
          <article
            className="relation-row"
            key={`${relation.left}-${relation.right}-${relation.description ?? ""}`}
          >
            <Avatar
              name={relation.left}
              src={getAvatarSrc(relation.left)}
              size="md"
            />
            <div className="relation-body">
              <div className="relation-names">
                <span>{relation.left}</span>
                <em>vs</em>
                <span>{relation.right}</span>
              </div>
              <div className="relation-status">
                <span>{relation.description ?? relation.leftStatus}</span>
                <span>{relation.note ?? relation.rightStatus}</span>
              </div>
              <div className="tension-track" aria-hidden="true">
                <span style={{ width: `${relation.tension}%` }} />
              </div>
            </div>
            <strong>敌意 {relation.tension}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function SecretsPanel() {
  return (
    <section className="ink-panel side-panel">
      <div className="section-top">
        <h2>待解秘密</h2>
        <a href="#">查看全部</a>
      </div>
      <div className="secret-list">
        {dashboardData.secrets.map((secret) => (
          <article className="secret-row" key={secret.text}>
            <DashboardIcon icon={secret.icon} className="size-4" />
            <span>{secret.text}</span>
            <strong data-priority={secret.priority}>
              {secret.priority === "high" ? "高" : "中"}
            </strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function TrendsPanel() {
  return (
    <section className="ink-panel side-panel trend-panel">
      <div className="section-top">
        <h2>近期趋势</h2>
        <a href="#">查看全部</a>
      </div>
      <div className="trend-list">
        {dashboardData.trends.map((trend) => (
          <article className="trend-row" key={trend.text}>
            {trend.direction === "up" ? (
              <TrendingUp aria-hidden="true" className="size-5" />
            ) : (
              <TrendingDown aria-hidden="true" className="size-5" />
            )}
            <span>{trend.text}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function RightRail({
  relationships,
  time,
}: {
  relationships: Relationship[];
  time: TimeInfo;
}) {
  return (
    <aside className="right-rail" aria-label="世界信息栏">
      <TimeCard time={time} />
      <RelationshipsPanel relationships={relationships} />
      <SecretsPanel />
      <TrendsPanel />
    </aside>
  );
}

export function InkDashboard() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [seedAssetsOpen, setSeedAssetsOpen] = useState(false);
  const worldLibraryValue = useSyncExternalStore(
    subscribeToWorldLibrary,
    getWorldLibrarySnapshot,
    () => null,
  );
  const worldSettingsValue = useSyncExternalStore(
    subscribeToWorldSettings,
    getWorldSettingsSnapshot,
    () => null,
  );
  const seedAssetsValue = useSyncExternalStore(
    subscribeToWorldSeedAssets,
    getWorldSeedAssetsSnapshot,
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
  const activeWorld = useMemo(
    () => getActiveWorld(worldLibrary),
    [worldLibrary],
  );
  const activeWorldId = activeWorld?.id ?? worldLibrary.activeWorldId;
  const storedSettings = useMemo(
    () => parseStoredWorldSettings(worldSettingsValue, activeWorldId),
    [activeWorldId, worldSettingsValue],
  );
  const seedAssets = useMemo(
    () => parseStoredWorldSeedAssets(seedAssetsValue, activeWorldId),
    [activeWorldId, seedAssetsValue],
  );
  const runtimeState = useMemo(
    () => parseStoredWorldRuntimeState(runtimeValue, activeWorldId),
    [activeWorldId, runtimeValue],
  );
  const hasRuntimeRecord =
    Boolean(activeWorldId) || hasStoredWorldRuntime(runtimeValue, activeWorldId);
  const editableSettings = useMemo(() => {
    if (storedSettings) {
      return storedSettings;
    }

    if (activeWorld) {
      return worldRecordToWorldSettings(activeWorld);
    }

    return worldInfoToWorldSettings(dashboardData.world);
  }, [activeWorld, storedSettings]);
  const world = useMemo(
    () =>
      storedSettings
        ? worldSettingsToWorldInfo(storedSettings)
        : activeWorld
          ? worldRecordToWorldInfo(activeWorld)
          : dashboardData.world,
    [activeWorld, storedSettings],
  );
  const derivedStats = useMemo(
    () =>
      deriveRuntimeStats(
        deriveSeedStats(seedAssets, dashboardData.stats),
        runtimeState,
      ),
    [runtimeState, seedAssets],
  );
  const derivedRuntime = useMemo(
    () =>
      hasRuntimeRecord
        ? deriveRuntimeStatus(runtimeState)
        : dashboardData.runtime,
    [hasRuntimeRecord, runtimeState],
  );
  const derivedEvents = useMemo(
    () => (hasRuntimeRecord ? deriveRuntimeEvents(runtimeState) : dashboardData.events),
    [hasRuntimeRecord, runtimeState],
  );
  const derivedChapter = useMemo(
    () =>
      hasRuntimeRecord
        ? deriveRuntimeChapter(runtimeState)
        : dashboardData.chapter,
    [hasRuntimeRecord, runtimeState],
  );
  const derivedTime = useMemo(
    () => (hasRuntimeRecord ? deriveRuntimeTime(runtimeState) : dashboardData.time),
    [hasRuntimeRecord, runtimeState],
  );
  const derivedCharacters = useMemo(
    () =>
      deriveSeedCharacters(
        seedAssets,
        dashboardData.characters,
        dashboardData.assets.writer,
      ),
    [seedAssets],
  );
  const derivedRelationships = useMemo(
    () => deriveSeedRelationships(seedAssets, dashboardData.relationships),
    [seedAssets],
  );
  function handleSaveSettings(settings: WorldSettings) {
    if (!activeWorldId) {
      return;
    }

    saveWorldSettings(activeWorldId, settings);
  }

  function handleSaveSeedAssets(assets: WorldSeedAssets) {
    if (!activeWorldId) {
      return;
    }

    saveWorldSeedAssets(activeWorldId, assets);
  }

  function handleTogglePaused() {
    if (!activeWorldId) {
      return;
    }

    saveWorldRuntimeState(activeWorldId, toggleWorldRuntimePaused(runtimeState));
  }

  function handleAdvanceDay() {
    if (!activeWorldId) {
      return;
    }

    saveWorldRuntimeState(activeWorldId, advanceWorldRuntimeOneDay(runtimeState));
  }

  function handleRecordEvent(input: {
    title: string;
    summary: string;
    type: WorldRuntimeEventType;
    participants?: string[];
    location?: string;
    impact?: string;
    detail?: string;
    importance?: WorldRuntimeEventImportance;
  }) {
    if (!activeWorldId) {
      return false;
    }

    const next = appendWorldRuntimeEvent(runtimeState, input);

    if (!next) {
      return false;
    }

    saveWorldRuntimeState(activeWorldId, next);
    return true;
  }

  return (
    <main className="dashboard-page">
      <Sidebar />
      <div className="dashboard-main">
        <WorldBanner
          world={world}
          worlds={worldLibrary.worlds}
          activeWorldId={activeWorldId}
          onEditSettings={() => setSettingsOpen(true)}
          onEditSeeds={() => setSeedAssetsOpen(true)}
          onSwitchWorld={setActiveWorldId}
        />
        <div className="dashboard-grid">
          <div className="main-column">
            <StatsAndRuntime
              stats={derivedStats}
              runtime={derivedRuntime}
              onTogglePaused={handleTogglePaused}
              onAdvanceDay={handleAdvanceDay}
            />
            <div className="content-grid">
              <EventsPanel
                events={derivedEvents}
                onRecordEvent={handleRecordEvent}
              />
              <ChapterPanel chapter={derivedChapter} />
            </div>
            <CharactersPanel characters={derivedCharacters} />
          </div>
          <RightRail relationships={derivedRelationships} time={derivedTime} />
        </div>
      </div>
      {settingsOpen ? (
        <WorldSettingsEditor
          settings={editableSettings}
          onClose={() => setSettingsOpen(false)}
          onSave={handleSaveSettings}
        />
      ) : null}
      {seedAssetsOpen ? (
        <SeedAssetsEditor
          assets={seedAssets}
          onClose={() => setSeedAssetsOpen(false)}
          onSave={handleSaveSeedAssets}
        />
      ) : null}
    </main>
  );
}
