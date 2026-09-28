import type { Payload } from "payload";

/**
 * Brings the database up to the schema in src/migrations/<adapter>. Databases
 * made by the old dev push carry a marker row that makes Payload stop and ask
 * before migrating, so it is dropped first and nothing ever waits for input.
 */
export async function migrate(payload: Payload) {
  try {
    await payload.delete({ collection: "payload-migrations", where: { batch: { equals: -1 } } });
  } catch {
    // A fresh database has no migrations table yet.
  }
  await payload.db.migrate();
}
