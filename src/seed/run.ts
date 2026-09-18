import "dotenv/config";
import { getPayload } from "payload";
import config from "../payload.config";

const payload = await getPayload({ config });
payload.logger.info("seed finished");
process.exit(0);
