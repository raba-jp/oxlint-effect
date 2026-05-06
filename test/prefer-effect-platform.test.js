import { describe, expect, it } from "bun:test";
import preferEffectPlatform from "../src/rules/prefer-effect-platform.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(preferEffectPlatform, source);

describe("prefer-effect-platform", () => {
  it("import 'node:fs' は違反", () => {
    const reports = run(`
      import fs from "node:fs";
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("preferPlatformFileSystem");
  });

  it("import 'node:path' は違反", () => {
    const reports = run(`
      import path from "node:path";
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("preferPlatformPath");
  });

  it("import 'node:http' は違反", () => {
    const reports = run(`
      import http from "node:http";
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("preferPlatformHttp");
  });

  it("import 'node:child_process' は違反", () => {
    const reports = run(`
      import { spawn } from "node:child_process";
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("preferPlatformCommand");
  });

  it("グローバル fetch() は違反", () => {
    const reports = run(`
      const res = fetch("https://example.com");
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("preferPlatformHttp");
  });

  it("Bun.file は違反", () => {
    const reports = run(`
      const f = Bun.file("a.txt");
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("preferPlatformFileSystem");
  });

  it("Bun.spawn は Command 違反", () => {
    const reports = run(`
      const proc = Bun.spawn(["ls"]);
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("preferPlatformCommand");
  });

  it("Deno.readTextFile は違反", () => {
    const reports = run(`
      const t = Deno.readTextFile("a.txt");
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("preferPlatformFileSystem");
  });

  it("new Deno.Command は違反", () => {
    const reports = run(`
      const cmd = new Deno.Command("ls");
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("preferPlatformCommand");
  });

  it("console.log は Terminal 違反", () => {
    const reports = run(`
      console.log("hi");
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("preferPlatformTerminal");
  });

  it("process.stdout は Terminal 違反", () => {
    const reports = run(`
      process.stdout.write("hi");
    `);
    expect(reports.some((r) => r.messageId === "preferPlatformTerminal")).toBe(true);
  });

  it("process.env は Process 違反", () => {
    const reports = run(`
      const home = process.env.HOME;
    `);
    expect(reports.some((r) => r.messageId === "preferPlatformProcess")).toBe(true);
  });

  it("@effect/platform からのインポートは違反なし", () => {
    const reports = run(`
      import { FileSystem } from "@effect/platform";
    `);
    expect(reports).toHaveLength(0);
  });
});
