import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  Clock3,
  Home,
  ScrollText,
  Users,
} from "lucide-react";

import {
  listOrFallback,
  textOrFallback,
  type StoryChapter,
} from "@/lib/story-chapters";

function ReaderFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarClock;
  label: string;
  value: string;
}) {
  return (
    <div className="story-reader-fact">
      <Icon aria-hidden="true" className="size-4" />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function StoryChapterReader({ chapter }: { chapter: StoryChapter | null }) {
  if (!chapter) {
    return (
      <main className="story-page story-reader-page">
        <section className="story-reader-panel">
          <div className="story-empty-state reader-missing">
            <ScrollText aria-hidden="true" className="size-8" />
            <h1>没有找到这个章节</h1>
            <p>当前地址没有匹配的 mock 章节。返回列表后可以继续查看已有示例章节。</p>
            <div className="story-reader-actions">
              <Link href="/stories" className="story-read-link">
                <ArrowLeft aria-hidden="true" className="size-4" />
                返回章节列表
              </Link>
              <Link href="/" className="story-secondary-link">
                <Home aria-hidden="true" className="size-4" />
                回到工作台
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const characters = listOrFallback(chapter.mainCharacters, "主要角色未记录");
  const content =
    chapter.content && chapter.content.length > 0
      ? chapter.content
      : ["正文占位尚未生成。后续真实故事章节接入后，这里会展示完整正文。"];

  return (
    <main className="story-page story-reader-page">
      <article className="story-reader-panel">
        <nav className="story-reader-nav" aria-label="阅读导航">
          <Link href="/stories" className="event-back-link">
            <ArrowLeft aria-hidden="true" className="size-4" />
            返回章节列表
          </Link>
          <Link href="/" className="story-secondary-link">
            <Home aria-hidden="true" className="size-4" />
            回到工作台
          </Link>
        </nav>

        <header className="story-reader-head">
          <p className="eyebrow">章节阅读 · Mock 内容</p>
          <h1>{textOrFallback(chapter.title, "未命名章节")}</h1>
          <p>{textOrFallback(chapter.summary, "这一章还没有摘要。")}</p>
        </header>

        <section className="story-reader-facts" aria-label="章节元信息">
          <ReaderFact
            icon={CalendarClock}
            label="生成时间"
            value={textOrFallback(chapter.generatedAt, "生成时间未记录")}
          />
          <ReaderFact
            icon={Clock3}
            label="世界时间"
            value={textOrFallback(chapter.worldTime, "世界时间未记录")}
          />
          <div className="story-reader-fact story-reader-characters">
            <Users aria-hidden="true" className="size-4" />
            <span>主要角色</span>
            <strong>{characters.join("、")}</strong>
          </div>
        </section>

        <section className="story-reader-copy" aria-label="章节正文">
          <div className="story-reader-stamp" aria-hidden="true">
            <BookOpen className="size-5" />
          </div>
          {content.map((paragraph, index) => (
            <p key={`${chapter.id}-${index}`}>{paragraph}</p>
          ))}
        </section>
      </article>
    </main>
  );
}
