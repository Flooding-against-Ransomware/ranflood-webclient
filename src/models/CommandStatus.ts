export interface CommandStatus {
  command: string;
  subcommand: string;
  status: "success" | "error" | "in progress";
  id: string;
  errorMsg?: string;
  parameters: {
    method: string;
    path?: string;
    id?: string;
  };
}
