// Create or reset the initial admin account.
//
// Usage:
//   node scripts/seed_admin.mjs <username> <password> [name]
//
// Reads MONGODB_URI from .env (or environment).

import { readFileSync } from "node:fs";
import { scrypt as _scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";
import mongoose from "mongoose";

const scrypt = promisify(_scrypt);

function loadEnv() {
  try {
    const raw = readFileSync(new URL("../.env", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

async function main() {
  loadEnv();
  const [, , usernameArg, passwordArg, ...nameParts] = process.argv;
  if (!usernameArg || !passwordArg) {
    console.error("Usage: node scripts/seed_admin.mjs <username> <password> [name]");
    process.exit(1);
  }
  if (passwordArg.length < 8) {
    console.error("Password must be at least 8 characters");
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI not set");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const AdminSchema = new mongoose.Schema(
    {
      username: { type: String, required: true, unique: true, lowercase: true, trim: true },
      name: { type: String, default: "" },
      passwordHash: { type: String, required: true },
      createdAt: { type: String, default: () => new Date().toISOString() },
    }
  );
  const Admin = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);

  const username = usernameArg.toLowerCase().trim();
  const passwordHash = await hashPassword(passwordArg);
  const name = nameParts.join(" ") || username;

  const existing = await Admin.findOne({ username });
  if (existing) {
    existing.passwordHash = passwordHash;
    if (!existing.name) existing.name = name;
    await existing.save();
    console.log(`✅ Updated password for admin "${username}"`);
  } else {
    await Admin.create({ username, passwordHash, name });
    console.log(`✅ Created admin "${username}"`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
