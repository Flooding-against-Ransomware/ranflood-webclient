export interface CommandBody {
  command: string;
  subcommand: string;
  parameters: {
    method: string;
    path?: string;
    id?: string;
  };
}
