#!/bin/bash

set -e

echo "==============================="

echo "🚀 Automated Telegram BG Bot Setup"

echo "==============================="

# 1️⃣ Install Node.js 20 LTS

echo "Installing Node.js 20 LTS..."

curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

apt install -y nodejs build-essential

# 2️⃣ Install system libraries for canvas

echo "Installing system libraries for canvas..."

apt update

apt install -y libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# 3️⃣ Check Node & NPM versions

echo "Node.js version: $(node -v)"

echo "NPM version: $(npm -v)"

# 4️⃣ Install Node.js dependencies

echo "Installing npm packages..."

npm install

# 5️⃣ Download U²-Net ONNX model if not exists

MODEL_PATH="./model/u2net.onnx"

if [ ! -f "$MODEL_PATH" ]; then

    echo "Downloading U²-Net ONNX model..."

    mkdir -p ./model

    curl -L -o "$MODEL_PATH" https://github.com/NathanUA/U-2-Net/releases/download/v1.0/u2net.onnx

fi

# 6️⃣ Create .env if not exists

if [ ! -f .env ]; then

    echo "Creating .env file..."

    echo "TELEGRAM_TOKEN=YOUR_TELEGRAM_BOT_TOKEN" > .env

    echo "Please edit .env and add your Telegram bot token."

fi

# 7️⃣ Start Bot

echo "Starting the bot..."

node index.js