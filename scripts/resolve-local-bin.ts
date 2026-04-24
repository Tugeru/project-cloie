import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

function getPlatformCandidates(command: string) {
  if (process.platform === "win32") {
    return [`${command}.CMD`, `${command}.cmd`, `${command}.exe`, command];
  }

  return [command];
}

export function resolveLocalBin(command: string) {
  for (const candidate of getPlatformCandidates(command)) {
    const resolved = join(process.cwd(), "node_modules", ".bin", candidate);

    if (existsSync(resolved)) {
      return resolved;
    }
  }

  const pnpmStorePath = join(process.cwd(), "node_modules", ".pnpm");

  if (existsSync(pnpmStorePath)) {
    const packageDirectories = readdirSync(pnpmStorePath).filter((entry) =>
      entry.toLowerCase().startsWith(`${command.toLowerCase()}@`),
    );

    for (const packageDirectory of packageDirectories) {
      for (const candidate of getPlatformCandidates(command)) {
        const resolved = join(
          pnpmStorePath,
          packageDirectory,
          "node_modules",
          command,
          "bin",
          candidate,
        );

        if (existsSync(resolved)) {
          return resolved;
        }
      }
    }
  }

  return command;
}
