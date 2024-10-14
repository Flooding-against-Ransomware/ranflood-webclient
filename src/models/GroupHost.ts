export interface Host {
  label: string;
  url: string;
  status?: "offline" | "online" | "working";
}

export interface Group {
  groupName: string;
  hosts: Host[];
}
