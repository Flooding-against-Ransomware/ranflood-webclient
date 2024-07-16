import { createContext, useContext } from "react";

export const SelectedHostContext = createContext<string | undefined>(undefined);

export function useSelectedHostContext() {
  const selectedHost = useContext(SelectedHostContext);

  if (selectedHost === undefined) {
    throw new Error(
      "useSelectedHostContext must be used with a SelectedHostContext"
    );
  }

  return selectedHost;
}
