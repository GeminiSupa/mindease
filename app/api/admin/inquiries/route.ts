import {
  getRows,
  json,
  requireAdmin,
  serviceFetch,
  SUPABASE_SERVICE_ROLE_KEY,
  value,
  writeAuditLog,
} from "../../_utils/mindease";

const DEFAULT_PAYMENT_INSTRUCTIONS =
  process.env.MINDEASE_PAYMENT_INSTRUCTIONS ??
  "Payment integration is not configured yet. Admin must share approved manual payment instructions before confirmation.";

function notificationPayload(kind: string, details: Record<string, unknown>) {
  return {
    kind,
    integrationConfigured: false,
    note: "No real email or WhatsApp notification is sent until provider credentials are configured.",
    ...details,
  };
}

async function queuePlaceholderNotification(input: {
  email?: string;
  phone?: string;
  template: string;
  payload: Record<string, unknown>;
}) {
  const recipientEmail = input.email || null;
  const recipientPhone = input.phone || null;
  if (!recipientEmail && !recipientPhone) return;

  await serviceFetch("/rest/v1/notification_queue", {
    method: "POST",
    headers: { prefer: "return=minimal" },
    body: JSON.stringify({
      recipient_email: recipientEmail,
      recipient_phone: recipientPhone,
      channel: recipientPhone ? "whatsapp" : "email",
      template_key: input.template,
      payload: input.payload,
      status: "pending",
    }),
  });
}

export async function PATCH(request: Request) {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "SUPABASE_SERVICE_ROLE_KEY is required to update inquiries." }, 500);
  }

  const admin = await requireAdmin(request);
  if (!admin) {
    return json({ error: "Admin access required." }, 403);
  }

  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" ? body.status : "";
  const suggestedTherapistId =
    typeof body.suggestedTherapistId === "string" && body.suggestedTherapistId
      ? body.suggestedTherapistId
      : null;
  const coordinatorNote =
    typeof body.coordinatorNote === "string" ? body.coordinatorNote.trim() : "";
  const paymentInstructions =
    typeof body.paymentInstructions === "string" && body.paymentInstructions.trim()
      ? body.paymentInstructions.trim()
      : DEFAULT_PAYMENT_INSTRUCTIONS;
  const slotId = typeof body.slotId === "string" && body.slotId ? body.slotId : null;

  if (!id || !["open", "in_progress", "closed", "spam"].includes(status)) {
    return json({ error: "Valid inquiry id and status are required." }, 400);
  }

  const messages = await getRows(
    "contact_messages",
    `id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
  );
  const message = messages[0];
  if (!message) return json({ error: "Inquiry not found." }, 404);

  let assignedTo: string | null = null;
  let therapistName = "";
  let amount = 0;

  if (suggestedTherapistId) {
    const therapists = await getRows(
      "therapists",
      `id=eq.${encodeURIComponent(suggestedTherapistId)}&select=id,user_id,full_name,session_fee,is_active,approval_status&limit=1`,
    );
    const therapist = therapists[0];
    if (!therapist || therapist.is_active !== true || therapist.approval_status !== "approved") {
      return json({ error: "Suggested therapist must be active and approved." }, 400);
    }
    const userId = therapist.user_id;
    assignedTo = typeof userId === "string" ? userId : null;
    therapistName = value(therapist, ["full_name"], "Therapist");
    amount = Number(therapist.session_fee) || 0;
  }

  let scheduledAt: string | null = null;
  if (slotId) {
    const slots = await getRows(
      "availability_slots",
      `id=eq.${encodeURIComponent(slotId)}&select=*&limit=1`,
    );
    const slot = slots[0];
    if (!slot || slot.is_booked === true || slot.approval_status !== "approved" || slot.slot_type === "blocked") {
      return json({ error: "Selected slot is unavailable." }, 400);
    }
    if (suggestedTherapistId && value(slot, ["therapist_id"]) !== suggestedTherapistId) {
      return json({ error: "Selected slot does not belong to the suggested therapist." }, 400);
    }
    scheduledAt = value(slot, ["starts_at"], "");
  }

  const contactResponse = await serviceFetch(
    `/rest/v1/contact_messages?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { prefer: "return=representation" },
      body: JSON.stringify({
        status,
        suggested_therapist_id: suggestedTherapistId,
        assigned_to: assignedTo,
        coordinator_note: coordinatorNote,
      }),
    },
  );
  const contactResult = await contactResponse.json();

  if (!contactResponse.ok) {
    return json({ error: contactResult?.message ?? "Could not update inquiry." }, contactResponse.status);
  }

  const appointmentId = value(message, ["appointment_id"], "");
  let appointment = null;

  if (suggestedTherapistId) {
    const appointmentPayload = {
      therapist_id: suggestedTherapistId,
      therapist_name: therapistName,
      availability_slot_id: slotId,
      scheduled_at: scheduledAt,
      amount,
      payment_instructions: paymentInstructions,
      lifecycle_stage: "therapist_suggested",
      notification_status: "queued",
      status: "requested",
    };

    const appointmentResponse = appointmentId
      ? await serviceFetch(`/rest/v1/appointments?id=eq.${encodeURIComponent(appointmentId)}`, {
          method: "PATCH",
          headers: { prefer: "return=representation" },
          body: JSON.stringify(appointmentPayload),
        })
      : await serviceFetch("/rest/v1/appointments", {
          method: "POST",
          headers: { prefer: "return=representation" },
          body: JSON.stringify({
            ...appointmentPayload,
            contact_message_id: id,
            client_name: value(message, ["name"], "Website visitor"),
            client_email: value(message, ["email"], ""),
            client_phone: value(message, ["phone"], ""),
            concern: value(message, ["message"], "Website inquiry"),
            client_confirmation_token: crypto.randomUUID(),
          }),
        });

    const appointmentResult = await appointmentResponse.json();
    if (!appointmentResponse.ok) {
      return json({ error: appointmentResult?.message ?? "Could not update appointment." }, appointmentResponse.status);
    }
    appointment = Array.isArray(appointmentResult) ? appointmentResult[0] : appointmentResult;

    if (!appointmentId && appointment?.id) {
      await serviceFetch(`/rest/v1/contact_messages?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { prefer: "return=minimal" },
        body: JSON.stringify({ appointment_id: appointment.id }),
      });
    }

    await queuePlaceholderNotification({
      email: value(message, ["email"], ""),
      phone: value(message, ["phone"], ""),
      template: "therapist_suggestion_pending_client_confirmation",
      payload: notificationPayload("therapist_suggestion", {
        appointmentId: appointment?.id,
        therapistName,
        scheduledAt,
      }),
    });
  }

  await writeAuditLog({
    actorId: admin.id,
    action: "inquiry_updated",
    subjectTable: "contact_messages",
    subjectId: id,
    details: {
      status,
      suggestedTherapistId,
      coordinatorNote,
      appointmentId: appointment?.id ?? appointmentId,
      slotId,
    },
  });

  return json({
    inquiry: Array.isArray(contactResult) ? contactResult[0] : contactResult,
    appointment,
  });
}
