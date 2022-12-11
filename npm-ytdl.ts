import { default as npmYtdl } from "npm:ytdl-core";

/**
 * Youtube uses signature functions that need to be run to validate
 * As deno does not support a VM or sandbox to run these there is an inherit risk
 * However, it should be relativly safe as the code originates from Google, unless they get compromised.
 * Issue that solves this problem: https://github.com/denoland/deno/issues/13239
 */
import { Script as Script1 } from "https://deno.land/std@0.161.0/node/vm.ts";
import { Script as Script2 } from "https://deno.land/std@0.162.0/node/vm.ts";
import { Script as Script3 } from "https://deno.land/std@0.167.0/node/vm.ts";

console.warn(
  "WARNING\nYTDL needs to run external code from Google to decipher Youtube videos\nDeno does not support a sandbox/VM so this code has the same abilities as the host!\nIssue that could enable sandboxing:\nhttps://github.com/denoland/deno/issues/13239"
);

function fakeRunInNewContext(
  this: Script1 | Script2,
  context: Record<string, any>
) {
  const keys = Object.keys(context);
  const values = Object.values(context);
  const func = new Function(...keys, `return eval(\`${this.code}\`);`);
  return func(...values);
}

/**
 * Fill missing VM function used by ytdl
 */
Script1.prototype.runInNewContext = fakeRunInNewContext;
Script2.prototype.runInNewContext = fakeRunInNewContext;
Script3.prototype.runInNewContext = fakeRunInNewContext;

export const ytdl = npmYtdl;
