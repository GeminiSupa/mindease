import {
  getRows,
  json,
  requireAdmin,
  serviceFetch,
  SUPABASE_SERVICE_ROLE_KEY,
  value,
  writeAuditLog,
} from "../../_utils/mindease";

const actionMap = {
  mark_payment_pending: {
    status: "payment_pending",
    lifecycle_stage: "payment_pending",
  },
  record_payment: {
    status: "confirmed",
    lifecycle_stage: "payment_recorded",
  },
  confirm_session: {
    status: "confirmed",
    lifecycle_stage: "session_confirmed",
  },
  complete: {
    status: "completed",
    lifecycle_stage: "completed",
  },
  cancel: {
    status: "cancelled",
    lifecycle_stage: "cancelled",
  },
} as const;

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
      template_key: `appointment_${action}`,
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

export async function PATCH(request: Request) {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "SUPABASE_SERVICE_ROLE_KEY is required to update appointments." }, 500);
  }

  const admin = await requireAdmin(request);
  if (!admin) return json({ error: "Admin access required." }, 403);

  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : "";
  const action = typeof body.action === "string" ? body.action : "";

  if (!id || !(action in actionMap)) {
    return json({ error: "Valid appointment id and action are required." }, 400);
  }

  const appointments = await getRows(
    "appointments",
    `id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
  );
  const appointment = appointments[0];
  if (!appointment) return json({ error: "Appointment not found." }, 404);

  const paymentReference =
    typeof body.paymentReference === "string" ? body.paymentReference.trim().slice(0, 160) : "";
  const adminNotes = typeof body.adminNotes === "string" ? body.adminNotes.trim().slice(0, 1000) : "";
  const mapped = actionMap[action as keyof typeof actionMap];
  const update = {
    ...mapped,
    notification_status: "queued",
    payment_reference: paymentReference || value(appointment, ["payment_reference"], ""),
    payment_recorded_at: action === "record_payment" ? new Date().toISOString() : appointment.payment_recorded_at ?? null,
    admin_notes: adminNotes || value(appointment, ["admin_notes"], ""),
  };

  const response = await serviceFetch(`/rest/v1/appointments?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { prefer: "return=representation" },
    body: JSON.stringify(update),
  });
  const result = await response.json();

  if (!response.ok) {
    return json({ error: result?.message ?? "Could not update appointment." }, response.status);
  }

  const updatedAppointment = Array.isArray(result) ? result[0] : result;

  if (action === "record_payment") {
    await serviceFetch("/rest/v1/payments", {
      method: "POST",
      headers: { prefer: "return=minimal" },
      body: JSON.stringify({
        appointment_id: id,
        provider: "manual_placeholder",
        provider_payment_id: paymentReference || null,
        amount: Number(appointment.amount) || 0,
        currency: value(appointment, ["currency"], "PKR"),
        status: "paid",
        paid_at: new Date().toISOString(),
      }),
    });
  }

  await queuePlaceholderNotification(updatedAppointment, action);
  await writeAuditLog({
    actorId: admin.id,
    action: `appointment_${action}`,
    subjectTable: "appointments",
    subjectId: id,
    details: { paymentReference, adminNotes, update },
  });

  return json({ appointment: updatedAppointment, notificationConfigured: false });
}
