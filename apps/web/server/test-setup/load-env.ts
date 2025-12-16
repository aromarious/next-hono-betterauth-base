import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import * as dotenv from "dotenv"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envPath = path.resolve(__dirname, "../../.env")

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. If you are running tests via Test Explorer, make sure 'infisical' is in your PATH and you are logged in, or create a .env file manully.",
  )
}
