import dotenv from "dotenv";

dotenv.config();

export default {

  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN, // Your Telegram Bot Token

  MODEL_PATH: "./model/u2net.onnx"           // ONNX model path

};
