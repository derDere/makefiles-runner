/**
 * Zeigt im Editor über jeder Regelzeile der Root-Makefile einen Run-Button für das Target.
 */
import { CodeLens, CodeLensProvider, Range, TextDocument } from "vscode";
import { RUN_MAKE_COMMAND_ID } from "./command";
import { isRootMakefile } from "./makefileDocument";
import { parseMakefile } from "./makefileParser";

/** Liefert die Run-Buttons (CodeLenses) für die Targets der Makefile im Workspace-Root. */
export default class MakefileCodeLensProvider implements CodeLensProvider {
  provideCodeLenses(document: TextDocument): CodeLens[] {
    if (!isRootMakefile(document.uri)) {
      return [];
    }

    return parseMakefile(document.getText()).map(
      (target) =>
        new CodeLens(new Range(target.line, 0, target.line, 0), {
          title: `$(play) Run make ${target.name}`,
          tooltip: target.description || `Run "make ${target.name}"`,
          command: RUN_MAKE_COMMAND_ID,
          arguments: [target.name],
        })
    );
  }
}
