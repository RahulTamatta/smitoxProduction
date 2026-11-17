/**
 * One-off migration: bcrypt-hash any user password still stored in plaintext.
 *
 * Login already accepts both formats and upgrades on successful login; this
 * script upgrades everyone at once. Idempotent: already-hashed values are skipped.
 *
 *   node scripts/hashPlaintextPasswords.js            # dry run (counts only)
 *   node scripts/hashPlaintextPasswords.js --apply    # write hashes
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import userModel from "../models/userModel.js";

const APPLY = process.argv.includes("--apply");
const BCRYPT_RE = /^\$2[aby]\$\d{2}\$/;

const run = async () => {
  if (!process.env.MONGO_URL) throw new Error("MONGO_URL is not set");
  await mongoose.connect(process.env.MONGO_URL);

  const cursor = userModel
    .find({ password: { $exists: true, $nin: [null, ""] } })
    .select("_id password")
    .lean()
    .cursor();

  let scanned = 0;
  let plaintext = 0;
  let updated = 0;

  for await (const user of cursor) {
    scanned += 1;
    const stored = String(user.password);
    if (BCRYPT_RE.test(stored)) continue;
    plaintext += 1;
    if (APPLY) {
      const hashed = await bcrypt.hash(stored, 10);
      // Only overwrite if the value is unchanged since we read it
      const res = await userModel.updateOne(
        { _id: user._id, password: user.password },
        { $set: { password: hashed } }
      );
      updated += res.modifiedCount;
    }
  }

  console.log(`Scanned: ${scanned}  Plaintext: ${plaintext}  ${APPLY ? `Hashed: ${updated}` : "(dry run, use --apply)"}`);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error("Migration failed:", err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
