import { StoryChapterReader } from "@/components/stories/story-chapter-reader";
import {
  getStoryChapterById,
  mockStoryChapters,
} from "@/lib/story-chapters";

export function generateStaticParams() {
  return mockStoryChapters.map((chapter) => ({ chapterId: chapter.id }));
}

export default async function StoryChapterPage({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = await params;

  return <StoryChapterReader chapter={getStoryChapterById(chapterId)} />;
}
