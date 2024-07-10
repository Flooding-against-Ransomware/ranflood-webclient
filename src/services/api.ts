import axios from "axios";
import { SnapshotObject, FloodObject } from "../models/Models";

type SetSnapshotFunction = (list: SnapshotObject[]) => void;
type SetFloodFunction = (list: FloodObject[]) => void;

export async function refreshHostState(
  host: string,
  setSnapshotList: SetSnapshotFunction,
  setFloodList: SetFloodFunction
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
  method: string
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
      }
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function takeSnapshot(
  host: string,
  path: string,
  method: string
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
      }
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function startFlooding(
  host: string,
  path: string,
  method: string
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
      }
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function stopFlooding(
  host: string,
  id: string,
  method: string
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
      }
    );
  } catch (error) {
    console.error("Error:", error);
  }
}
