"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  Box,
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
  PlusCircle,
  Scroll,
  ScrollText,
  Settings,
  ShieldQuestionMark,
  Sparkles,
  Target,
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
  parseStoredCreatedWorld,
  WORLD_CREATION_STORAGE_KEY,
} from "@/lib/world-creation";
import {
  getWorldSettingsSnapshot,
  parseStoredWorldSettings,
  saveWorldSettings,
  subscribeToWorldSettings,
  worldCreationToWorldSettings,
  worldInfoToWorldSettings,
  worldSettingsToWorldInfo,
} from "@/lib/world-settings";
import type { DashboardIconKey, WorldInfo } from "@/types/dashboard";
import type { WorldSettings } from "@/types/world-settings";

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

function subscribeToCreatedWorld(callback: () => void) {
  window.addEventListener("storage", callback);

  return () => window.removeEventListener("storage", callback);
}

function getCreatedWorldValue() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(WORLD_CREATION_STORAGE_KEY);
}

function getAvatarSrc(name: string) {
  return avatarSrcByName.get(name) ?? dashboardData.assets.writer;
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
        {dashboardData.navItems.map((item) => (
          <a
            href="#"
            aria-current={item.active ? "page" : undefined}
            className="sidebar-link"
            key={item.label}
          >
            <DashboardIcon icon={item.icon} className="size-5" />
            <span>{item.label}</span>
          </a>
        ))}
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

function WorldBanner({
  world,
  onEditSettings,
}: {
  world: WorldInfo;
  onEditSettings: () => void;
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
        <button type="button" aria-label="资源箱" className="round-action">
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
}: {
  settings: WorldSettings;
  onClose: () => void;
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
    saveWorldSettings(form);
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

function StatsAndRuntime() {
  return (
    <div className="overview-grid">
      <section className="ink-panel stat-panel" aria-label="统计概览">
        {dashboardData.stats.map((stat) => (
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
            <Button className="ink-action" variant="outline" size="sm">
              <Pause aria-hidden="true" className="size-4" />
              暂停运行
            </Button>
          </div>
          <p className="runtime-title">{dashboardData.runtime.title}</p>
          <p className="runtime-meta">
            已连续运行 {dashboardData.runtime.days} 天
          </p>
          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${dashboardData.runtime.progress}%` }} />
          </div>
          <p className="runtime-next">
            下个时间点：{dashboardData.runtime.nextTime}
          </p>
        </div>
      </section>
    </div>
  );
}

function EventsPanel() {
  return (
    <section className="ink-panel content-panel">
      <div className="section-top">
        <h2>近期事件</h2>
        <a href="#">查看全部</a>
      </div>
      <div className="event-list">
        {dashboardData.events.map((event) => (
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

function ChapterPanel() {
  const chapter = dashboardData.chapter;

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

function CharactersPanel() {
  return (
    <section className="ink-panel character-panel">
      <div className="section-top">
        <h2>活跃角色</h2>
        <a href="#">查看全部</a>
      </div>
      <div className="character-strip">
        {dashboardData.characters.map((character) => (
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

function TimeCard() {
  return (
    <section className="ink-panel time-card">
      <div>
        <p className="eyebrow">当前时间</p>
        <p className="time-era">{dashboardData.time.era}</p>
        <p className="time-date">{dashboardData.time.date}</p>
        <p className="time-day">{dashboardData.time.day}</p>
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

function RelationshipsPanel() {
  return (
    <section className="ink-panel side-panel">
      <div className="section-top">
        <h2>紧张关系</h2>
        <a href="#">查看全部</a>
      </div>
      <div className="relation-list">
        {dashboardData.relationships.map((relation) => (
          <article className="relation-row" key={`${relation.left}-${relation.right}`}>
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
                <span>{relation.leftStatus}</span>
                <span>{relation.rightStatus}</span>
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

function RightRail() {
  return (
    <aside className="right-rail" aria-label="世界信息栏">
      <TimeCard />
      <RelationshipsPanel />
      <SecretsPanel />
      <TrendsPanel />
    </aside>
  );
}

export function InkDashboard() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const worldSettingsValue = useSyncExternalStore(
    subscribeToWorldSettings,
    getWorldSettingsSnapshot,
    () => null,
  );
  const createdWorldValue = useSyncExternalStore(
    subscribeToCreatedWorld,
    getCreatedWorldValue,
    () => null,
  );
  const createdWorld = useMemo(
    () => parseStoredCreatedWorld(createdWorldValue),
    [createdWorldValue],
  );
  const storedSettings = useMemo(
    () => parseStoredWorldSettings(worldSettingsValue),
    [worldSettingsValue],
  );
  const editableSettings = useMemo(() => {
    if (storedSettings) {
      return storedSettings;
    }

    if (createdWorld) {
      return worldCreationToWorldSettings(createdWorld);
    }

    return worldInfoToWorldSettings(dashboardData.world);
  }, [createdWorld, storedSettings]);
  const world = useMemo(
    () =>
      storedSettings
        ? worldSettingsToWorldInfo(storedSettings)
        : createdWorld
          ? worldSettingsToWorldInfo(worldCreationToWorldSettings(createdWorld))
          : dashboardData.world,
    [createdWorld, storedSettings],
  );

  return (
    <main className="dashboard-page">
      <Sidebar />
      <div className="dashboard-main">
        <WorldBanner world={world} onEditSettings={() => setSettingsOpen(true)} />
        <div className="dashboard-grid">
          <div className="main-column">
            <StatsAndRuntime />
            <div className="content-grid">
              <EventsPanel />
              <ChapterPanel />
            </div>
            <CharactersPanel />
          </div>
          <RightRail />
        </div>
      </div>
      {settingsOpen ? (
        <WorldSettingsEditor
          settings={editableSettings}
          onClose={() => setSettingsOpen(false)}
        />
      ) : null}
    </main>
  );
}
