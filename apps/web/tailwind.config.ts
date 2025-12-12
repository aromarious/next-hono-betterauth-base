import sharedConfig from "@packages/ui/tailwind.config"
import type { Config } from "tailwindcss"

const config: Config = {
  ...sharedConfig,
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
}
export default config
