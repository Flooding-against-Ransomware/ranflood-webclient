export interface CommandStatus {
  command: string;
  subcommand: string;
  status: "success" | "error" | "in progress";
  id: string;
  data?: string;
  parameters: {
    method?: string;
    path?: string;
    id?: string;
  };
}
