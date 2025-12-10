import EventModel from "../models/Event.js";
import crypto from "crypto";

export async function trackBackendEvent(eventName, payload = {}, req = null) {
  try {
    const ip =
      req?.headers?.["x-forwarded-for"]?.split(",")[0] ||
      req?.socket?.remoteAddress ||
      null;

    const userId =
      payload.user_id ||
      req?.user?._id ||
      req?.body?.user_id ||
      null;

    await EventModel.create({
      event_id: crypto.randomUUID(),
      event_name: eventName,
      timestamp: new Date(),
      session_id: req?.headers?.["x-session-id"] || null,
      user_id: userId,
      source: "backend",

      payload: {
        ...payload,
        ip_address: ip,
        user_agent: req?.headers["user-agent"] || null,
      },

      _server_timestamp: new Date(),
    });
  } catch (err) {
    console.error("Backend tracking failed:", err.message);
  }
}
