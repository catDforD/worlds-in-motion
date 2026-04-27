export type WorldTypeId =
  | "court"
  | "academy"
  | "shelter"
  | "mystery-town"
  | "cultivation"
  | "custom";

export type WorldTypeIconKey =
  | "crown"
  | "academy"
  | "shelter"
  | "mystery"
  | "mountain"
  | "custom";

export type WorldTypeOption = {
  id: WorldTypeId;
  label: string;
  description: string;
  iconKey: WorldTypeIconKey;
};

export type WorldCreationForm = {
  worldName: string;
  worldTypeId: WorldTypeId | "";
  customWorldTypeName: string;
  background: string;
  narrativeStyle: string;
  worldRules: string;
  initialConflict: string;
};
