/**
 * Zugriff auf die Makefile im Root des ersten Workspace-Ordners, die Panel und Editor-Buttons gemeinsam nutzen.
 */
import { TextDocument, Uri, workspace } from "vscode";
import { MakeTarget, parseMakefile } from "./makefileParser";

/** Dateiname der Makefile im Workspace-Root. */
const MAKEFILE_NAME = "Makefile";

/** Liefert den Pfad der Makefile im Workspace-Root oder `undefined` ohne geöffneten Ordner. */
export const rootMakefileUri = (): Uri | undefined => {
  const folder = workspace.workspaceFolders?.[0];
  return folder === undefined ? undefined : Uri.joinPath(folder.uri, MAKEFILE_NAME);
};

/** Vergleichsschlüssel eines Dateipfads; unter Windows ohne Groß-/Kleinschreibung. */
const pathKey = (uri: Uri): string =>
  process.platform === "win32" ? uri.fsPath.toLowerCase() : uri.fsPath;

/** Prüft, ob das Dokument die Makefile im Workspace-Root ist. */
export const isRootMakefile = (uri: Uri): boolean => {
  const makefile = rootMakefileUri();
  return makefile !== undefined && uri.scheme === makefile.scheme && pathKey(uri) === pathKey(makefile);
};

/** Prüft, ob im Workspace-Root eine Makefile liegt. */
export const rootMakefileExists = async (): Promise<boolean> => {
  const makefile = rootMakefileUri();
  if (makefile === undefined) {
    return false;
  }
  try {
    await workspace.fs.stat(makefile);
    return true;
  } catch {
    return false;
  }
};

/** Liest die Targets der Makefile im Workspace-Root; ohne geöffneten Ordner ist die Liste leer. */
export const readRootMakefileTargets = async (): Promise<MakeTarget[]> => {
  const makefile = rootMakefileUri();
  if (makefile === undefined) {
    return [];
  }

  let document: TextDocument;
  try {
    document = await workspace.openTextDocument(makefile);
  } catch {
    throw new Error("Makefile cannot be read. Check that your makefile is at the root of your project.");
  }
  return parseMakefile(document.getText());
};
