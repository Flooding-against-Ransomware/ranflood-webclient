export type Command = {
  id: string; //this must be unique
  command: string;
  subcommand: string;
  method: string;
  path: string;
  dependencies?: string[];
};

export type CommandStatus = {
  id: string;
  status: "pending" | "in-progress" | "completed" | "failed";
};

export type Strategy = {
  name: string;
  commands: Command[];
};
