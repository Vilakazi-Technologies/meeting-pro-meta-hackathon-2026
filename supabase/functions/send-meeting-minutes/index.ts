// Sends meeting-minutes email after a transcript is summarised.
// Secrets: RESEND_API_KEY, MEETING_MINUTES_FROM (e.g. Meeting Pro <minutes@yourdomain.com>)
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
const fromAddress = Deno.env.get("MEETING_MINUTES_FROM") ?? "Meeting Pro <onboarding@resend.dev>";

const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

function normalizePhone(p: string): string {
  return p.replace(/\D/g, "");
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const auth = req.headers.get("Authorization");
  const expected = Deno.env.get("MEETING_MINUTES_HOOK_SECRET");
  if (expected && auth !== `Bearer ${expected}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let transcriptId: string;
  try {
    const body = await req.json();
    transcriptId = body.transcript_id;
  } catch {
    return new Response("Bad Request", { status: 400 });
  }
  if (!transcriptId) return new Response("transcript_id required", { status: 400 });

  if (!resendKey) {
    console.warn("send-meeting-minutes: RESEND_API_KEY not set, skipping");
    return Response.json({ sent: false, reason: "no_email_provider" });
  }

  const { data: transcript, error: tErr } = await admin
    .from("transcripts")
    .select("id, title, summary, business_id, call_id")
    .eq("id", transcriptId)
    .maybeSingle();
  if (tErr || !transcript) return Response.json({ sent: false, reason: "transcript_not_found" });

  const { data: call } = await admin
    .from("calls")
    .select("counterparty_phone, started_at, duration_seconds")
    .eq("id", transcript.call_id)
    .maybeSingle();

  const { data: items } = await admin
    .from("action_items")
    .select("text, owner, status")
    .eq("transcript_id", transcriptId)
    .order("created_at", { ascending: true });

  const { data: members } = await admin
    .from("business_members")
    .select("user_id, clerk_user_id, email_minutes_enabled, meeting_minutes_email")
    .eq("business_id", transcript.business_id)
    .eq("email_minutes_enabled", true);

  if (!members?.length) return Response.json({ sent: false, reason: "no_recipients" });

  const clerkSecret = Deno.env.get("CLERK_SECRET_KEY") ?? "";

  async function resolveEmail(m: {
    user_id: string | null;
    clerk_user_id: string | null;
    meeting_minutes_email: string | null;
  }): Promise<string | null> {
    const override = m.meeting_minutes_email?.trim();
    if (override) return override;
    if (m.clerk_user_id && clerkSecret) {
      const res = await fetch(`https://api.clerk.com/v1/users/${m.clerk_user_id}`, {
        headers: { Authorization: `Bearer ${clerkSecret}` },
      });
      if (res.ok) {
        const body = (await res.json()) as {
          email_addresses?: { id: string; email_address: string }[];
          primary_email_address_id?: string;
        };
        const primary = body.email_addresses?.find(
          (e) => e.id === body.primary_email_address_id,
        );
        return primary?.email_address ?? body.email_addresses?.[0]?.email_address ?? null;
      }
    }
    if (m.user_id) {
      const { data: u } = await admin.auth.admin.getUserById(m.user_id);
      if (u?.user?.email) return u.user.email;
    }
    return null;
  }

  const emails: string[] = [];
  for (const m of members) {
    const addr = await resolveEmail(m);
    if (addr) emails.push(addr);
  }
  const uniqueTo = [...new Set(emails)];
  if (!uniqueTo.length) return Response.json({ sent: false, reason: "no_emails" });

  let contactName: string | null = null;
  if (call?.counterparty_phone) {
    const needle = normalizePhone(call.counterparty_phone);
    const { data: contacts } = await admin
      .from("business_contacts")
      .select("display_name, phone")
      .eq("business_id", transcript.business_id);
    const hit = contacts?.find((c) => normalizePhone(c.phone) === needle);
    contactName = hit?.display_name ?? null;
  }

  const title = transcript.title ?? "WhatsApp call";
  const subject = contactName
    ? `Meeting minutes: ${title} (${contactName})`
    : `Meeting minutes: ${title}`;

  const actionHtml =
    items && items.length
      ? `<ul>${items
          .map(
            (i) =>
              `<li><strong>${i.owner ? `${i.owner}: ` : ""}</strong>${i.text}</li>`,
          )
          .join("")}</ul>`
      : "<p><em>No explicit action items were captured on this call.</em></p>";

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 640px; line-height: 1.5;">
      <h1 style="font-size: 20px;">${title}</h1>
      ${contactName ? `<p><strong>Contact:</strong> ${contactName}${call?.counterparty_phone ? ` (${call.counterparty_phone})` : ""}</p>` : ""}
      <h2 style="font-size: 16px;">Summary</h2>
      <p style="white-space: pre-wrap;">${transcript.summary ?? ""}</p>
      <h2 style="font-size: 16px;">Action items</h2>
      ${actionHtml}
      <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
        Generated by Meeting Pro · Lumiq Industries
      </p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to: uniqueTo,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Resend error", errText);
    return Response.json({ sent: false, reason: "resend_failed" }, { status: 502 });
  }

  return Response.json({ sent: true, to: uniqueTo.length });
});
