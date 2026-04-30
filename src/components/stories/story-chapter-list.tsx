import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  Clock3,
  ScrollText,
  Users,
} from "lucide-react";

import {
  listOrFallback,
  mockStoryChapters,
  textOrFallback,
  type StoryChapter,
} from "@/lib/story-chapters";

function ChapterMeta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarClock;
  label: string;
  value: string;
}) {
  return (
    <span className="story-meta-item">
      <Icon aria-hidden="true" className="size-4" />
      <span>{label}</span>
      <strong>{value}</strong>
    </span>
  );
}

function StoryChapterCard({
  chapter,
  index,
}: {
  chapter: StoryChapter;
  index: number;
}) {
  const characters = listOrFallback(chapter.mainCharacters, "主要角色未记录");

  return (
    <article className="story-chapter-card">
      <div className="story-chapter-order" aria-label={`第 ${index + 1} 条章节`}>
        {String(index + 1).padStart(2, "0")}
      </div>
      <div className="story-chapter-body">
        <div className="story-chapter-head">
          <div>
            <p className="eyebrow">Mock Chapter</p>
            <h2>{textOrFallback(chapter.title, "未命名章节")}</h2>
          </div>
          <Link href={`/stories/${chapter.id}`} className="story-read-link">
            <BookOpen aria-hidden="true" className="size-4" />
            阅读
          </Link>
        </div>

        <div className="story-meta-grid">
          <ChapterMeta
            icon={CalendarClock}
            label="生成时间"
            value={textOrFallback(chapter.generatedAt, "生成时间未记录")}
          />
          <ChapterMeta
            icon={Clock3}
            label="世界时间"
            value={textOrFallback(chapter.worldTime, "世界时间未记录")}
          />
        </div>

        <div className="story-character-row" aria-label="主要角色">
          <Users aria-hidden="true" className="size-4" />
          <span>主要角色</span>
          <div>
            {characters.map((character) => (
              <em key={character}>{character}</em>
            ))}
          </div>
        </div>

        <p className="story-summary">
          {textOrFallback(chapter.summary, "这一章还没有摘要，后续接入真实故事生成结果后会在这里显示章节梗概。")}
        </p>
      </div>
    </article>
  );
}

export function StoryChapterList() {
  return (
    <main className="story-page">
      <section className="story-hero">
        <div>
          <Link href="/" className="event-back-link">
            <ArrowLeft aria-hidden="true" className="size-4" />
            回到工作台
          </Link>
          <p className="eyebrow">示例章节 · Mock 内容</p>
          <h1>故事章节</h1>
          <p>
            当前页面只读取前端 mock 章节，用于验证章节标题、生成时间、世界时间、主要角色、摘要与阅读入口的信息结构。
          </p>
        </div>
        <div className="story-count" aria-label="章节数量">
          <span>{mockStoryChapters.length}</span>
          <strong>章节</strong>
        </div>
      </section>

      <section className="story-list-shell" aria-label="故事章节列表">
        <div className="story-list-head">
          <div>
            <p className="eyebrow">按生成顺序</p>
            <h2>烟雨江南 · 示例章节</h2>
          </div>
          <span>Mock 数据，不触发生成</span>
        </div>

        {mockStoryChapters.length > 0 ? (
          <div className="story-chapter-list">
            {mockStoryChapters.map((chapter, index) => (
              <StoryChapterCard chapter={chapter} index={index} key={chapter.id} />
            ))}
          </div>
        ) : (
          <div className="story-empty-state">
            <ScrollText aria-hidden="true" className="size-8" />
            <h2>暂时没有故事章节</h2>
            <p>章节生成结果接入前，这里会保持可读空状态，不会显示空白页面。</p>
            <Link href="/" className="story-read-link">
              回到工作台
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
