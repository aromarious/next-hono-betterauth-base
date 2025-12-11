#!/bin/bash

# APIのエンドポイント
BASE_URL="http://localhost:3000/api/posts"

echo "=== Post API Verification Start ==="

# 1. Create Post
echo "\n[1] Creating Post..."
CREATE_RES=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Post","content":"Hello World"}')

echo "Response: $CREATE_RES"

# IDを抽出 (簡易的なgrep/sed)
POST_ID=$(echo $CREATE_RES | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$POST_ID" ]; then
  echo "❌ Failed to create post"
  exit 1
fi

echo "✅ Created Post ID: $POST_ID"

# 2. Get Posts
echo "\n[2] Getting Posts..."
GET_RES=$(curl -s "$BASE_URL")
if [[ $GET_RES == *"$POST_ID"* ]]; then
  echo "✅ Post found in list"
else
  echo "❌ Post not found in list"
  echo "Response: $GET_RES"
  exit 1
fi

# 3. Update Post
echo "\n[3] Updating Post..."
UPDATE_RES=$(curl -s -X PUT "$BASE_URL/$POST_ID" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title","content":"Updated Content"}')

echo "Response: $UPDATE_RES"
if [[ $UPDATE_RES == *"Updated Title"* ]]; then
  echo "✅ Post updated successfully"
else
  echo "❌ Failed to update post"
  exit 1
fi

# 4. Delete Post
echo "\n[4] Deleting Post..."
DELETE_RES=$(curl -s -X DELETE "$BASE_URL/$POST_ID")

echo "Response: $DELETE_RES"
if [[ $DELETE_RES == *"$POST_ID"* ]]; then
  echo "✅ Post deleted response valid"
else
 echo "❌ Failed to delete post"
 exit 1
fi

# 5. Verify Deletion
echo "\n[5] Verifying Deletion..."
GET_RES_FINAL=$(curl -s "$BASE_URL")
if [[ $GET_RES_FINAL != *"$POST_ID"* ]]; then
  echo "✅ Post correctly removed"
else
  echo "❌ Post still exists"
  exit 1
fi

echo "\n=== Verification Complete: SUCCESS ==="
