#!/bin/bash
git add .
git commit . -m "Fixed stuff"
git push
npm install
 docker buildx build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_API_BASE_URL=/api \
  -t hpooni/fleet-manager-app-frontend:latest \
  --push \
  .

