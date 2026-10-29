import "dotenv/config";
import { getPayload } from "payload";
import config from "../payload.config";
import { migrate } from "../migrations/migrate";
import { seed } from "./seed";
import { syncColors } from "../collections/color-sync";
import { translateContent } from "./translate";

const payload = await getPayload({ config });
await migrate(payload);
await seed(payload);
await translateContent(payload);
await syncColors(payload);
payload.logger.info("seed finished");
process.exit(0);
