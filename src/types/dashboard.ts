export type DashboardIconKey =
  | "world"
  | "users"
  | "network"
  | "compass"
  | "scroll"
  | "book"
  | "settings"
  | "journal"
  | "tools"
  | "roles"
  | "forces"
  | "places"
  | "events"
  | "secrets"
  | "up"
  | "down";

export type NavItem = {
  label: string;
  icon: DashboardIconKey;
  active?: boolean;
};

export type StatItem = {
  label: string;
  value: string;
  unit: string;
  icon: DashboardIconKey;
};

export type WorldTag = {
  label: string;
};

export type WorldInfo = {
  title: string;
  description: string;
  tags: WorldTag[];
};

export type RuntimeStatus = {
  title: string;
  days: number;
  progress: number;
  nextTime: string;
};

export type TimelineEvent = {
  date: string;
  title: string;
  description: string;
  participants: string[];
};

export type StoryChapter = {
  title: string;
  summary: string;
  tags: string[];
  date: string;
  progressDots: number;
  activeDot: number;
  imageSrc: string;
};

export type Character = {
  name: string;
  role: string;
  goal: string;
  status: string;
  influence: number;
  imageSrc: string;
};

export type Relationship = {
  left: string;
  leftStatus: string;
  right: string;
  rightStatus: string;
  tension: number;
};

export type Secret = {
  text: string;
  priority: "high" | "medium";
  icon: DashboardIconKey;
};

export type Trend = {
  text: string;
  direction: "up" | "down";
};

export type TimeInfo = {
  era: string;
  date: string;
  day: string;
};

export type DashboardData = {
  assets: {
    hero: string;
    writer: string;
  };
  navItems: NavItem[];
  world: WorldInfo;
  stats: StatItem[];
  runtime: RuntimeStatus;
  events: TimelineEvent[];
  chapter: StoryChapter;
  characters: Character[];
  time: TimeInfo;
  relationships: Relationship[];
  secrets: Secret[];
  trends: Trend[];
};
