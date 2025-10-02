import { StreamChat } from "stream-chat";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  throw new Error("Stream API key and secret must be set in environment variables");
}

const serverClient = StreamChat.getInstance(apiKey, apiSecret);

export const createstreamUser = async (userData) => {
  try {
    await serverClient.upsertUsers(userData);
    return userData;
  } catch (error) {
    console.error("Error creating Stream user:", error);
    throw error;
  }
};
