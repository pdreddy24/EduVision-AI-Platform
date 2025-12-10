
import { trackEvent } from "./tracking";

const INTERACTIVE = ["BUTTON", "A", "INPUT", "SELECT", "TEXTAREA"];
let lastClickTime = 0, lastTarget = null, clickCount = 0;

export const initDomTracking = () => {
  if (window.__DOM_TRACKING_INITIALIZED__) return;
  window.__DOM_TRACKING_INITIALIZED__ = true;

  document.addEventListener("click", (e) => {
    const target = e.target;
    const now = Date.now();

    const payload = {
      tag: target.tagName,
      id: target.id || null,
      class_name: target.className || null,
      text: (target.innerText || target.value || "").slice(0, 80),
      x: e.clientX,
      y: e.clientY,
      viewport_w: window.innerWidth,
      viewport_h: window.innerHeight,
    };

    //  1. Raw DOM click (Heatmaps)
    trackEvent("DOM_CLICK", payload);

    //  2. Interactive controls
    if (INTERACTIVE.includes(target.tagName)) {
      trackEvent("CONTROL_USED", {
        tag: target.tagName,
        id: target.id || null,
        text: payload.text
      });
    }

    //  3. Rage click detection
    if (target === lastTarget && now - lastClickTime < 600) {
      clickCount++;
      if (clickCount >= 4) {
        trackEvent("RAGE_CLICK", {
          id: target.id,
          text: payload.text
        });
        clickCount = 0;
      }
    } else {
      clickCount = 1;
    }

    lastTarget = target;
    lastClickTime = now;
  });
};
