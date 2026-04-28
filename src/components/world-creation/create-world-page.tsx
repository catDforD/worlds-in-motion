"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Crown,
  GraduationCap,
  Mountain,
  Pencil,
  Search,
  Shield,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  addWorldRecord,
  createWorldRecord,
} from "@/lib/world-library";
import {
  getWorldTypeLabel,
  worldTypeOptions,
} from "@/lib/world-creation";
import {
  saveWorldSettings,
  worldCreationToWorldSettings,
} from "@/lib/world-settings";
import type {
  WorldCreationForm,
  WorldTypeIconKey,
} from "@/types/world-creation";

const emptyForm: WorldCreationForm = {
  worldName: "",
  worldTypeId: "",
  customWorldTypeName: "",
  background: "",
  narrativeStyle: "",
  worldRules: "",
  initialConflict: "",
};

const typeIconMap: Record<WorldTypeIconKey, LucideIcon> = {
  crown: Crown,
  academy: GraduationCap,
  shelter: Shield,
  mystery: Search,
  mountain: Mountain,
  custom: Pencil,
};

type FieldName = keyof WorldCreationForm;

function updateField(
  form: WorldCreationForm,
  field: FieldName,
  value: string,
): WorldCreationForm {
  return {
    ...form,
    [field]: value,
  };
}

function trimOrPlaceholder(value: string, placeholder: string) {
  return value.trim() || placeholder;
}

function validateForm(form: WorldCreationForm) {
  return {
    worldName: form.worldName.trim() ? "" : "请先为世界命名",
    worldTypeId: form.worldTypeId ? "" : "请选择一个世界类型",
    customWorldTypeName:
      form.worldTypeId === "custom" && !form.customWorldTypeName.trim()
        ? "请填写自定义类型名称"
        : "",
  };
}

