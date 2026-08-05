import {
  getRows,
  json,
  serviceFetch,
  SUPABASE_SERVICE_ROLE_KEY,
  value,
} from "../../_utils/mindease";

async function queuePlaceholderNotification(appointment: Record<string, unknown>, action: string) {
  const email = value(appointment, ["client_email"], "");
  const phone = value(appointment, ["client_phone"], "");
  if (!email && !phone) return;

  await serviceFetch("/rest/v1/notification_queue", {
    method: "POST",
    headers: { prefer: "return=minimal" },
    body: JSON.stringify({
      recipient_email: email || null,
      recipient_phone: phone || null,
      channel: phone ? "whatsapp" : "email",
      template_key: action === "confirm" ? "client_confirmed_payment_pending" : "client_declined_suggestion",
      payload: {
        appointmentId: appointment.id,
        action,
        integrationConfigured: false,
        note: "No real notification is sent until provider credentials are configured.",
      },
      status: "pending",
    }),
  });
}

export async function POST(request: Request) {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "Appointment confirmation is not configured." }, 500);
  }

  const body = await request.json();
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const action = typeof body.action === "string" ? body.action : "";

  if (!token || !["confirm", "decline"].includes(action)) {
    return json({ error: "Valid confirmation token and action are required." }, 400);
  }

  const appointments = await getRows(
    "appointments",
    `client_confirmation_token=eq.${encodeURIComponent(token)}&select=*&limit=1`,
  );
  const appointment = appointments[0];
  if (!appointment) return json({ error: "Appointment confirmation link is invalid." }, 404);

  const update =
    action === "confirm"
      ? {
          client_confirmation_status: "confirmed",
          lifecycle_stage: "payment_pending",
          status: "payment_pending",
          notification_status: "queued",
        }
      : {
          client_confirmation_status: "declined",
          lifecycle_stage: "cancelled",
          status: "cancelled",
          notification_status: "queued",
        };

  const response = await serviceFetch(
    `/rest/v1/appointments?id=eq.${encodeURIComponent(value(appointment, ["id"]))}`,
    {
      method: "PATCH",
      headers: { prefer: "return=representation" },
      body: JSON.stringify(update),
    },
  );
  const result = await response.json();

  if (!response.ok) {
    return json({ error: result?.message ?? "Could not update appointment." }, response.status);
  }

  await queuePlaceholderNotification(appointment, action);

  return json({
    appointment: Array.isArray(result) ? result[0] : result,
    notificationConfigured: false,
  });
}
