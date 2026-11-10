import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const cwd = fileURLToPath(new URL("../backend/", import.meta.url));
const action = process.argv[2] || "test";
const goals = { test: "test", package: "package", run: "spring-boot:run" };
if (!goals[action]) throw new Error("Choose test, package, or run.");
const loaded = loadEnv("development", root, "");
const env = { ...loaded, ...process.env };
if (action === "run") {
  env.COOKIE_SECURE ||= "false";
  env.DATABASE_SCHEMA ||= "growcer_java_local";
}
if (process.argv.includes("--postgres")) {
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required for isolated PostgreSQL tests.");
  env.GROWCER_POSTGRES_TEST_URL = env.DATABASE_URL;
}
const args = ["-B", "-ntp"];
if (env.GROWCER_MAVEN_REPO) args.push("-Dmaven.repo.local=" + env.GROWCER_MAVEN_REPO);
args.push(goals[action]);
const windows = process.platform === "win32";
const child = spawn(windows ? "mvnw.cmd" : "sh", windows ? args : ["./mvnw", ...args], { cwd, env, stdio: "inherit", shell: windows });
child.on("error", () => { console.error("Could not run the Maven Wrapper. Check Java 21 is installed."); process.exitCode = 1; });
child.on("exit", code => { process.exitCode = code ?? 1; });
