// =====================================
// Core Event Tracking System (Frontend)
// =====================================

// 🚀 CHANGE THIS: backend URL
const TRACK_ENDPOINT = "http://localhost:5000/track";

//  Sends all events to backend POST /track
export const trackEvent = (eventName, payload = {}) => {
  try {
    fetch(TRACK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        event_id: crypto.randomUUID(),
        event_name: eventName,
        timestamp: new Date().toISOString(),

        session_id: localStorage.getItem("session_id"),
        user_id: localStorage.getItem("user_id") || null,

        source: "frontend",

        payload
      })
    });
  } catch (_) {
    // Ignore tracking failures
  }
};

// Initialize session ID
if (!localStorage.getItem("session_id")) {
  localStorage.setItem("session_id", crypto.randomUUID());
}

// =============================
// High-level Tracking Helpers
// =============================

export const trackFileUpload = (file) => {
  trackEvent("FILE_UPLOADED", {
    file_name: file.name,
    file_type: file.name.split(".").pop().toLowerCase(),
    file_size_mb: (file.size / 1_000_000).toFixed(2)
  });
};

export const trackUserError = (errorCode, message) => {
  trackEvent("USER_ERROR", {
    error_code: errorCode,
    message
  });
};

export const trackConversionStart = (fileType, outputType) => {
  trackEvent("CONVERSION_STARTED", {
    file_type: fileType,
    output_type: outputType,
    start_time_ms: Date.now()
  });
};

export const trackConversionEnd = (fileType, outputType, startTime) => {
  trackEvent("CONVERSION_COMPLETED", {
    file_type: fileType,
    output_type: outputType,
    duration_ms: Date.now() - startTime
  });
};

export const trackOutputType = (outputType) => {
  trackEvent("OUTPUT_TYPE_SELECTED", { output_type: outputType });
};

export const trackModelLatency = (modelName, latencyMs) => {
  trackEvent("MODEL_LATENCY_RECORDED", {
    model_name: modelName,
    latency_ms: latencyMs
  });
};

export const trackResourceUsed = (usage) => {
  trackEvent("RESOURCE_USAGE_RECORDED", usage);
};

export const trackSignup = (userId, email) => {
  trackEvent("USER_SIGNUP", {
    user_id: userId,
    email: email,
  });
};

export const trackLogin = (userId, email) => {
  trackEvent("USER_LOGIN", {
    user_id: userId,
    email: email,
  });
};

export const trackLogout = (userId) => {
  trackEvent("USER_LOGOUT", {
    user_id: userId,
    frontend_timestamp: Date.now(),
    page: window.location.pathname
  });
};
