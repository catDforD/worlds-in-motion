export type WorldSettings = {
  worldName: string;
  worldType: string;
  background: string;
  worldRules: string;
  stylePreferences: string;
  prohibitedContent: string;
  coreConflict: string;
};

export type StoredWorldSettings = {
  version: 1;
  settings: WorldSettings;
};
