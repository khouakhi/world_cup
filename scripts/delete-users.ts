/**
 * Delete test users by email from Firestore + Firebase Auth.
 *
 * Usage:
 *   npx tsx scripts/delete-users.ts ab.khouakhi@gmail.com a.khouakhi@cranfield.ac.uk
 */
import { deleteUserByEmail } from "../src/lib/admin/delete-user";

async function main() {
  const emails = process.argv.slice(2);
  if (!emails.length) {
    console.error("Usage: npx tsx scripts/delete-users.ts email1 email2 ...");
    process.exit(1);
  }

  for (const email of emails) {
    const result = await deleteUserByEmail(email);
    console.log(JSON.stringify(result, null, 2));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
