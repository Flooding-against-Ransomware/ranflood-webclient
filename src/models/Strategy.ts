export type Action = {
  command: string;
  subcommand: string;
  method: string;
  path: string;
};

export type Strategy = {
  name: string;
  actions: Action[];
};
