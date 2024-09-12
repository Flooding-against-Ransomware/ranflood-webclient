export type StratCommand = {
  id: string; //must be unique
  command: string;
  subcommand: string;
  method: string;
  path: string;
  dependencies?: string[];
  duration?: number; //used only for flood start, in seconds
};

export type Strategy = {
  name: string;
  commands: StratCommand[];
};
