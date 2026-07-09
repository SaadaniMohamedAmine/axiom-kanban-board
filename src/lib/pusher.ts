import Pusher from "pusher";
import { requireEnv } from "./env";

export const pusher = new Pusher({
  appId: requireEnv("PUSHER_APP_ID"),
  key: requireEnv("PUSHER_KEY"),
  secret: requireEnv("PUSHER_SECRET"),
  cluster: process.env.PUSHER_CLUSTER || "us3",
  useTLS: true,
});
