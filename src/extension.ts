import { commands, ExtensionContext, languages, StatusBarAlignment, StatusBarItem, window } from "vscode";
import MakefileCodeLensProvider from "./codeLensProvider";
import { RUN_MAKE_COMMAND_ID, runMakeCommand } from "./command";
import TaskTreeDataProvider from "./provider";

let statusBarItem: StatusBarItem | undefined;
const provider = new TaskTreeDataProvider();

export const activate = async (context: ExtensionContext) => {
  context.subscriptions.push(
    commands.registerCommand(RUN_MAKE_COMMAND_ID, runMakeCommand()),
    window.registerTreeDataProvider("makefiles-runner", provider),
    languages.registerCodeLensProvider({ scheme: "file", language: "makefile" }, new MakefileCodeLensProvider())
  );

  if (await provider.makefileExists()) {// Create a status bar item (custom title bar)
    statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 0);
    statusBarItem.text = "$(sync) Re-read Makefile";
    statusBarItem.command = "extension.refreshPanel";
    statusBarItem.show();

    context.subscriptions.push(
      commands.registerCommand("extension.refreshPanel", refreshPanel),
    );
    context.subscriptions.push(statusBarItem);
  }
};

export const refreshPanel = () => {
  provider.refresh();
};

export const deactivate = () => {
  if (statusBarItem) {
    statusBarItem.dispose();
  }
};