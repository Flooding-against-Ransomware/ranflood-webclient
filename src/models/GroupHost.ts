export interface Host {
  label: string;
  url: string;
}

export interface Group {
  groupName: string;
  hosts: Host[];
}
