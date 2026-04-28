export type WorldSeedCharacter = {
  id: string;
  name: string;
  identity: string;
  goal: string;
  status: string;
};

export type WorldSeedFaction = {
  id: string;
  name: string;
  stance: string;
  resources: string;
  conflict: string;
};

export type WorldSeedLocation = {
  id: string;
  name: string;
  type: string;
  importance: string;
};

export type WorldSeedRelationship = {
  id: string;
  participantA: string;
  participantB: string;
  description: string;
  tension: number;
  note: string;
};

export type WorldSeedAssets = {
  characters: WorldSeedCharacter[];
  factions: WorldSeedFaction[];
  locations: WorldSeedLocation[];
  relationships: WorldSeedRelationship[];
};

export type StoredWorldSeedAssets = {
  version: 2;
  byWorldId: Record<string, WorldSeedAssets>;
};

export type LegacyStoredWorldSeedAssets = {
  version: 1;
  assets: WorldSeedAssets;
};
