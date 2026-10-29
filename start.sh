#!/bin/bash
source ~/.nvm/nvm.sh
nvm use 22
cd "$(dirname "$0")"
docker compose up -d
cd server && npm run start:dev