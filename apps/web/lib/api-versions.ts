export const API_VERSIONS = {
  v0: "v0",
} as const

export type ApiVersion = keyof typeof API_VERSIONS
export const LATEST_API_VERSION = API_VERSIONS.v0
