export type ActiveWorldId = string | null;

export type WorldRecord = {
  id: string;
  name: string;
  type: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type StoredWorldLibrary = {
  version: 1;
  activeWorldId: ActiveWorldId;
  worlds: WorldRecord[];
};

export type WorldLibraryState = StoredWorldLibrary;

export type WorldRecordInput = {
  name: string;
  type: string;
  description: string;
  tags?: string[];
};

export type WorldLibraryMigrationResult = {
  migrated: boolean;
  worldId: ActiveWorldId;
};
