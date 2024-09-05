import { Command, CommandStatus } from "../models/Strategy";
import { CommandBody } from "../models/CommandBody";
import { commandRequest } from "./api";

export default class StrategiesEngine {
  private commands: Command[];
  private commandStatus: Map<string, CommandStatus>;
  private host: string;

  constructor(commands: Command[], host: string) {
    this.commands = commands;
    this.commandStatus = new Map();
    this.host = host;

    this.commands.forEach((command) => {
      this.commandStatus.set(command.id, {
        id: command.id,
        status: "pending",
      });
    });
  }

  private canExecute(command: Command): boolean {
    // explicit dependencies
    const explicitDepsSatisfied = (command.dependencies || []).every(
      (depId) => this.commandStatus.get(depId)?.status === "completed"
    );

    // implicit dependencies
    // const implicitDepsSatisfied = this.commands
    //   .filter((cmd) => cmd.path === command.path && cmd.id !== command.id)
    //   .every(
    //     (cmd) =>
    //       this.commandStatus.get(cmd.id)?.status === "completed" ||
    //       cmd.id === command.id
    //   );

    return explicitDepsSatisfied; // && implicitDepsSatisfied;
  }

  private async executeCommand(command: Command): Promise<void> {
    try {
      this.commandStatus.set(command.id, {
        id: command.id,
        status: "in-progress",
      });

      const commandBody: CommandBody = {
        command: command.command,
        subcommand: command.subcommand,
        parameters: {
          method: command.method,
          path: command.path,
        },
      };

      const id = await commandRequest(this.host, commandBody, 10);
      // MANCA LA PARTE PER GESTIRE LO STATO DELLE RICHIESTE, POLLING O WEBSOCKET
      console.log(
        `eseguito comando ${command.command} ${command.subcommand} ${command.path}`
      );

      // QUESTO VA SETTATO SOLO DOPO LA RICHIESTA A GETBUFFER
      this.commandStatus.set(command.id, {
        id: command.id,
        status: "completed",
      });
    } catch (error) {
      // QUESTO VA SETTATO ANCHE DOPO LA RICHIESTA A GETBUFFER
      this.commandStatus.set(command.id, {
        id: command.id,
        status: "failed",
      });
      console.error(`Failed to execute command ${command.id}:`, error);
    }
  }

  public async run(): Promise<void> {
    while (this.commandStatus.size > 0) {
      const pendingCommands = this.commands.filter(
        (cmd) => this.commandStatus.get(cmd.id)?.status === "pending"
      );

      if (pendingCommands.length === 0) {
        break; // Tutti i comandi sono stati eseguiti
      }

      // Esegui i comandi che possono essere eseguiti
      const executableCommands = pendingCommands.filter(
        this.canExecute.bind(this)
      );
      if (executableCommands.length === 0) {
        throw new Error(
          "Deadlock detected: No commands can be executed due to unmet dependencies."
        );
      }

      await Promise.all(
        executableCommands.map((cmd) => this.executeCommand(cmd))
      );
    }
  }
}
