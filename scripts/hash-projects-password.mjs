import { randomBytes, scryptSync } from "node:crypto";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";

const rl = createInterface({ input: stdin, output: stdout, terminal: true });
const password = await rl.question("Projects password: ");
rl.close();

if (password.length < 12) {
  throw new Error("Use a password with at least 12 characters.");
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
stdout.write(`\nPROJECTS_PASSWORD_HASH=scrypt:${salt}:${hash}\n`);
