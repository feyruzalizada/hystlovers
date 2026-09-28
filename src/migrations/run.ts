import "dotenv/config";
import { getPayload } from "payload";
import config from "../payload.config";
import { migrate } from "./migrate";

const payload = await getPayload({ config });
await migrate(payload);
process.exit(0);
