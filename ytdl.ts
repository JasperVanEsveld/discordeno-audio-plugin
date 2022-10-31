import { default as npmYtdl } from "npm:ytdl-core";

/**
 * Youtube uses signature functions that need to be run to validate
 * As deno does not support a VM or sandbox to run these there is an inherit risk
 * However, it should be relativly safe as the code originates from Google, unless they get compromised.
 */
import { Script } from "https://deno.land/std@0.161.0/node/vm.ts";

console.warn(
  "WARNING\nYTDL needs to run external code from Google to decipher Youtube videos\nDeno does not support a sandbox/VM so this code has the same abilities as the host!\nIssue that could enable sandboxing:\nhttps://github.com/denoland/deno/issues/13239"
);

/**
 * Fill missing VM function used by ytdl
 */
Script.prototype.runInNewContext = function (context: Record<string, any>) {
  const keys = Object.keys(context);
  const values = Object.values(context);
  const func = new Function(...keys, `return eval(\`${this.code}\`);`);
  return func(...values);
};

export const ytdl = npmYtdl;
