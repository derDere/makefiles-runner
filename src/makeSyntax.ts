/**
 * Lexikalische Hilfen für Makefile-Zeilen nach dem Vorbild von GNU make (`read.c`).
 *
 * Alle Suchfunktionen überspringen Variablenreferenzen (`$(...)`, `${...}`, `$x`)
 * und mit Backslash maskierte Zeichen, so wie make es beim Zerlegen einer Zeile tut.
 */

/** Eine Zeile, aufgeteilt in Make-Code und den Kommentar dahinter. */
export interface SplitLine {
  /** Make-Code bis zum ersten unmaskierten `#` bzw. `;`. */
  readonly code: string;
  /** Kommentar ab dem `#`; fehlt, wenn die Zeile keinen hat oder ein Inline-Rezept (`;`) folgt. */
  readonly comment: string | undefined;
}

/** Art des ersten Trennzeichens einer Zeile: Regel-Doppelpunkt oder Variablenzuweisung. */
export type Separator =
  | { readonly kind: "rule"; readonly index: number }
  | { readonly kind: "assignment" }
  | { readonly kind: "none" };

/** Schlüsselwörter, mit denen GNU make Direktiven statt Regeln erkennt. */
const DIRECTIVE_PATTERN =
  /^(?:-?include|sinclude|-?load|ifeq|ifneq|ifdef|ifndef|else|endif|export|unexport|override|private|vpath|undefine|define|endef)(?:\s|$)/;

/** Beginn eines `define`-Blocks, auch mit vorangestellten Modifikatoren. */
const DEFINE_START_PATTERN = /^(?:(?:override|export|unexport|private)\s+)*define(?:\s|$)/;

/** Ende eines `define`-Blocks. */
const DEFINE_END_PATTERN = /^endef(?:\s|$)/;

/** Modifikatoren, die einer target-spezifischen Variablenzuweisung vorangehen dürfen. */
const ASSIGNMENT_MODIFIER_PATTERN = /^(?:(?:export|override|private)\s+)+/;

/**
 * Liefert den Index direkt hinter einer Variablenreferenz, die bei `start` mit `$` beginnt.
 * Verschachtelte Klammern desselben Typs werden mitgezählt.
 */
const skipVariableReference = (text: string, start: number): number => {
  const opener = text[start + 1];
  if (opener !== "(" && opener !== "{") {
    // `$x` oder `$$`: genau ein Zeichen nach dem Dollarzeichen.
    return start + 2;
  }

  const closer = opener === "(" ? ")" : "}";
  let depth = 0;
  for (let i = start + 1; i < text.length; i++) {
    if (text[i] === opener) {
      depth++;
    } else if (text[i] === closer && --depth === 0) {
      return i + 1;
    }
  }
  return text.length;
};

/**
 * Durchläuft die Zeile und ruft `visit` für jedes Zeichen außerhalb von
 * Variablenreferenzen und Maskierungen auf. Liefert `visit` `true`, endet der Lauf.
 */
const scanUnquoted = (text: string, visit: (index: number) => boolean): void => {
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    if (char === "\\") {
      i += 2;
    } else if (char === "$") {
      i = skipVariableReference(text, i);
    } else if (visit(i)) {
      return;
    } else {
      i++;
    }
  }
};

/**
 * Trennt eine Zeile in Code und Kommentar. Ein `;` beendet den Regelteil, der Rest ist
 * ein Inline-Rezept für die Shell und enthält damit auch keinen Make-Kommentar.
 */
export const splitComment = (text: string): SplitLine => {
  let result: SplitLine = { code: text, comment: undefined };
  scanUnquoted(text, (index) => {
    const char = text[index];
    if (char === "#") {
      result = { code: text.slice(0, index), comment: text.slice(index) };
      return true;
    }
    if (char === ";") {
      result = { code: text.slice(0, index), comment: undefined };
      return true;
    }
    return false;
  });
  return result;
};

/**
 * Bestimmt das erste Trennzeichen einer Zeile. Ein `=` bzw. die Operatoren `:=`, `::=`,
 * `:::=`, `+=`, `?=` und `!=` kennzeichnen eine Variablenzuweisung, ein einzelner
 * Doppelpunkt eine Regel.
 */
export const findSeparator = (code: string): Separator => {
  let result: Separator = { kind: "none" };
  scanUnquoted(code, (index) => {
    const char = code[index];
    const next = code[index + 1];
    if (char === "=") {
      result = { kind: "assignment" };
      return true;
    }
    if (char === ":") {
      const isAssignment =
        next === "=" || code.startsWith("::=", index) || code.startsWith(":::=", index);
      result = isAssignment ? { kind: "assignment" } : { kind: "rule", index };
      return true;
    }
    if ((char === "+" || char === "?" || char === "!") && next === "=") {
      result = { kind: "assignment" };
      return true;
    }
    return false;
  });
  return result;
};

/** Prüft, ob der Regelteil hinter dem Doppelpunkt eine target-spezifische Variable setzt. */
export const isTargetSpecificAssignment = (afterColon: string): boolean =>
  findSeparator(afterColon.trim().replace(ASSIGNMENT_MODIFIER_PATTERN, "")).kind === "assignment";

/** Prüft, ob eine (bereits getrimmte) Zeile eine Make-Direktive ist. */
export const isDirective = (trimmed: string): boolean => DIRECTIVE_PATTERN.test(trimmed);

/** Prüft, ob eine (bereits getrimmte) Zeile einen `define`-Block öffnet. */
export const isDefineStart = (trimmed: string): boolean => DEFINE_START_PATTERN.test(trimmed);

/** Prüft, ob eine (bereits getrimmte) Zeile einen `define`-Block schließt. */
export const isDefineEnd = (trimmed: string): boolean => DEFINE_END_PATTERN.test(trimmed);
