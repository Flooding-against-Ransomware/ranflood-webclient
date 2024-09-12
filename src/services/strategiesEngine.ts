import { StratCommand, Strategy } from "../models/Strategy";
import { CommandBody } from "../models/CommandBody";
import { CommandStatus } from "../models/CommandStatus";
import { v4 as uuidv4 } from "uuid";

export class StrategiesEngine {
  private strategy: Strategy | undefined;
  private commandStat: Map<string, string> = new Map();
  //mappa id settato dallo user a uuid usato nel server
  private uuidMap: Map<string, string> = new Map();
  private sendMessage: (message: string) => void;
  private updateCommandStatus: (key: string, value: string) => void;
  private isStopped: boolean = false;
  private dependencyGraph: Map<string, string[]> = new Map();
  private reverseDependencyGraph: Map<string, string[]> = new Map(); // Per tenere traccia dei comandi bloccati da un comando
  private setIsRunning: (status: boolean) => void;

  constructor(
    sendMessage: (message: string) => void,
    updateCommandStatus: (key: string, value: string) => void,
    messageHandler: (handler: (message: string) => void) => void,
    setIsRunning: (status: boolean) => void
  ) {
    this.sendMessage = sendMessage;
    this.updateCommandStatus = updateCommandStatus;
    this.strategy = undefined;
    this.setIsRunning = setIsRunning;

    //setto l'handler per il ws
    messageHandler((message) => {
      console.log("Strategies page received:", message);

      let msg: CommandStatus;
      try {
        msg = JSON.parse(message);

        console.log(this.commandStat);

        switch (msg.command) {
          case "snapshot":
            if (msg.subcommand === "add" || msg.subcommand === "remove") {
              this.onCommandCompleted(this.getIdByUuid(msg.id), msg.status);
            }
            break;

          case "flood":
            if (msg.subcommand === "start") {
              this.onCommandCompleted(this.getIdByUuid(msg.id), msg.status);
            }
            break;

          default:
            break;
        }
      } catch (error) {
        console.error(error);
      }
    });
  }

  public runStrategy(strategy: Strategy): void {
    this.setIsRunning(true);
    this.commandStat.clear();
    this.uuidMap.clear();
    this.dependencyGraph.clear();
    this.reverseDependencyGraph.clear();
    this.strategy = strategy;

    this.strategy.commands.forEach((command) => {
      const uuid: any = uuidv4();
      this.uuidMap.set(command.id, uuid);
      this.commandStat.set(command.id, "pending");

      // Popola il DAG
      this.dependencyGraph.set(command.id, command.dependencies || []);

      // Popola il reverse DAG per i comandi che dipendono da questo
      (command.dependencies || []).forEach((dep) => {
        if (!this.reverseDependencyGraph.has(dep)) {
          this.reverseDependencyGraph.set(dep, []);
        }
        this.reverseDependencyGraph.get(dep)?.push(command.id);
      });

      this.updateCommandStatus(command.id, "pending");
    });

    this.executeCommands(strategy.commands);
  }

  private canExecute(command: StratCommand): boolean {
    const explicitDepsSatisfied = (command.dependencies || []).every(
      (depId) => this.commandStat.get(depId) === "success"
    );
    return explicitDepsSatisfied;
  }

  private getUuidFromId(id: string): string {
    return this.uuidMap.get(id) || "";
  }
  private getIdByUuid(value: string): string {
    for (let [key, val] of this.uuidMap.entries()) {
      if (val === value) {
        return key;
      }
    }
    return ""; // Nessuna corrispondenza trovata
  }

  private runCommand(command: StratCommand): void {
    try {
      if (this.isStopped) {
        throw new Error("Execution stopped");
      }

      this.commandStat.set(command.id, "in progress");
      this.updateCommandStatus(command.id, "in progress");

      const commandBody: CommandBody = {
        id: this.getUuidFromId(command.id),
        command: command.command,
        subcommand: command.subcommand,
        parameters: {
          method: command.method,
          path: command.path,
        },
      };

      console.log("Executing command", commandBody); // SOLO PER DEBUG
      this.sendMessage(JSON.stringify(commandBody));

      // nel caso di flood start dobbiamo pianificare anche flood stop
      if (
        command.command === "flood" &&
        command.subcommand === "start" &&
        command.duration
      ) {
        setTimeout(() => {
          commandBody.subcommand = "stop";
          commandBody.parameters.id = this.getUuidFromId(command.id);
          console.log("sending flood stop");
          this.sendMessage(JSON.stringify(commandBody));
        }, command.duration * 1000);
      }
    } catch (error) {
      this.updateCommandStatus(command.id, "error");
      this.commandStat.set(command.id, "error");
      console.error(`Failed to execute command ${command.id}:`, error);
    }
  }

  // Esegue tutti i comandi controllando che non abbiano dipendenze
  private async executeCommands(commands: StratCommand[]): Promise<void> {
    const pendingCommands = commands.filter(
      (cmd) => this.commandStat.get(cmd.id) === "pending"
    );

    const executableCommands = pendingCommands.filter((cmd) =>
      this.canExecute(cmd)
    );

    //manca solo la gestione dei deadlock e capire dove mettere il comando per bloccare l'esecuzione

    executableCommands.map((cmd) => this.runCommand(cmd));
  }

  private onCommandCompleted(commandId: string, status: string): void {
    this.commandStat.set(commandId, status);
    this.updateCommandStatus(commandId, status);

    const allCompleted = this.strategy?.commands.every(
      (depId) =>
        this.commandStat.get(depId.id) === "success" ||
        this.commandStat.get(depId.id) === "error"
    );

    if (allCompleted) {
      this.setIsRunning(false);
      return;
    }

    // Ottieni i comandi che dipendono da questo e verifica se possono essere eseguiti
    const dependentCommands = this.reverseDependencyGraph.get(commandId) || [];

    dependentCommands.forEach((depCommandId) => {
      // Verifica se tutte le dipendenze di questo comando sono completate
      const canExecute = (this.dependencyGraph.get(depCommandId) || []).every(
        (depId) => this.commandStat.get(depId) === "success"
      );

      if (canExecute) {
        const commandToRun = this.strategy!.commands.find(
          (cmd) => cmd.id === depCommandId
        );
        if (commandToRun) {
          this.runCommand(commandToRun); // Esegui il comando sbloccato
        }
      }
    });
  }

  public editCmdStatus(id: string, cmd: string) {
    this.commandStat.set(id, cmd);
    this.updateCommandStatus(id, cmd);
  }

  public stopExecution() {
    this.setIsRunning(false);
    this.isStopped = true;
  }
}
