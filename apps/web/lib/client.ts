import { hc } from "hono/client"
import { baseUrl } from "@/lib/baseUrl"

import type { ApiType, AppType } from "@/server"
import { type ApiVersion, LATEST_API_VERSION } from "./api-versions"

export const client = hc<AppType>(baseUrl)

export const createClient = (version: ApiVersion = LATEST_API_VERSION) =>
  hc<ApiType>(`${baseUrl}/api/${version}`)
