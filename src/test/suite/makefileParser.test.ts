import * as assert from "assert";
import { MakeTarget, parseMakefile } from "../../makefileParser";

/** Baut den Makefile-Inhalt aus einzelnen Zeilen. */
const makefile = (...lines: string[]): string => lines.join("\n");

/** Liefert nur die Target-Namen in Dateireihenfolge. */
const namesOf = (content: string): string[] => parseMakefile(content).map((target) => target.name);

suite("Makefile parser: targets", () => {
  test("finds a target without prerequisites", () => {
    assert.deepStrictEqual(parseMakefile("build:"), [{ name: "build", description: "", line: 0 }]);
  });

  test("finds targets with prerequisites", () => {
    const content = makefile("install:", "build: install", "start: build test", "test: build | .temp");
    assert.deepStrictEqual(namesOf(content), ["install", "build", "start", "test"]);
  });

  test("finds every target of a multi-target, double-colon and grouped rule", () => {
    const content = makefile("lint format: deps", "deploy:: build", "docs api &: spec");
    assert.deepStrictEqual(namesOf(content), ["lint", "format", "deploy", "docs", "api"]);
  });

  test("reports the zero-based line of the rule", () => {
    const content = makefile("# header", "", "VAR := 1", "", "build: install", "\tdotnet build");
    assert.deepStrictEqual(parseMakefile(content), [{ name: "build", description: "", line: 4 }]);
  });

  test("ignores variable assignments of every flavor", () => {
    const content = makefile(
      "A = 1",
      "B := 2",
      "C ::= 3",
      "D :::= 4",
      "E ?= 5",
      "F += 6",
      "G != echo 7",
      "export H := 8",
      "override I = 9"
    );
    assert.deepStrictEqual(namesOf(content), []);
  });

  test("ignores target-specific variable assignments", () => {
    const content = makefile("build: CFLAGS = -O2", "test: export MODE := ci", "build:");
    assert.deepStrictEqual(namesOf(content), ["build"]);
  });

  test("ignores special, suffix, pattern and variable targets", () => {
    const content = makefile(
      ".PHONY: build",
      ".DEFAULT_GOAL := build",
      ".c.o:",
      "%.o: %.c",
      "$(OUT): build",
      "./scripts/run.sh: build",
      "build:"
    );
    assert.deepStrictEqual(namesOf(content), ["./scripts/run.sh", "build"]);
  });

  test("ignores recipe lines, directives and define blocks", () => {
    const content = makefile(
      "build:",
      "\techo not: a-target",
      "ifeq ($(OS),C:/Windows)",
      "vpath %.c src:lib",
      "endif",
      "define TEMPLATE",
      "inner: target",
      "endef",
      "clean:"
    );
    assert.deepStrictEqual(namesOf(content), ["build", "clean"]);
  });

  test("joins continuation lines and keeps the line of the first part", () => {
    const content = makefile("VAR := 1", "build: install \\", "\tcompile ## Builds everything");
    assert.deepStrictEqual(parseMakefile(content), [{ name: "build", description: "Builds everything", line: 1 }]);
  });

  test("merges repeated rules of the same target", () => {
    const content = makefile("build: install", "", "## Builds the app", "build:", "\tdotnet build");
    assert.deepStrictEqual(parseMakefile(content), [{ name: "build", description: "Builds the app", line: 0 }]);
  });

  test("handles CRLF line endings and a UTF-8 byte order mark", () => {
    const content = "\uFEFF## Installs\r\ninstall:\r\n\tuv sync\r\n";
    assert.deepStrictEqual(parseMakefile(content), [{ name: "install", description: "Installs", line: 1 }]);
  });
});

suite("Makefile parser: descriptions", () => {
  const descriptionOf = (content: string, name: string): string | undefined =>
    parseMakefile(content).find((target: MakeTarget) => target.name === name)?.description;

  test("reads a ## comment behind the target", () => {
    assert.strictEqual(descriptionOf("deploy: build ## Deploys the project", "deploy"), "Deploys the project");
  });

  test("reads a ## comment above the target", () => {
    assert.strictEqual(descriptionOf(makefile("## Builds the app", "build: install"), "build"), "Builds the app");
  });

  test("joins several ## lines above the target", () => {
    const content = makefile("## Runs all tests", "## without live sessions.", "test: build");
    assert.strictEqual(descriptionOf(content, "test"), "Runs all tests without live sessions.");
  });

  test("combines the comment above with the comment behind", () => {
    const content = makefile("## Starts the app.", "start: build ## Needs a build.");
    assert.strictEqual(descriptionOf(content, "start"), "Starts the app. Needs a build.");
  });

  test("ignores single-hash comments above and behind", () => {
    const content = makefile("# --- Build ---", "build: install # internal note");
    assert.strictEqual(descriptionOf(content, "build"), "");
  });

  test("takes only the ## block directly above the target", () => {
    const content = makefile("## Belongs to nothing", "", "## Cleans up", "# section", "clean:");
    assert.strictEqual(descriptionOf(content, "clean"), "");
  });

  test("does not carry a description past a variable assignment", () => {
    const content = makefile("## Server folder", "SERVER := server", "install:");
    assert.strictEqual(descriptionOf(content, "install"), "");
  });

  test("treats a ## after an inline recipe as part of the recipe", () => {
    assert.strictEqual(descriptionOf("clean: ; rm -rf out ## shell text", "clean"), "");
  });

  test("ignores an escaped hash in the prerequisites", () => {
    assert.strictEqual(descriptionOf("build: a\\#b ## Builds", "build"), "Builds");
  });

  test("applies the description to every target of the rule", () => {
    const content = makefile("## Checks the code", "lint format:");
    assert.deepStrictEqual(
      parseMakefile(content).map((target) => target.description),
      ["Checks the code", "Checks the code"]
    );
  });
});
