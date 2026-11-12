
interface Env {
  RESEND_API_KEY: string;
  CONTACT_TO: string;
}

type FieldValue = string | string[];
type Payload = Record<string, FieldValue>;

const ALLOWED_ORIGINS = new Set([
  "https://app.eclora.ca",
  "https://eclora.ca",
  "https://www.eclora.ca",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

const MAX_BODY_SIZE = 20_000;

function json(
  data: unknown,
  status: number,
  headers: Record<string, string>
) {
  return Response.json(data, { status, headers });
}

function getText(value: FieldValue | undefined): string {
  if (Array.isArray(value)) {
    return value.join(", ").trim();
  }

  return typeof value === "string" ? value.trim() : "";
}

function validPayload(value: unknown): value is Payload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const entries = Object.entries(value);

  if (entries.length > 40) return false;

  return entries.every(([key, field]) => {
    if (key.length > 100) return false;

    if (typeof field === "string") {
      return field.length <= 5000;
    }

    if (Array.isArray(field)) {
      return field.length <= 20 &&
        field.every(
          item => typeof item === "string" && item.length <= 5000
        );
    }

    return false;
  });
}

function labelField(key: string): string {
  const labels: Record<string, string> = {
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
    _url: "Submitted from",
  };

  return labels[key] || key;
}

async function sendEmail(
  env: Env,
  email: Record<string, unknown>
): Promise<boolean> {
  const response = await fetch(
    "https://api.resend.com/emails",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(email),
    }
  );

  if (!response.ok) {
    console.error(`Resend returned status ${response.status}`);
    return false;
  }

  return true;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin") || "";

    const headers: Record<string, string> = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };

    if (!ALLOWED_ORIGINS.has(origin)) {
      return json({ error: "Forbidden" }, 403, {});
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers,
      });
    }

    const url = new URL(request.url);

    if (
      url.pathname !== "/api/contact" ||
      request.method !== "POST"
    ) {
      return json({ error: "Not found" }, 404, headers);
    }

    const contentLength = Number(
      request.headers.get("Content-Length") || 0
    );

    if (contentLength > MAX_BODY_SIZE) {
      return json({ error: "Request too large" }, 413, headers);
    }

    if (!request.headers.get("Content-Type")?.includes("application/json")) {
      return json({ error: "Invalid content type" }, 415, headers);
    }

    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400, headers);
    }

    if (!validPayload(payload)) {
      return json({ error: "Invalid form information" }, 400, headers);
    }

    // Silently discard honeypot submissions.
    if (getText(payload._honey)) {
      return json({ success: true }, 200, headers);
    }

    const name = getText(payload.name);
    const email = getText(payload.email);
    const message = getText(payload.message);
    const activity = getText(payload.activity);

    const language = getText(payload.language) === "fr"
      ? "fr"
      : "en";

    const formType = getText(payload.form_type);

    if (
      !name ||
      !email ||
      name.length > 150 ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return json({ error: "Invalid name or email" }, 400, headers);
    }

    if (
      (formType === "contact" && !message) ||
      (formType === "project" && !activity) ||
      !["contact", "project"].includes(formType)
    ) {
      return json({ error: "Missing required information" }, 400, headers);
    }

    const safeName = name.replace(/[\r\n]+/g, " ");

    const subject = language === "fr"
      ? formType === "project"
        ? `Éclora — Nouveau projet web de ${safeName}`
        : `Éclora — Nouvelle demande de contact de ${safeName}`
      : formType === "project"
        ? `Éclora — New website project from ${safeName}`
        : `Éclora — New contact enquiry from ${safeName}`;

    const details = Object.entries(payload)
      .filter(([key]) =>
        !["_honey", "language", "form_type"].includes(key)
      )
      .map(([key, value]) => {
        const formatted = Array.isArray(value)
          ? value.join(", ")
          : value;

        return `${labelField(key)}:\n${formatted || "(Not provided)"}`;
      })
      .join("\n\n");

    const notificationSent = await sendEmail(env, {
      from: "Éclora Website <website@send.eclora.ca>",
      to: [env.CONTACT_TO],
      reply_to: email,
      subject,
      text: `New website submission\n\n${details}`,
    });

    if (!notificationSent) {
      return json(
        { error: "Unable to deliver your message" },
        502,
        headers
      );
    }

    const confirmation = language === "fr"
      ? {
          subject: "Nous avons bien reçu votre demande !",
          text: `Bonjour ${safeName},

Merci de nous avoir contactés.

Nous avons bien reçu votre demande et nous vous répondrons après en avoir pris connaissance.

À bientôt,

L'équipe Éclora
info@eclora.ca`,
        }
      : {
          subject: "We received your enquiry!",
          text: `Hello ${safeName},

Thank you for contacting Eclora.

We've received your message and will get back to you as soon as possible.

Best regards,

The Eclora Team
info@eclora.ca`,
        };

    const confirmationSent = await sendEmail(env, {
      from: "Éclora <website@send.eclora.ca>",
      to: [email],
      subject: confirmation.subject,
      text: confirmation.text,
    });

    if (!confirmationSent) {
      console.error("Client confirmation email could not be sent.");
    }

    return json(
      {
        success: true,
        confirmationSent,
      },
      200,
      headers
    );
  },
};
