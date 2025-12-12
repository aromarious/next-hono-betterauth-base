import { env } from "@/env"
import { createClient } from "@/lib/client"

export const dynamic = "force-dynamic"

export default async function Home() {
  const client = createClient("v0")
  const res = await client.system.hello.$get()
  const data = await res.json()

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold">Webservice Next Hono Base</h1>
        <p className="text-xl mt-4">API Response: {data.message}</p>
        <p className="text-xl mt-4">env: {env.NODE_ENV}</p>
        <p className="text-xl mt-4">env: {env.DATABASE_URL}</p>
      </div>
    </main>
  )
}
