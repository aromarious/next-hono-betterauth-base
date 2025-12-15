import app from "@/server"

// Set runtime to nodejs or edge as needed (Hono supports both)
export const runtime = "nodejs"

// 汎用ハンドラー: Next.jsのリクエストをHonoに転送
const handler = async (req: Request) => app.fetch(req)

export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
export const PATCH = handler
