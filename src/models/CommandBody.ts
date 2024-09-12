export interface CommandBody {
  id?: string;
  command: string;
  subcommand: string;
  parameters: {
    method: string;
    path?: string;
    id?: string;
  };
}
