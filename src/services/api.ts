import axios from "axios";
import { SnapshotObject, FloodObject } from "../models/Models";
import { CommandStatus } from "../models/CommandStatus";

type SetSnapshotFunction = (list: SnapshotObject[]) => void;
type SetFloodFunction = (list: FloodObject[]) => void;
type SetVersionFunction = (version: string) => void;
type SetError = (error: string) => void;

export async function refreshHostState(
  host: string,
  setSnapshotList: SetSnapshotFunction,
  setFloodList: SetFloodFunction,
  timeout: number,
  setError: SetError
): Promise<void> {
  try {
    const response = await axios.post(
      host,
      {
        command: "snapshot",
        subcommand: "list",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout,
      }
    );

    setSnapshotList(response.data.list);
  } catch (error) {
    console.error("Error:", error);
    setSnapshotList([]);
    setError("Failed to fetch snapshot list.");
  }

  try {
    const response = await axios.post(
      host,
      {
        command: "flood",
        subcommand: "list",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout,
      }
    );

    setFloodList(response.data.list);
  } catch (error) {
    console.error("Error:", error);
    setFloodList([]);
    setError("Failed to fetch flood list.");
  }
}

export async function takeSnapshot(
  host: string,
  path: string,
  method: string,
  timeout: number,
  setError: SetError
): Promise<string | undefined> {
  try {
    const response = await axios.post(
      host,
      {
        command: "snapshot",
        subcommand: "add",
        parameters: {
          method,
          path,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout,
      }
    );
    return response.data.id;
  } catch (error) {
    console.error("Error:", error);
    setError("Failed to take snapshot.");
  }
}

export async function removeSnapshot(
  host: string,
  path: string,
  method: string,
  timeout: number,
  setError: SetError
): Promise<string | undefined> {
  try {
    const response = await axios.post(
      host,
      {
        command: "snapshot",
        subcommand: "remove",
        parameters: {
          method,
          path,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout,
      }
    );
    return response.data.id;
  } catch (error) {
    console.error("Error:", error);
    setError("Failed to remove Snapshot");
  }
}

export async function startFlooding(
  host: string,
  path: string,
  method: string,
  timeout: number,
  setError: SetError
): Promise<string | undefined> {
  try {
    const response = await axios.post(
      host,
      {
        command: "flood",
        subcommand: "start",
        parameters: {
          method,
          path,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout,
      }
    );
    return response.data.id;
  } catch (error) {
    console.error("Error:", error);
    setError("Failed to start flooding.");
  }
}

export async function stopFlooding(
  host: string,
  id: string,
  method: string,
  timeout: number,
  setError: SetError
): Promise<string | undefined> {
  try {
    const response = await axios.post(
      host,
      {
        command: "flood",
        subcommand: "stop",
        parameters: {
          method,
          id,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout,
      }
    );
    return response.data.id;
  } catch (error) {
    console.error("Error:", error);
    setError("Failed to stop flooding.");
  }
}

export async function getDeamonVersion(
  host: string,
  setDeamonVersion: SetVersionFunction
): Promise<void> {
  try {
    const response = await axios.post(
      host,
      {
        command: "version",
        subcommand: "get",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    setDeamonVersion(response.data);
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function getCommandStatus(
  host: string,
  id: string,
  timeout: number,
  setError: SetError
): Promise<CommandStatus | undefined> {
  try {
    const response = await axios.post(
      host,
      {
        command: "buffer",
        subcommand: "get",
        parameters: {
          id,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    setError("Failed to get command status.");
    return undefined;
  }
}
