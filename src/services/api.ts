import axios from "axios";
import { SnapshotObject, FloodObject } from "../models/Models";

type SetSnapshotFunction = (list: SnapshotObject[]) => void;
type SetFloodFunction = (list: FloodObject[]) => void;
type setVersionFunction = (version: string) => void;

export async function refreshHostState(
  host: string,
  setSnapshotList: SetSnapshotFunction,
  setFloodList: SetFloodFunction,
  timeout: number
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
  }
}

export async function removeSnapshot(
  host: string,
  path: string,
  method: string,
  timeout: number
): Promise<void> {
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
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function takeSnapshot(
  host: string,
  path: string,
  method: string,
  timeout: number
): Promise<void> {
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
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function startFlooding(
  host: string,
  path: string,
  method: string,
  timeout: number
): Promise<void> {
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
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function stopFlooding(
  host: string,
  id: string,
  method: string,
  timeout: number
): Promise<void> {
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
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function getDeamonVersion(
  host: string,
  setDeamonVersion: setVersionFunction
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
    console.log("RISPOSTAAA", response.data);
    setDeamonVersion(response.data);
  } catch (error) {
    console.error("Error:", error);
  }
}
