import axios from "axios";
import { SnapshotObject, FloodObject } from "../models/Models";
import { CommandStatus } from "../models/CommandStatus";
import { CommandBody } from "../models/CommandBody";

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

export async function commandRequest(
  host: string,
  commandBody: CommandBody,
  timeout: number
): Promise<string | undefined> {
  const response = await axios.post(
    host,
    {
      command: commandBody.command,
      subcommand: commandBody.subcommand,
      parameters: commandBody.parameters,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
      timeout,
    }
  );
  return response.data.id;
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
