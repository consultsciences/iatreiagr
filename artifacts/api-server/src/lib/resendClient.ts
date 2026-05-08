import { Resend } from "resend";

interface ConnectorSettings {
  api_key: string;
  from_email?: string;
}

interface ConnectorItem {
  settings: ConnectorSettings;
}

interface ConnectorResponse {
  items?: ConnectorItem[];
}

async function getCredentials(): Promise<{ apiKey: string; fromEmail: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!hostname || !xReplitToken) {
    throw new Error("Resend: missing Replit connector environment variables");
  }

  const resp = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=resend",
    {
      headers: {
        Accept: "application/json",
        "X-Replit-Token": xReplitToken,
      },
    },
  );

  const data = (await resp.json()) as ConnectorResponse;
  const item = data.items?.[0];

  if (!item?.settings?.api_key) {
    throw new Error("Resend not connected — please connect the Resend integration");
  }

  return {
    apiKey: item.settings.api_key,
    fromEmail: item.settings.from_email ?? "noreply@iatreia.gr",
  };
}

export async function getUncachableResendClient(): Promise<{
  client: Resend;
  fromEmail: string;
}> {
  const { apiKey, fromEmail } = await getCredentials();
  return { client: new Resend(apiKey), fromEmail };
}
