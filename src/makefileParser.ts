/**
 * Liest die Targets einer Makefile nach der Zeilenlogik von GNU make (`read.c`, `eval()`):
 *
 * - Fortsetzungszeilen (`\` am Zeilenende) werden zu einer logischen Zeile verbunden.
 * - Zeilen mit Tab am Anfang sind Rezeptzeilen, `define ... endef`-Blöcke sind Variableninhalt.
 * - Direktiven (`include`, `ifeq`, `export` …) und Variablenzuweisungen definieren keine Targets.
 * - In einer Regelzeile ist alles links vom ersten Doppelpunkt ein Target, unabhängig von den
 *   Abhängigkeiten rechts davon. Eine target-spezifische Variable (`target: VAR = x`) ist keine Regel.
 * - Pattern-Regeln (`%`), Special-Targets und Suffix-Regeln (Name mit `.` am Anfang ohne `/`)
 *   sowie Targets aus Variablen (`$(NAME):`) erscheinen nicht in der Liste.
 *
 * Beschreibungen folgen der `##`-Konvention: `##`-Zeilen direkt über der Regel und ein
 * `## Text` hinter der Regel ergeben zusammen die Beschreibung des Targets.
 */
import { findSeparator, isDefineEnd, isDefineStart, isDirective, isTargetSpecificAssignment, splitComment } from "./makeSyntax";

/** Stellt ein Make-Target (einen Befehl der Makefile) samt Beschreibung und Fundstelle dar. */
export interface MakeTarget {
  readonly name: string;
  readonly description: string;
  /** Nullbasierte Zeilennummer der ersten Regelzeile, die das Target definiert. */
  readonly line: number;
}

/** Eine logische Makefile-Zeile mit der Nummer ihrer ersten physischen Zeile. */
interface LogicalLine {
  readonly text: string;
  readonly firstLine: number;
}

/** Rezept-Präfix von GNU make (Standardwert von `.RECIPEPREFIX`). */
const RECIPE_PREFIX = "\t";

/** Kommentare mit mindestens zwei `#` gelten als Beschreibung. */
const DESCRIPTION_MARKER = /^##/;

/** Prüft, ob eine Zeile mit einer ungeraden Zahl von Backslashes endet und damit fortgesetzt wird. */
const continuesOnNextLine = (line: string): boolean => {
  let backslashes = 0;
  for (let i = line.length - 1; i >= 0 && line[i] === "\\"; i--) {
    backslashes++;
  }
  return backslashes % 2 === 1;
};

/** Zerlegt den Dateiinhalt in logische Zeilen; Fortsetzungen werden durch ein Leerzeichen verbunden. */
const toLogicalLines = (content: string): LogicalLine[] => {
  const physical = content.replace(/^﻿/, "").split(/\r?\n/);
  const logical: LogicalLine[] = [];

  for (let i = 0; i < physical.length; i++) {
    const firstLine = i;
    let text = physical[i];
    while (continuesOnNextLine(text) && i + 1 < physical.length) {
      i++;
      text = `${text.slice(0, -1).replace(/\s+$/, "")} ${physical[i].replace(/^\s+/, "")}`;
    }
    logical.push({ text, firstLine });
  }
  return logical;
};

/** Liefert den Beschreibungstext eines `##`-Kommentars oder `undefined` für andere Kommentare. */
const descriptionOf = (comment: string | undefined): string | undefined =>
  comment !== undefined && DESCRIPTION_MARKER.test(comment) ? comment.replace(/^#+/, "").trim() : undefined;

/** Prüft, ob ein Target-Name als ausführbarer Befehl in die Liste gehört. */
const isListableTarget = (name: string): boolean =>
  name !== "" &&
  !name.includes("%") &&
  !name.includes("$") &&
  !(name.startsWith(".") && !name.includes("/"));

/** Zerlegt den Teil links vom Regel-Doppelpunkt in Target-Namen; `&` markiert gruppierte Targets. */
const extractTargetNames = (targetsPart: string): string[] =>
  targetsPart.trim().replace(/\s*&$/, "").split(/\s+/).filter(isListableTarget);

/** Sammelt Targets in Reihenfolge ihres ersten Auftretens und führt mehrfache Regeln zusammen. */
class TargetCollector {
  private readonly entries = new Map<string, { line: number; descriptions: string[] }>();

  /** Nimmt ein Target auf; bei wiederholtem Namen ergänzt es nur die Beschreibung. */
  add(name: string, description: string, line: number): void {
    const entry = this.entries.get(name);
    if (entry === undefined) {
      this.entries.set(name, { line, descriptions: description === "" ? [] : [description] });
    } else if (description !== "" && !entry.descriptions.includes(description)) {
      entry.descriptions.push(description);
    }
  }

  /** Alle gesammelten Targets in Dateireihenfolge. */
  get targets(): MakeTarget[] {
    return Array.from(this.entries, ([name, entry]) => ({
      name,
      description: entry.descriptions.join(" "),
      line: entry.line,
    }));
  }
}

/** Liest alle ausführbaren Targets samt Beschreibung aus dem Inhalt einer Makefile. */
export const parseMakefile = (content: string): MakeTarget[] => {
  const collector = new TargetCollector();
  let descriptionAbove: string[] = [];
  let defineDepth = 0;

  for (const { text, firstLine } of toLogicalLines(content)) {
    const trimmed = text.trim();

    if (defineDepth > 0) {
      // Wie make prüft der define-Block nur Zeilen ohne Rezept-Präfix auf define/endef.
      if (!text.startsWith(RECIPE_PREFIX)) {
        if (isDefineStart(trimmed)) {
          defineDepth++;
        } else if (isDefineEnd(trimmed)) {
          defineDepth--;
        }
      }
      continue;
    }

    if (text.startsWith(RECIPE_PREFIX) || trimmed === "") {
      descriptionAbove = [];
      continue;
    }

    if (trimmed.startsWith("#")) {
      const description = descriptionOf(trimmed);
      descriptionAbove = description === undefined ? [] : [...descriptionAbove, description];
      continue;
    }

    const linesAbove = descriptionAbove;
    descriptionAbove = [];

    if (isDefineStart(trimmed)) {
      defineDepth = 1;
      continue;
    }
    if (isDirective(trimmed)) {
      continue;
    }

    const { code, comment } = splitComment(trimmed);
    const separator = findSeparator(code);
    if (separator.kind !== "rule") {
      continue;
    }

    // Ein zweiter Doppelpunkt direkt dahinter kennzeichnet eine Double-Colon-Regel.
    const afterColon = code.slice(separator.index + 1).replace(/^:/, "");
    if (isTargetSpecificAssignment(afterColon)) {
      continue;
    }

    const description = [...linesAbove, descriptionOf(comment)]
      .filter((part): part is string => part !== undefined && part !== "")
      .join(" ");

    for (const name of extractTargetNames(code.slice(0, separator.index))) {
      collector.add(name, description, firstLine);
    }
  }

  return collector.targets;
};
