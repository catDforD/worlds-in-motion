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
import type {
  Character,
  DashboardIconKey,
  Relationship,
  StatItem,
  WorldInfo,
} from "@/types/dashboard";
import type {
  WorldSeedAssets,
  WorldSeedCharacter,
  WorldSeedFaction,
  WorldSeedLocation,
  WorldSeedRelationship,
} from "@/types/world-seed-assets";
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
  onEditSeeds,
}: {
  world: WorldInfo;
  onEditSettings: () => void;
  onEditSeeds: () => void;
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
}: {
  assets: WorldSeedAssets;
  onClose: () => void;
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
    saveWorldSeedAssets(form);
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

function StatsAndRuntime({ stats }: { stats: StatItem[] }) {
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

function RightRail({ relationships }: { relationships: Relationship[] }) {
  return (
    <aside className="right-rail" aria-label="世界信息栏">
      <TimeCard />
      <RelationshipsPanel relationships={relationships} />
      <SecretsPanel />
      <TrendsPanel />
    </aside>
  );
}

export function InkDashboard() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [seedAssetsOpen, setSeedAssetsOpen] = useState(false);
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
  const seedAssets = useMemo(
    () => parseStoredWorldSeedAssets(seedAssetsValue),
    [seedAssetsValue],
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
  const derivedStats = useMemo(
    () => deriveSeedStats(seedAssets, dashboardData.stats),
    [seedAssets],
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

  return (
    <main className="dashboard-page">
      <Sidebar />
      <div className="dashboard-main">
        <WorldBanner
          world={world}
          onEditSettings={() => setSettingsOpen(true)}
          onEditSeeds={() => setSeedAssetsOpen(true)}
        />
        <div className="dashboard-grid">
          <div className="main-column">
            <StatsAndRuntime stats={derivedStats} />
            <div className="content-grid">
              <EventsPanel />
              <ChapterPanel />
            </div>
            <CharactersPanel characters={derivedCharacters} />
          </div>
          <RightRail relationships={derivedRelationships} />
        </div>
      </div>
      {settingsOpen ? (
        <WorldSettingsEditor
          settings={editableSettings}
          onClose={() => setSettingsOpen(false)}
        />
      ) : null}
      {seedAssetsOpen ? (
        <SeedAssetsEditor
          assets={seedAssets}
          onClose={() => setSeedAssetsOpen(false)}
        />
      ) : null}
    </main>
  );
}
