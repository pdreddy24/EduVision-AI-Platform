import express from "express";
import EventModel from "../models/Event.js";
import crypto from "crypto";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const event = req.body || {};

    const record = await EventModel.create({
      event_id: event.event_id || crypto.randomUUID(),
      event_name: event.event_name || "UNKNOWN_EVENT",
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),

      session_id: event.session_id || null,
      user_id: event.user_id || null,
      source: event.source || "backend",

      payload: event.payload || {},

      _server_timestamp: new Date(),
    });

    return res.json({
      status: "success",
      event_id: record.event_id,
    });

  } catch (err) {
    console.error("TRACK ERROR:", err);
    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

export default router;
