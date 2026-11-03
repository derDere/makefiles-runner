import * as assert from "assert";
import { FALLBACK_TARGET_ICON, TargetIconResolver } from "../../targetIcons";

/** Baut einen Einstellungswert wie aus der settings.json; die Schlüssel sind Target-Namen. */
const iconSetting = (...entries: [string, unknown][]): Record<string, unknown> => {
  const setting: Record<string, unknown> = {};
  entries.forEach(([key, icon]) => (setting[key] = icon));
  return setting;
};

suite("Target icons", () => {
  const defaults = new TargetIconResolver();

  test("maps known target names to their default icon", () => {
    assert.strictEqual(defaults.resolve("build"), "tools");
    assert.strictEqual(defaults.resolve("start"), "play");
    assert.strictEqual(defaults.resolve("install"), "cloud-download");
    assert.strictEqual(defaults.resolve("debug"), "debug-alt");
  });

  test("matches a key followed by a dash or underscore", () => {
    assert.strictEqual(defaults.resolve("test-live"), "beaker");
    assert.strictEqual(defaults.resolve("test_system"), "beaker");
  });

  test("does not match a key that is only the beginning of a word", () => {
    assert.strictEqual(defaults.resolve("update"), FALLBACK_TARGET_ICON);
    assert.strictEqual(defaults.resolve("download"), FALLBACK_TARGET_ICON);
  });

  test("ignores letter case", () => {
    assert.strictEqual(defaults.resolve("Build"), "tools");
  });

  test("uses the fallback icon for unknown targets", () => {
    assert.strictEqual(defaults.resolve("record-fixture"), FALLBACK_TARGET_ICON);
  });

  test("lets the setting add and override entries", () => {
    const resolver = new TargetIconResolver(iconSetting(["record-fixture", "record"], ["build", "package"]));
    assert.strictEqual(resolver.resolve("record-fixture"), "record");
    assert.strictEqual(resolver.resolve("build"), "package");
    assert.strictEqual(resolver.resolve("test"), "beaker");
  });

  test("prefers the longest matching key", () => {
    const resolver = new TargetIconResolver(iconSetting(["test-live", "pulse"]));
    assert.strictEqual(resolver.resolve("test-live-haiku"), "pulse");
    assert.strictEqual(resolver.resolve("test-unit"), "beaker");
  });

  test("skips entries without a usable icon id", () => {
    const resolver = new TargetIconResolver(iconSetting(["build", 42], ["clean", ""], ["", "rocket"]));
    assert.strictEqual(resolver.resolve("build"), "tools");
    assert.strictEqual(resolver.resolve("clean"), "trash");
  });
});
