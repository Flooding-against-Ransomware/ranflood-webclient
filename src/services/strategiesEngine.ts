import { StratCommand, Strategy } from "../models/Strategy";
import { CommandBody } from "../models/CommandBody";
import { CommandStatus } from "../models/CommandStatus";
import { v4 as uuidv4 } from "uuid";

type ValidationResult = {
  isValid: boolean;
  message?: string;
};

export class StrategiesEngine {
  private strategy: Strategy | undefined;
  private commandStat: Map<string, string> = new Map();
  //mappa id settato dallo user a uuid usato nel server
  private uuidMap: Map<string, string> = new Map();
  private sendMessage?: (message: string) => void;
  private updateCommandStatus: (
    key: string,
    value: { status: string; errorMsg?: string }
  ) => void;
  private isStopped: boolean = false;
  private dependencyGraph: Map<string, string[]> = new Map();
  private reverseDependencyGraph: Map<string, string[]> = new Map(); // Per tenere traccia dei comandi bloccati da un comando
  private setIsRunning: (status: boolean) => void;

  constructor(
    updateCommandStatus: (
      key: string,
      value: { status: string; errorMsg?: string }
    ) => void,
    setIsRunning: (status: boolean) => void,
    sendMessage: ((message: string) => void) | undefined,
    messageHandler: ((handler: (message: string) => void) => void) | undefined
  ) {
    this.sendMessage = sendMessage;
    this.updateCommandStatus = updateCommandStatus;
    this.strategy = undefined;
    this.setIsRunning = setIsRunning;

    //setto l'handler per il ws
    if (messageHandler)
      messageHandler((message) => {
        console.log("Strategies page received:", message);

        let msg: CommandStatus;
        try {
          msg = JSON.parse(message);

          switch (msg.command) {
            case "snapshot":
              if (msg.subcommand === "add" || msg.subcommand === "remove") {
                this.onCommandCompleted(
                  this.getIdByUuid(msg.id),
                  msg.status,
                  msg.data
                );
              }
              break;

            case "flood":
              if (msg.subcommand === "start") {
                this.onCommandCompleted(
                  this.getIdByUuid(msg.id),
                  msg.status,
                  msg.data
                );
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

  public validateStrategy(strategy: Strategy): ValidationResult {
    const idSet = new Set<string>();
    const graph: Map<string, string[]> = new Map();

    for (const cmd of strategy.commands) {
      if (idSet.has(cmd.id)) {
        return {
          isValid: false,
          message: `L'ID del comando ${cmd.id} non è unico nella strategia ${strategy.name}`,
        };
      }
      idSet.add(cmd.id);

      graph.set(cmd.id, cmd.dependencies || []);
    }

    if (this.hasCycle(graph)) {
      return {
        isValid: false,
        message: `La strategia ${strategy.name} contiene cicli nelle dipendenze (deadlock)`,
      };
    }

    return { isValid: true };
  }

  private hasCycle(graph: Map<string, string[]>): boolean {
    const visited = new Set<string>();
    const inStack = new Set<string>();

    const dfs = (node: string): boolean => {
      if (inStack.has(node)) {
        return true;
      }
      if (visited.has(node)) {
        return false;
      }

      visited.add(node);
      inStack.add(node);

      for (const neighbor of graph.get(node) || []) {
        if (dfs(neighbor)) {
          return true;
        }
      }

      inStack.delete(node);
      return false;
    };

    for (const node of graph.keys()) {
      if (dfs(node)) {
        return true;
      }
    }

    return false;
  }

  public runStrategy(strategy: Strategy): void {
    this.isStopped = false;
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

      // Popola DAG e reverseDAG
      this.dependencyGraph.set(command.id, command.dependencies || []);
      (command.dependencies || []).forEach((dep) => {
        if (!this.reverseDependencyGraph.has(dep)) {
          this.reverseDependencyGraph.set(dep, []);
        }
        this.reverseDependencyGraph.get(dep)?.push(command.id);
      });

      this.updateCommandStatus(command.id, { status: "pending" });
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
    return "";
  }

  private runCommand(command: StratCommand): void {
    try {
      if (this.isStopped) {
        throw new Error("Execution stopped");
      }

      this.commandStat.set(command.id, "in progress");
      this.updateCommandStatus(command.id, { status: "in progress" });

      const commandBody: CommandBody = {
        id: this.getUuidFromId(command.id),
        command: command.command,
        subcommand: command.subcommand,
        parameters: {
          method: command.method,
          path: command.path,
        },
      };

      if (this.sendMessage) this.sendMessage(JSON.stringify(commandBody));

      // nel caso di flood start pianifichiamo anche flood stop
      if (
        command.command === "flood" &&
        command.subcommand === "start" &&
        command.duration
      ) {
        setTimeout(() => {
          commandBody.subcommand = "stop";
          commandBody.parameters.id = this.getUuidFromId(command.id);
          if (this.sendMessage) this.sendMessage(JSON.stringify(commandBody));
        }, command.duration * 1000);
      }
    } catch (error) {
      this.updateCommandStatus(command.id, {
        status: "error",
        errorMsg: error as string,
      });
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

    //manca solo la gestione dei deadlock

    executableCommands.map((cmd) => this.runCommand(cmd));
  }

  private onCommandCompleted(
    commandId: string,
    status: string,
    errorMsg?: string
  ): void {
    this.commandStat.set(commandId, status);
    this.updateCommandStatus(commandId, { status, errorMsg });

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
    this.updateCommandStatus(id, { status: cmd });
  }

  public stopExecution() {
    this.setIsRunning(false);
    this.isStopped = true;
  }
}
