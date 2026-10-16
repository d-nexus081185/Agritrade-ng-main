export function normalizeWhatsAppPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  const trimmed = phone.trim();
  const hasInternationalPrefix = trimmed.startsWith("+") || trimmed.startsWith("00");
  let digits = trimmed.replace(/\D/g, "");

  if (trimmed.startsWith("00")) digits = digits.slice(2);
  if (!hasInternationalPrefix && !digits.startsWith("234")) {
    if (digits.startsWith("0") && digits.length === 11) digits = `234${digits.slice(1)}`;
    else if (digits.length === 10) digits = `234${digits}`;
    else return null;
  }

  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

export async function sendWelcomeWhatsApp(phone: string | null | undefined, name: string): Promise<void> {
  const recipient = normalizeWhatsAppPhone(phone);
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const templateName = process.env.WHATSAPP_WELCOME_TEMPLATE;
  const language = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US";
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v23.0";

  if (!recipient || !phoneNumberId || !accessToken || !templateName || !/^v\d+\.\d+$/.test(apiVersion)) return;

  try {
    const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "template",
        template: {
          name: templateName,
          language: { code: language },
          components: [{ type: "body", parameters: [{ type: "text", text: name }] }],
        },
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) console.warn(`[AgriTrade] WhatsApp welcome message failed (HTTP ${response.status}).`);
  } catch (error) {
    console.warn("[AgriTrade] WhatsApp welcome message could not be sent.", error);
  }
}