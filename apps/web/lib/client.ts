import type { AppType } from "api";
import { hc } from "hono/client";

// Assuming API is mounted at /api within the same domain (Next.js config)
const baseUrl =
	typeof window !== "undefined"
		? window.location.origin
		: "http://localhost:3000";

export const client = hc<AppType>(`${baseUrl}/api`);
