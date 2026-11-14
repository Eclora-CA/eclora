var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker/index.ts
var ALLOWED_ORIGINS = /* @__PURE__ */ new Set([
  "https://app.eclora.ca",
  "https://eclora.ca",
  "https://www.eclora.ca",
  "http://localhost:4173",
  "http://127.0.0.1:4173"
]);
var MAX_BODY_SIZE = 2e4;
function json(data, status, headers) {
  return Response.json(data, { status, headers });
}
__name(json, "json");
function getText(value) {
  if (Array.isArray(value)) {
    return value.join(", ").trim();
  }
  return typeof value === "string" ? value.trim() : "";
}
__name(getText, "getText");
function validPayload(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const entries = Object.entries(value);
  if (entries.length > 40) return false;
  return entries.every(([key, field]) => {
    if (key.length > 100) return false;
    if (typeof field === "string") {
      return field.length <= 5e3;
    }
    if (Array.isArray(field)) {
      return field.length <= 20 && field.every(
        (item) => typeof item === "string" && item.length <= 5e3
      );
    }
    return false;
  });
}
__name(validPayload, "validPayload");
function labelField(key) {
  const labels = {
    name: "Name",
    email: "Email",
    business: "Business",
    phone: "Phone",
    message: "Message",
    activity: "Business activity",
    goal: "Website goal",
    "pages[]": "Requested pages",
    "features[]": "Requested features",
    language_requested: "Website language",
    existing: "Existing website or domain",
    identity: "Logo and brand colours",
    style: "Preferred style",
    examples: "Reference websites",
    content: "Content readiness",
    launch_date: "Preferred launch date",
    details: "Additional details",
    _url: "Submitted from"
  };
  return labels[key] || key;
}
__name(labelField, "labelField");
async function sendEmail(env, email) {
  const response = await fetch(
    "https://api.resend.com/emails",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(email)
    }
  );
  if (!response.ok) {
    console.error(`Resend returned status ${response.status}`);
    return false;
  }
  return true;
}
__name(sendEmail, "sendEmail");
var worker_default = {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);
    const headers = {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };
    if (request.method === "OPTIONS") {
      if (url.pathname !== "/api/contact" || !ALLOWED_ORIGINS.has(origin)) {
        return json({ error: "Forbidden" }, 403, {});
      }
      headers["Access-Control-Allow-Origin"] = origin;
      return new Response(null, {
        status: 204,
        headers
      });
    }
    if (url.pathname !== "/api/contact" || request.method !== "POST") {
      return json({ error: "Not found" }, 404, {});
    }
    if (!ALLOWED_ORIGINS.has(origin)) {
      return json({ error: "Forbidden" }, 403, {});
    }
    headers["Access-Control-Allow-Origin"] = origin;
    const contentLength = Number(
      request.headers.get("Content-Length") || 0
    );
    if (contentLength > MAX_BODY_SIZE) {
      return json({ error: "Request too large" }, 413, headers);
    }
    if (!request.headers.get("Content-Type")?.includes("application/json")) {
      return json({ error: "Invalid content type" }, 415, headers);
    }
    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400, headers);
    }
    if (!validPayload(payload)) {
      return json({ error: "Invalid form information" }, 400, headers);
    }
    if (getText(payload._honey)) {
      return json({ success: true }, 200, headers);
    }
    const name = getText(payload.name);
    const email = getText(payload.email);
    const message = getText(payload.message);
    const activity = getText(payload.activity);
    const language = getText(payload.language) === "fr" ? "fr" : "en";
    const formType = getText(payload.form_type);
    if (!name || !email || name.length > 150 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Invalid name or email" }, 400, headers);
    }
    if (formType === "contact" && !message || formType === "project" && !activity || !["contact", "project"].includes(formType)) {
      return json({ error: "Missing required information" }, 400, headers);
    }
    const safeName = name.replace(/[\r\n]+/g, " ");
    const subject = language === "fr" ? formType === "project" ? `\xC9clora \u2014 Nouveau projet web de ${safeName}` : `\xC9clora \u2014 Nouvelle demande de contact de ${safeName}` : formType === "project" ? `\xC9clora \u2014 New website project from ${safeName}` : `\xC9clora \u2014 New contact enquiry from ${safeName}`;
    const details = Object.entries(payload).filter(
      ([key]) => !["_honey", "language", "form_type"].includes(key)
    ).map(([key, value]) => {
      const formatted = Array.isArray(value) ? value.join(", ") : value;
      return `${labelField(key)}:
${formatted || "(Not provided)"}`;
    }).join("\n\n");
    const notificationSent = await sendEmail(env, {
      from: "\xC9clora Website <website@send.eclora.ca>",
      to: [env.CONTACT_TO],
      reply_to: email,
      subject,
      text: `New website submission

${details}`
    });
    if (!notificationSent) {
      return json(
        { error: "Unable to deliver your message" },
        502,
        headers
      );
    }
    const confirmation = language === "fr" ? {
      subject: "Nous avons bien re\xE7u votre demande !",
      text: `Bonjour ${safeName},

Merci de nous avoir contact\xE9s.

Nous avons bien re\xE7u votre demande et nous vous r\xE9pondrons apr\xE8s en avoir pris connaissance.

\xC0 bient\xF4t,

L'\xE9quipe \xC9clora
info@eclora.ca`
    } : {
      subject: "We received your enquiry!",
      text: `Hello ${safeName},

Thank you for contacting Eclora.

We've received your message and will get back to you as soon as possible.

Best regards,

The Eclora Team
info@eclora.ca`
    };
    const confirmationSent = await sendEmail(env, {
      from: "\xC9clora <website@send.eclora.ca>",
      to: [email],
      subject: confirmation.subject,
      text: confirmation.text
    });
    if (!confirmationSent) {
      console.error("Client confirmation email could not be sent.");
    }
    return json(
      {
        success: true,
        confirmationSent
      },
      200,
      headers
    );
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-AXEp8X/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-AXEp8X/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
