import type { WorldInfo } from "@/types/dashboard";
import type {
  WorldCreationForm,
  WorldTypeId,
  WorldTypeOption,
} from "@/types/world-creation";

export const WORLD_CREATION_STORAGE_KEY = "worlds-in-motion.created-world";

export const worldTypeOptions: WorldTypeOption[] = [
  {
    id: "court",
    label: "宫廷权谋",
    description: "朝堂、密诏、派系与家族利益互相牵制。",
    iconKey: "crown",
  },
  {
    id: "academy",
    label: "魔法学院",
    description: "秘法课程、学派竞争和失控实验交织推进。",
    iconKey: "academy",
  },
  {
    id: "shelter",
    label: "末日避难所",
    description: "资源配给、信任崩塌和外部威胁同时压迫。",
    iconKey: "shelter",
  },
  {
    id: "mystery-town",
    label: "小镇悬疑",
    description: "熟人社会表面平静，旧案与谣言暗中发酵。",
    iconKey: "mystery",
  },
  {
    id: "cultivation",
    label: "修仙宗门",
    description: "门规、灵脉、师承与大道选择形成长期张力。",
    iconKey: "mountain",
  },
  {
    id: "custom",
    label: "自定义",
    description: "写下独有类型，让世界从自己的规则开始。",
    iconKey: "custom",
  },
];

const worldTypeLabels = new Map<WorldTypeId, string>(
  worldTypeOptions.map((option) => [option.id, option.label]),
);

export function getWorldTypeLabel(form: WorldCreationForm) {
  if (form.worldTypeId === "custom") {
    return form.customWorldTypeName.trim() || "自定义";
  }

  return form.worldTypeId ? worldTypeLabels.get(form.worldTypeId) ?? "未定类型" : "未定类型";
}

export function worldCreationToWorldInfo(form: WorldCreationForm): WorldInfo {
  const typeLabel = getWorldTypeLabel(form);
  const narrativeStyle = form.narrativeStyle.trim();

  return {
    title: form.worldName.trim() || "未命名世界",
    description: form.background.trim() || "这个世界的背景仍在落墨成形。",
    tags: [
      { label: typeLabel },
      ...(narrativeStyle ? [{ label: narrativeStyle }] : []),
    ],
  };
}

export function parseStoredCreatedWorld(value: string | null): WorldCreationForm | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<WorldCreationForm>;

    if (
      typeof parsed.worldName !== "string" ||
      typeof parsed.worldTypeId !== "string" ||
      typeof parsed.customWorldTypeName !== "string" ||
      typeof parsed.background !== "string" ||
      typeof parsed.narrativeStyle !== "string" ||
      typeof parsed.worldRules !== "string" ||
      typeof parsed.initialConflict !== "string"
    ) {
      return null;
    }

    const validIds = new Set<WorldTypeId>(worldTypeOptions.map((option) => option.id));
    if (parsed.worldTypeId !== "" && !validIds.has(parsed.worldTypeId as WorldTypeId)) {
      return null;
    }

    return {
      worldName: parsed.worldName,
      worldTypeId: parsed.worldTypeId as WorldCreationForm["worldTypeId"],
      customWorldTypeName: parsed.customWorldTypeName,
      background: parsed.background,
      narrativeStyle: parsed.narrativeStyle,
      worldRules: parsed.worldRules,
      initialConflict: parsed.initialConflict,
    };
  } catch {
    return null;
  }
}
