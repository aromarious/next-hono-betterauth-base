import { hc } from "hono/client"
import { baseUrl } from "@/lib/baseUrl"

import type { ApiType, AppType } from "@/server"
import { type ApiVersion, LATEST_API_VERSION } from "./api-versions"

import { authClient } from "./auth-client"

export const client = hc<AppType>(baseUrl)

interface ClientOptions {
  headers?: HeadersInit
  fetch?: typeof fetch
  version?: ApiVersion
}

export const createClient = (options?: ClientOptions) => {
  const version = options?.version ?? LATEST_API_VERSION

  const basePublic = hc<ApiType>(`${baseUrl}/api/${version}`, {
    fetch: options?.fetch,
  })

  const baseProtected = hc<ApiType>(`${baseUrl}/api/${version}`, {
    headers: options?.headers as Record<string, string>,
    fetch: options?.fetch,
  }).protected

  type ProtectedClientType = typeof baseProtected & { auth: typeof authClient }

  const protectedClient = new Proxy(baseProtected, {
    get(target, prop, receiver) {
      if (prop === "auth") {
        return authClient
      }
      return Reflect.get(target, prop, receiver)
    },
  }) as unknown as ProtectedClientType

  return {
    publicClient: basePublic.public,
    protectedClient,
  }
}
