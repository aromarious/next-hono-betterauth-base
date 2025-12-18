import { expect, test } from "@playwright/test"

test.describe("Posts API E2E", () => {
  test("GET /api/v0/protected/posts returns posts list", async ({
    request,
  }) => {
    const response = await request.get("/api/v0/protected/posts")

    expect(response.status()).toBe(200)
    expect(response.headers()["content-type"]).toContain("application/json")

    const data = await response.json()
    expect(Array.isArray(data)).toBe(true)
  })

  test("POST /api/v0/protected/posts creates a new post", async ({
    request,
  }) => {
    const newPost = {
      title: "E2E Test Post",
      content: "This is a test post created by E2E test",
    }

    const response = await request.post("/api/v0/protected/posts", {
      data: newPost,
    })

    expect(response.status()).toBe(201)

    const data = await response.json()
    expect(data).toHaveProperty("id")
    expect(data).toHaveProperty("title", newPost.title)
    expect(data).toHaveProperty("content", newPost.content)
    expect(data).toHaveProperty("createdAt")
    expect(data).toHaveProperty("updatedAt")
  })

  test("GET /api/v0/protected/posts/:id returns a specific post", async ({
    request,
  }) => {
    // まず投稿を作成
    const newPost = {
      title: "Test Post for GET",
      content: "Test content",
    }
    const createResponse = await request.post("/api/v0/protected/posts", {
      data: newPost,
    })
    const createdPost = await createResponse.json()

    // 作成した投稿を取得
    const response = await request.get(
      `/api/v0/protected/posts/${createdPost.id}`,
    )

    if (response.status() !== 200) {
      const body = await response.text()
      console.log("Response Body:", body)
      throw new Error(`Expected 200 but got ${response.status()}: ${body}`)
    }
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty("id", createdPost.id)
    expect(data).toHaveProperty("title", newPost.title)
  })

  test("GET /api/v0/protected/posts/:id returns 404 for non-existent post", async ({
    request,
  }) => {
    const response = await request.get(
      "/api/v0/protected/posts/non-existent-id",
    )

    expect(response.status()).toBe(404)
  })
})
