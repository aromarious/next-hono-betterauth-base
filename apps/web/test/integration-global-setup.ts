import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const envPath = path.resolve(__dirname, "../.env")

export const setup = () => {
  // CI環境では .env 生成をスキップ
  if (process.env.CI) {
    return
  }

  // Infisical から .env を生成
  try {
    execSync("infisical export --env=staging --format=dotenv > .env", {
      cwd: path.resolve(__dirname, "../"),
      stdio: "inherit",
    })
  } catch (_e) {
    // 失敗時は無視（既存ファイルがあればそれを使う）
    console.warn(
      "Failed to generate .env from Infisical, proceeding with existing environment.",
    )
  }

  // Teardown function to cleanup .env
  return () => {
    if (fs.existsSync(envPath)) {
      fs.unlinkSync(envPath)
    }
  }
}
