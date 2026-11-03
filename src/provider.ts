import { Disposable, Event, EventEmitter, ThemeIcon, TreeDataProvider, TreeItem, TreeItemCollapsibleState, workspace } from "vscode";
import { RUN_MAKE_COMMAND_ID } from "./command";
import { ConfigService } from './configService';
import { readRootMakefileTargets, rootMakefileExists } from "./makefileDocument";
import { TargetIconResolver } from "./targetIcons";

export default class TaskTreeDataProvider implements TreeDataProvider<TreeItem>, Disposable {
  private _onDidChangeTreeData: EventEmitter<TreeItem | undefined> = new EventEmitter<TreeItem | undefined>();
  readonly onDidChangeTreeData: Event<TreeItem | undefined> = this._onDidChangeTreeData.event;

  private configChangeDisposable: Disposable;

  private config = ConfigService.getInstance();

  constructor() {
    // Listen for configuration changes and refresh the tree when they occur
    this.configChangeDisposable = workspace.onDidChangeConfiguration((e) => {
        this.refresh();
    });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(item: TreeItem): TreeItem {
    return item;
  }

  async getChildren(): Promise<TreeItem[]> {
    let targets = await readRootMakefileTargets();

    if (this.config.sortAlphabetically) {
      targets = [...targets].sort((a, b) => a.name.localeCompare(b.name));
    }

    const iconResolver = new TargetIconResolver(this.config.icons);
    return targets.map(
      (target) =>
        new MakefileCommand(
          target.name,
          target.description,
          this.config.displayDescriptionCommentsInPanel,
          iconResolver.resolve(target.name)
        )
    );
  }

  async makefileExists(): Promise<boolean> {
    return rootMakefileExists();
  }

  dispose(): void {
    // Clean up the configuration change listener
    this.configChangeDisposable.dispose();
  }
}

/** Stellt einen Make-Befehl (Target) als Eintrag im Panel dar. */
class MakefileCommand extends TreeItem {
  constructor(commandName: string, description: string, showDescription: boolean, iconId: string) {
    super(commandName, TreeItemCollapsibleState.None);

    this.description = showDescription ? description : ""; // Show comment as the description in the VSCode tree.
    this.tooltip = description || `Run "${commandName}"`; // Tooltip provides additional details.
    this.iconPath = new ThemeIcon(iconId);

    this.command = {
      command: RUN_MAKE_COMMAND_ID,
      title: "Run Makefile Command",
      arguments: [commandName] // Pass only the command name to the execute command.
    };
  }
}
