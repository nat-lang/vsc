import { OutputChannel, Uri, window, workspace, WorkspaceFolder } from "vscode";
import { Logger } from "vscode-languageclient";
import * as fs from 'fs';
import * as os from 'os';
import path = require("path");

enum LogLevel {
  Off,
  Error,
  Warn,
  Info,
  Debug,
}

export function expandHomeDir(path: string): string {
  if (path.startsWith('~')) {
    return path.replace('~', os.homedir);
  }
  return path;
}

export class ExtensionLogger implements Logger {
  public readonly name: string;
  public readonly level: LogLevel;
  public readonly channel: OutputChannel;
  public readonly logFile: string | undefined;

  constructor(name: string, level: string, channel: OutputChannel, logFile: string | undefined) {
      this.name = name;
      this.level = this.getLogLevel(level);
      this.channel = channel;
      this.logFile = logFile;
  }
  public warn(message: string): void {
      this.logLevel(LogLevel.Warn, message);
  }

  public info(message: string): void {
      this.logLevel(LogLevel.Info, message);
  }

  public error(message: string) {
      this.logLevel(LogLevel.Error, message);
  }

  public log(message: string) {
      this.logLevel(LogLevel.Debug, message);
  }

  private write(msg: string) {
      let now = new Date();
      // Ugly hack to make js date iso format similar to hls one
      const offset = now.getTimezoneOffset();
      now = new Date(now.getTime() - offset * 60 * 1000);
      const timedMsg = `${new Date().toISOString().replace('T', ' ').replace('Z', '0000')} ${msg}`;
      this.channel.appendLine(timedMsg);
      if (this.logFile) {
      fs.appendFileSync(this.logFile, timedMsg + '\n');
      }
  }

  private logLevel(level: LogLevel, msg: string) {
      if (level <= this.level) {
      this.write(`[${this.name}] ${LogLevel[level].toUpperCase()} ${msg}`);
      }
  }

  private getLogLevel(level: string) {
      switch (level) {
      case 'off':
          return LogLevel.Off;
      case 'error':
          return LogLevel.Error;
      case 'debug':
          return LogLevel.Debug;
      default:
          return LogLevel.Info;
      }
  }
}

export function mkLogger(cwd: string, uri: Uri, lang: string) {
  const clientLogLevel = workspace.getConfiguration(lang, uri).trace.client;
  const logFile: string = workspace.getConfiguration(lang, uri).logFile;
  const logFilePath = logFile !== '' ? path.resolve(cwd, expandHomeDir(logFile)) : undefined;
  const outputChannel: OutputChannel = window.createOutputChannel(lang);

  return new ExtensionLogger('client', clientLogLevel, outputChannel, logFilePath);
}