export function CreateWorldPage() {
  const router = useRouter();
  const [form, setForm] = useState<WorldCreationForm>(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const errors = useMemo(() => validateForm(form), [form]);
  const hasErrors = Object.values(errors).some(Boolean);
  const typeLabel = getWorldTypeLabel(form);

  function setField(field: FieldName, value: string) {
    setForm((current) => updateField(current, field, value));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);

    if (hasErrors) {
      return;
    }

    const world = createWorldRecord({
      name: form.worldName,
      type: typeLabel,
      description: form.background,
      tags: form.narrativeStyle ? [form.narrativeStyle] : [],
    });
    const { world: savedWorld } = addWorldRecord(world);

    saveWorldSettings(savedWorld.id, worldCreationToWorldSettings(form));
    router.push("/");
  }

  return (
    <main className="creation-page">
      <aside className="ink-sidebar creation-sidebar">
        <div className="sidebar-brand">
          <span className="brand-title">织世录</span>
          <span className="brand-seal">印</span>
        </div>
        <nav className="sidebar-nav" aria-label="创建页导航">
          <Link href="/" className="sidebar-link">
            <ArrowLeft aria-hidden="true" className="size-5" />
            <span>返回工作台</span>
          </Link>
          <Link href="/worlds/new" aria-current="page" className="sidebar-link">
            <Sparkles aria-hidden="true" className="size-5" />
            <span>新建世界</span>
          </Link>
        </nav>
      </aside>

      <div className="creation-shell">
        <section className="creation-heading" aria-labelledby="create-world-title">
          <p className="eyebrow">世界创建</p>
          <h1 id="create-world-title">起一卷新天地</h1>
          <p>
            用最少的设定先确定世界的题眼、底色和第一处裂缝，随后进入工作台继续运行。
          </p>
        </section>

        <form className="creation-layout" onSubmit={handleSubmit}>
          <div className="creation-form">
            <section className="creation-section" aria-labelledby="basic-settings-title">
              <div className="section-top">
                <h2 id="basic-settings-title">基础设定</h2>
                <span>一</span>
              </div>

              <label className="ink-field">
                <span>世界名称</span>
                <input
                  value={form.worldName}
                  onChange={(event) => setField("worldName", event.target.value)}
                  aria-invalid={submitted && !!errors.worldName}
                  aria-describedby="world-name-error"
                  placeholder="例如：雾隐十三州"
                />
                {submitted && errors.worldName ? (
                  <em id="world-name-error">{errors.worldName}</em>
                ) : null}
              </label>

              <div className="type-picker" aria-labelledby="world-type-label">
                <p id="world-type-label">世界类型</p>
                <div className="type-grid">
                  {worldTypeOptions.map((option) => {
                    const Icon = typeIconMap[option.iconKey];
                    const selected = form.worldTypeId === option.id;

                    return (
                      <button
                        type="button"
                        className="type-card"
                        data-selected={selected ? "true" : undefined}
                        aria-pressed={selected}
                        key={option.id}
                        onClick={() => setField("worldTypeId", option.id)}
                      >
                        <Icon aria-hidden="true" className="size-5" />
                        <span>{option.label}</span>
                        <small>{option.description}</small>
                      </button>
                    );
                  })}
                </div>
                {submitted && errors.worldTypeId ? (
                  <em>{errors.worldTypeId}</em>
                ) : null}
              </div>

              {form.worldTypeId === "custom" ? (
                <label className="ink-field">
                  <span>自定义类型名称</span>
                  <input
                    value={form.customWorldTypeName}
                    onChange={(event) =>
                      setField("customWorldTypeName", event.target.value)
                    }
                    aria-invalid={submitted && !!errors.customWorldTypeName}
                    aria-describedby="custom-type-error"
                    placeholder="例如：蒸汽神话边境"
                  />
                  {submitted && errors.customWorldTypeName ? (
                    <em id="custom-type-error">{errors.customWorldTypeName}</em>
                  ) : null}
                </label>
              ) : null}
            </section>

            <section className="creation-section" aria-labelledby="world-tone-title">
              <div className="section-top">
                <h2 id="world-tone-title">世界底色</h2>
                <span>二</span>
              </div>

              <label className="ink-field">
                <span>背景简介</span>
                <textarea
                  value={form.background}
                  onChange={(event) => setField("background", event.target.value)}
                  placeholder="写下这个世界的时代、地域、秩序和正在松动的地方。"
                  rows={5}
                />
              </label>

              <label className="ink-field">
                <span>叙事风格</span>
                <input
                  value={form.narrativeStyle}
                  onChange={(event) => setField("narrativeStyle", event.target.value)}
                  placeholder="例如：冷峻群像、温柔怪谈、史诗冒险"
                />
              </label>
            </section>

            <section className="creation-section" aria-labelledby="world-seed-title">
              <div className="section-top">
                <h2 id="world-seed-title">运行种子</h2>
                <span>三</span>
              </div>

              <label className="ink-field">
                <span>世界规则</span>
                <textarea
                  value={form.worldRules}
                  onChange={(event) => setField("worldRules", event.target.value)}
                  placeholder="列出需要长期遵守的力量、社会、资源或禁忌规则。"
                  rows={5}
                />
              </label>

              <label className="ink-field">
                <span>初始冲突</span>
                <textarea
                  value={form.initialConflict}
                  onChange={(event) => setField("initialConflict", event.target.value)}
                  placeholder="写下第一场会推动角色、势力和秘密向前滚动的矛盾。"
                  rows={5}
                />
              </label>
            </section>
          </div>

          <aside className="creation-preview" aria-label="世界雏形预览">
            <div className="preview-stamp" aria-hidden="true">
              <BookOpen className="size-6" />
            </div>
            <p className="eyebrow">世界雏形预览</p>
            <h2>{trimOrPlaceholder(form.worldName, "未命名世界")}</h2>
            <div className="tag-row compact-tags">
              <span>{typeLabel}</span>
              <span>{trimOrPlaceholder(form.narrativeStyle, "叙事风格待定")}</span>
            </div>
            <dl className="preview-list">
              <div>
                <dt>背景</dt>
                <dd>{trimOrPlaceholder(form.background, "背景仍在空白处等待第一笔。")}</dd>
              </div>
              <div>
                <dt>规则</dt>
                <dd>{trimOrPlaceholder(form.worldRules, "世界规则尚未落定。")}</dd>
              </div>
              <div>
                <dt>初始冲突</dt>
                <dd className="conflict-summary">
                  {trimOrPlaceholder(form.initialConflict, "第一道裂缝尚未出现。")}
                </dd>
              </div>
            </dl>
            <Button
              type="submit"
              className="create-submit"
              disabled={hasErrors}
              aria-disabled={hasErrors}
            >
              <Check aria-hidden="true" className="size-4" />
              创建世界
            </Button>
          </aside>
        </form>
      </div>
    </main>
  );
}
