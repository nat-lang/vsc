import path = require('path');
import {
  workspace,
  ExtensionContext,
  TextDocument,
  window,
  commands,
  OutputChannel
} from 'vscode';
import {
  ExecutableOptions,
  LanguageClient,
  LanguageClientOptions,
  RevealOutputChannelOn,
  ServerOptions,
  TransportKind,
  WorkspaceFolder
} from 'vscode-languageclient/node';
import { mkLogger } from './logger';

const lang = 'nat';
const serverExecutable = "nls";
const clients: Map<string, LanguageClient | null> = new Map();

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
  workspace.onDidOpenTextDocument(async (document: TextDocument) => await activeServer(context, document));
  workspace.textDocuments.forEach(async (document: TextDocument) => await activeServer(context, document));


	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vsc-nat" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = commands.registerCommand('vsc-nat.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		window.showInformationMessage('Hello World from foo bar!');
	});

	context.subscriptions.push(disposable);
}

async function activeServer(context: ExtensionContext, document: TextDocument) {
  const uri = document.uri;
  const folder = workspace.getWorkspaceFolder(uri);
  const clientKey = folder ? folder.uri.toString() : uri.toString();
  const cwd = folder ? folder.uri.fsPath : path.dirname(uri.fsPath);
  const logger = mkLogger(cwd, uri, lang);
  const serverEnvironment: {[key:string]: string} = await workspace.getConfiguration(lang, uri).serverEnvironment;
  const outputChannel: OutputChannel = window.createOutputChannel(lang);

  const exeOptions: ExecutableOptions = {
    cwd: folder ? undefined : path.dirname(uri.fsPath),
    env: { ...process.env, ...serverEnvironment },
  };

  const serverOptions: ServerOptions = {
    run: { command: serverExecutable, transport: TransportKind.stdio, args: undefined, options: exeOptions },
    debug: { command: serverExecutable, transport: TransportKind.stdio, args: undefined, options: exeOptions },
  };

  const pat = folder ? `${folder.uri.fsPath}/**/*` : '**/*';

  const clientOptions: LanguageClientOptions = {
    // Use the document selector to only notify the LSP on files inside the folder
    // path for the specific workspace.
    documentSelector: [
      { scheme: 'file', language: lang, pattern: pat },
    ],
    synchronize: {
      // Synchronize the setting section 'nat' to the server.
      configurationSection: lang,
    },
    diagnosticCollectionName: lang,
    revealOutputChannelOn: RevealOutputChannelOn.Never,
    outputChannel,
    outputChannelName: lang,
    // Launch the server in the directory of the workspace folder.
    workspaceFolder: folder,
  };

  // Create the LSP client.
  const langClient = new LanguageClient(lang, lang, serverOptions, clientOptions);

  // Register ClientCapabilities for stuff like window/progress
  langClient.registerProposedFeatures();

  // Finally start the client and add it to the list of clients.
  logger.info('Starting language server');
  window.showInformationMessage('Starting nls server.');

  langClient.start();
  clients.set(clientKey, langClient);
}

// This method is called when your extension is deactivated
export function deactivate() {}
