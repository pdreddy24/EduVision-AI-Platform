import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  event_id: { type: String, required: true },
  event_name: { type: String, required: true },
  timestamp: { type: Date, required: true },

  session_id: { type: String },
  user_id: { type: String },
  source: { type: String },

  payload: { type: Object },

  _server_timestamp: { type: Date, default: Date.now }
}, {
  collection: "events"
});

//  Indexes for fast analytics
eventSchema.index({ event_name: 1 });
eventSchema.index({ timestamp: -1 });
eventSchema.index({ session_id: 1 });
eventSchema.index({ user_id: 1 });
eventSchema.index({ "payload.file_type": 1 });

const EventModel = mongoose.model("Event", eventSchema);

export default EventModel;
