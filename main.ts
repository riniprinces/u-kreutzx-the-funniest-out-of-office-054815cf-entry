// The Funniest Out-of-Office — make.fun bounty entry (v2).
//
// One line of out-of-office auto-reply, written to /output/entry.txt.
// The line is a fixed string: the program's job is to prove it is a
// valid entry (1-140 chars, one line, UTF-8, no trailing newline),
// write it, and read it back to confirm the bytes on disk match.
//
// Why this line: an out-of-office reply a real person would actually
// set, with a twist nobody sees coming — the inbox is not "monitored
// by a colleague" but handed to a toddler, who promptly reorganised
// the whole company and sacked the printer.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createHash } from "node:crypto";

const LINE =
  "I'm out until Monday. My inbox is in the care of my toddler, who has promoted everyone to CEO and fired the printer.";

const OUTPUT = process.env.OUTPUT_PATH ?? "/output/entry.txt";
const MIN_CHARS = 1;
const MAX_CHARS = 140;

type Issue = string;

function validate(line: string): Issue[] {
  const issues: Issue[] = [];
  const chars = [...line].length;
  if (chars < MIN_CHARS || chars > MAX_CHARS) {
    issues.push(`length ${chars} chars, must be ${MIN_CHARS}-${MAX_CHARS}`);
  }
  if (line.trim() === "") issues.push("entry is only whitespace");
  if (/[\r\n]/.test(line)) issues.push("entry spans more than one line");
  if (line !== line.trim()) issues.push("leading or trailing whitespace");
  if (line.endsWith("\n")) issues.push("trailing newline");
  if (Buffer.from(line, "utf8").toString("utf8") !== line) {
    issues.push("entry is not valid UTF-8");
  }
  return issues;
}

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function run(): void {
  const issues = validate(LINE);
  if (issues.length > 0) {
    for (const issue of issues) console.error(`gate FAIL: ${issue}`);
    process.exit(1);
  }
  const bytes = Buffer.byteLength(LINE, "utf8");
  console.log(
    `gate PASS: ${[...LINE].length} chars, ${bytes} bytes, single line, sha256 ${sha256(LINE)}`,
  );

  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, LINE, "utf8");
  console.log(`wrote ${OUTPUT} (${bytes} bytes, no trailing newline)`);

  const roundTrip = readFileSync(OUTPUT, "utf8");
  if (roundTrip !== LINE) {
    console.error("verify FAIL: file read back differs from the entry line");
    process.exit(1);
  }
  if (sha256(roundTrip) !== sha256(LINE)) {
    console.error("verify FAIL: sha256 mismatch on read back");
    process.exit(1);
  }
  console.log(`verify PASS: read back byte-identical, sha256 ${sha256(roundTrip)}`);
}

run();
