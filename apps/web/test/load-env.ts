import fs from "node:fs"
import path from "node:path"
import * as dotenv from "dotenv"

// .env file is expected in the app root (one level up from this file)
const envPath = path.resolve(__dirname, "../.env")

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}
