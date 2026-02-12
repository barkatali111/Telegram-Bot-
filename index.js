import { Telegraf, Markup } from "telegraf";

import fs from "fs-extra";

import axios from "axios";

import { createCanvas, loadImage } from "canvas";

import ort from "onnxruntime-node";

import config from "./config.js";

// Initialize bot

const bot = new Telegraf(config.TELEGRAM_TOKEN);

// Load U²-Net ONNX model

let session;

(async () => {

  session = await ort.InferenceSession.create(config.MODEL_PATH);

  console.log("✅ U²-Net ONNX model loaded!");

})();

// Preprocess Image to 320x320 and normalize

async function preprocessImage(path) {

  const img = await loadImage(path);

  const canvas = createCanvas(320, 320);

  const ctx = canvas.getContext("2d");

  ctx.drawImage(img, 0, 0, 320, 320);

  const imageData = ctx.getImageData(0, 0, 320, 320);

  const data = new Float32Array(1 * 3 * 320 * 320);

  for (let y = 0; y < 320; y++) {

    for (let x = 0; x < 320; x++) {

      const i = (y * 320 + x) * 4;

      data[y * 320 + x] = imageData.data[i] / 255.0;           // R

      data[320*320 + y*320 + x] = imageData.data[i+1] / 255.0;  // G

      data[2*320*320 + y*320 + x] = imageData.data[i+2] / 255.0;// B

    }

  }

  return data;

}

// Remove Background function

async function removeBG(inputPath, outputPath) {

  const tensor = new ort.Tensor("float32", await preprocessImage(inputPath), [1, 3, 320, 320]);

  const results = await session.run({ "input.1": tensor });

  let mask = results["output.1"].data; // 1x1x320x320 mask

  const img = await loadImage(inputPath);

  const canvas = createCanvas(img.width, img.height);

  const ctx = canvas.getContext("2d");

  ctx.drawImage(img, 0, 0, img.width, img.height);

  const imageData = ctx.getImageData(0, 0, img.width, img.height);

  for (let y = 0; y < img.height; y++) {

    for (let x = 0; x < img.width; x++) {

      const mx = Math.floor(x * 320 / img.width);

      const my = Math.floor(y * 320 / img.height);

      const maskVal = mask[my * 320 + mx];

      const idx = (y * img.width + x) * 4;

      imageData.data[idx + 3] = Math.floor(maskVal * 255); // alpha

    }

  }

  ctx.putImageData(imageData, 0, 0);

  const out = fs.createWriteStream(outputPath);

  const stream = canvas.createPNGStream();

  stream.pipe(out);

  return new Promise(resolve => out.on("finish", resolve));

}

// Start command with inline button

bot.start((ctx) => {

  ctx.reply(

    "Welcome! Click the button to remove background from your images.",

    Markup.inlineKeyboard([[Markup.button.callback("Remove Background", "remove_bg")]])

  );

});

// Callback for button

bot.action("remove_bg", (ctx) => {

  ctx.reply("Send me the photo you want to remove background from.");

});

// Handle photo messages

bot.on("photo", async (ctx) => {

  try {

    const photo = ctx.message.photo.pop();

    const fileLink = await ctx.telegram.getFileLink(photo.file_id);

    const inputPath = `temp_${Date.now()}.jpg`;

    const outputPath = `output_${Date.now()}.png`;

    const response = await axios({ url: fileLink.href, responseType: 'arraybuffer' });

    fs.writeFileSync(inputPath, response.data);

    await ctx.reply("Processing image, please wait...");

    await removeBG(inputPath, outputPath);

    await ctx.replyWithPhoto({ source: outputPath });

    fs.unlinkSync(inputPath);

    fs.unlinkSync(outputPath);

  } catch (err) {

    console.error(err);

    ctx.reply("❌ Failed to remove background. Try again.");

  }

});

bot.launch();

console.log("✅ Advanced Background Removal Bot is running!");
