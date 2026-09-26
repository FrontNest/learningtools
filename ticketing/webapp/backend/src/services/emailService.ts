import { decryptSecret } from "../lib/secretCrypto";

let cachedToken: { value: string; expiresAt: number; tenantId: string; clientId: string } | null = null;

async function getAccessToken(tenantId: string, clientId: string, clientSecret: string): Promise<string> {
  if (
    cachedToken &&
    cachedToken.tenantId === tenantId &&
    cachedToken.clientId === clientId &&
    cachedToken.expiresAt > Date.now() + 30_000
  ) {
    return cachedToken.value;
  }

  const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    cachedToken = null;
    throw new Error(`Failed to obtain Graph access token: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000, tenantId, clientId };
  return cachedToken.value;
}

export async function sendGraphEmail(input: {
  tenantId: string;
  clientId: string;
  clientSecretEnc: string;
  senderMailbox: string;
  to: string;
  subject: string;
  body: string;
}): Promise<void> {
  const clientSecret = decryptSecret(input.clientSecretEnc);
  const token = await getAccessToken(input.tenantId, input.clientId, clientSecret);

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(input.senderMailbox)}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject: input.subject,
          body: { contentType: "Text", content: input.body },
          toRecipients: [{ emailAddress: { address: input.to } }],
        },
        saveToSentItems: false,
      }),
    }
  );

  if (!response.ok) {
    cachedToken = null;
    const text = await response.text().catch(() => "");
    throw new Error(`Graph sendMail failed: ${response.status} ${text}`);
  }
}
