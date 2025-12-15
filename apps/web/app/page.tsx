"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"

export default function Home() {
  const [message, setMessage] = useState<string>("Loading...")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const client = createClient("v0")
    client.hello
      .$get()
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => {
        console.error("API Error:", err)
        setError(err.message)
      })
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <h1 className="font-bold text-4xl">Webservice Next Hono Base</h1>
        {error ? (
          <p className="mt-4 text-red-500 text-xl">Error: {error}</p>
        ) : (
          <p className="mt-4 text-xl">API Response: {message}</p>
        )}
      </div>
    </main>
  )
}
