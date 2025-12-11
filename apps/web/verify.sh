#!/bin/bash

BASE_URL="http://localhost:3000/api/posts"

echo "1. Creating a new post..."
RESPONSE=$(curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"title": "My First Post", "content": "Hello, world!"}')
echo "Response: $RESPONSE"
ID=$(echo $RESPONSE | jq -r '.id')
echo "Created Post ID: $ID"
echo "--------------------------------"

echo "2. Listing all posts..."
curl -s $BASE_URL | jq .
echo "--------------------------------"

echo "2.1. Getting single post..."
curl -s "$BASE_URL/$ID" | jq .
echo "--------------------------------"

echo "3. Updating the post..."
curl -s -X PUT "$BASE_URL/$ID" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}' | jq .
echo "--------------------------------"

echo "4. Deleting the post..."
curl -s -X DELETE "$BASE_URL/$ID" | jq .
echo "--------------------------------"

echo "5. Verifying deletion (should be 404 or error)..."
curl -s -X GET "$BASE_URL/$ID" | jq .
curl -s $BASE_URL | jq .
echo "--------------------------------"
