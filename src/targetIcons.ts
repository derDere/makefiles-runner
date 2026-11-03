/**
 * Ordnet Make-Targets ein Codicon zu (https://code.visualstudio.com/api/references/icons-in-labels#icon-listing).
 *
 * Ein Schlüssel passt auf ein Target mit genau diesem Namen oder auf ein Target, das mit dem
 * Schlüssel und `-` bzw. `_` beginnt (`test` passt auf `test-live`). Ein exakter Treffer geht
 * vor, sonst entscheidet der längste passende Schlüssel. Groß- und Kleinschreibung zählt nicht.
 */

/** Standard-Zuordnung von Begriffen in Target-Namen zu Codicon-IDs. */
export const DEFAULT_TARGET_ICONS: Readonly<Record<string, string>> = {
  start: "play",
  run: "play",
  up: "play",
  serve: "play",
  dev: "play",
  stop: "debug-stop",
  down: "debug-stop",
  debug: "debug-alt",
  install: "cloud-download",
  restore: "cloud-download",
  deps: "cloud-download",
  pull: "cloud-download",
  build: "tools",
  compile: "tools",
  test: "beaker",
  clean: "trash",
  clear: "trash",
  lint: "checklist",
  format: "checklist",
  deploy: "rocket",
  release: "rocket",
  publish: "rocket",
  logs: "output",
  seed: "database",
  init: "database",
};

/** Codicon für Targets, auf die kein Schlüssel passt; hält die Liste bündig. */
export const FALLBACK_TARGET_ICON = "terminal";

/** Trennzeichen, nach denen ein Schlüssel als Präfix eines Target-Namens gilt. */
const PREFIX_SEPARATORS = ["-", "_"];

/** Ermittelt das Icon eines Make-Targets aus Standard-Zuordnung und Benutzer-Einstellung. */
export class TargetIconResolver {
  private readonly icons: ReadonlyMap<string, string>;

  /** @param overrides Zuordnungen aus der Einstellung; sie ergänzen bzw. überschreiben die Standard-Zuordnung. */
  constructor(overrides: Readonly<Record<string, unknown>> = {}) {
    const icons = new Map<string, string>();
    TargetIconResolver.addValidEntries(icons, DEFAULT_TARGET_ICONS);
    TargetIconResolver.addValidEntries(icons, overrides);
    this.icons = icons;
  }

  /** Übernimmt alle Einträge mit nicht leerem Schlüssel und Codicon-ID; ungültige bleiben außen vor. */
  private static addValidEntries(icons: Map<string, string>, entries: Readonly<Record<string, unknown>>): void {
    for (const key of Object.keys(entries)) {
      const icon = entries[key];
      if (typeof icon === "string" && icon.trim() !== "" && key.trim() !== "") {
        icons.set(key.trim().toLowerCase(), icon.trim());
      }
    }
  }

  /** Liefert die Codicon-ID für den Target-Namen. */
  resolve(targetName: string): string {
    const name = targetName.toLowerCase();
    const exact = this.icons.get(name);
    if (exact !== undefined) {
      return exact;
    }

    let bestKey = "";
    let bestIcon = FALLBACK_TARGET_ICON;
    this.icons.forEach((icon, key) => {
      const isPrefix = PREFIX_SEPARATORS.some((separator) => name.startsWith(key + separator));
      if (isPrefix && key.length > bestKey.length) {
        bestKey = key;
        bestIcon = icon;
      }
    });
    return bestIcon;
  }
}
