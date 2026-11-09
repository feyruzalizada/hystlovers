import "dotenv/config";
import { getPayload } from "payload";
import config from "../payload.config";
import { migrate } from "../migrations/migrate";
import { seedBase, seedContent } from "./seed";
import { syncFilters } from "../collections/filter-sync";
import { translateContent } from "./translate";

const payload = await getPayload({ config });
await migrate(payload);
await seedBase(payload);
// SEED_CONTENT=false starts an empty shop: no catalogue, pages, posts or images.
if (process.env.SEED_CONTENT !== "false") {
  await seedContent(payload);
  await translateContent(payload);
}
await syncFilters(payload);
payload.logger.info("seed finished");
process.exit(0);
