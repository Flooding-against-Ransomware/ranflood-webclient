import { createContext, useContext } from "react";

export const SelectedHostContext = createContext<
  { label: string; url: string } | undefined
>(undefined);

export function useSelectedHostContext() {
  return useContext(SelectedHostContext);
}
