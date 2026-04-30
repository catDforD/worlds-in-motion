export type StoryChapter = {
  id: string;
  title: string;
  generatedAt?: string;
  worldTime?: string;
  mainCharacters?: string[];
  summary?: string;
  content?: string[];
};

export const mockStoryChapters: StoryChapter[] = [
  {
    id: "chapter-16-dark-tide",
    title: "第十六章 · 暗潮初起",
    generatedAt: "2026-04-28 09:18",
    worldTime: "大胤 · 永泰二十三年 三月初七 酉时",
    mainCharacters: ["萧景琰", "叶晚棠", "陆昭明"],
    summary:
      "春雨连绵，京城笼在烟雾之中。朝堂之上，一纸奏折掀起千层浪，几人命运因此交错，暗潮终于开始涌动。",
    content: [
      "暮色落在宫墙上时，雨还没有停。萧景琰站在文华殿外，袖中奏折被油纸裹得严密，纸角却仍带着潮气。",
      "叶晚棠从侧门入宫，带来的不是证词，而是一枚被水泡软的铜符。铜符背面刻着江南漕运的暗记，与户部旧案上的朱批正好相合。",
      "陆昭明没有立即表态。他只命人撤去屏风，让殿内烛光照到每一个人的脸上。那一刻，沉默比质问更锋利。",
    ],
  },
  {
    id: "chapter-17-rain-letter",
    title: "第十七章 · 雨夜密信",
    generatedAt: "2026-04-28 09:31",
    worldTime: "大胤 · 永泰二十三年 三月初八 子时",
    mainCharacters: ["叶晚棠", "江无渊", "慕容雪"],
    summary:
      "客栈后院传来短促的哨声，叶晚棠循声而至，在井台下发现一封半毁密信。江无渊的伤势牵出无名山庄旧怨。",
    content: [
      "子时的姑苏城没有打更声，只有檐下水珠一滴一滴砸进青石缝里。叶晚棠推开后门，看见井台旁留着一串湿脚印。",
      "江无渊靠在廊柱下，左肩的血已经浸透绷带。他没有解释自己为何会出现在这里，只把半截密信递给她。",
      "慕容雪站在雨幕深处，白色斗笠遮住眉眼。她说无名山庄从不追杀无关之人，而这封信上的名字，每一个都该死。",
    ],
  },
  {
    id: "chapter-18-north-report",
    title: "第十八章 · 北境急报与极长角色名测试札记",
    generatedAt: "2026-04-28 09:47",
    worldTime: "大胤 · 永泰二十三年 三月初八 辰时",
    mainCharacters: ["陆昭明", "萧景琰", "北境都护府长史沈听澜"],
    summary:
      "北境八百里加急送入京城，边关粮道与江南水患在同一份军报中相互勾连。陆昭明意识到，朝堂争斗只是更大棋局的表面。",
    content: [
      "急报抵达时，京城刚刚开市。马蹄踏碎积水，也踏碎了昨夜短暂的安宁。",
      "军报只有三页，字字干枯，却把北境粮道、江南漕运、户部旧账串成了一条让人无法忽视的线。",
      "萧景琰读到最后，忽然明白那场弹劾并不是开端。他们所有人，都已经站在一场更早布下的局里。",
    ],
  },
  {
    id: "chapter-19-missing-fields",
    title: "第十九章 · 未完残稿",
    mainCharacters: [],
    content: [
      "这是一段用于验证字段缺失回退的章节占位。真实章节接入前，页面应当保持可读，并明确哪些信息尚未记录。",
    ],
  },
];

export function getStoryChapterById(chapterId: string) {
  return mockStoryChapters.find((chapter) => chapter.id === chapterId) ?? null;
}

export function textOrFallback(value: string | undefined, fallback: string) {
  const trimmed = value?.trim() ?? "";

  return trimmed || fallback;
}

export function listOrFallback(values: string[] | undefined, fallback: string) {
  const normalized = (values ?? [])
    .map((value) => value.trim())
    .filter(Boolean);

  return normalized.length > 0 ? normalized : [fallback];
}
