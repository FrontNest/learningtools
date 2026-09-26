import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { useAuth } from "../auth/AuthContext";
import { fetchEmailSettings, updateEmailSettings, type EmailSettings } from "../lib/emailSettingsApi";

export function AdminEmailSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [tenantId, setTenantId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [senderMailbox, setSenderMailbox] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function load() {
    fetchEmailSettings()
      .then((data) => {
        setSettings(data);
        setTenantId(data.tenantId ?? "");
        setClientId(data.clientId ?? "");
        setSenderMailbox(data.senderMailbox ?? "");
      })
      .catch(() => setError("Failed to load email settings."));
  }

  useEffect(load, []);

  async function saveDetails(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      const updated = await updateEmailSettings({
        enabled: settings?.enabled ?? false,
        confirm: true,
        tenantId,
        clientId,
        clientSecret: clientSecret || undefined,
        senderMailbox,
      });
      setSettings(updated);
      setClientSecret("");
      setNotice("Email settings saved.");
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.error ?? "Failed to save email settings." : "Failed to save email settings.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled() {
    if (!settings) return;
    const turningOn = !settings.enabled;
    const question = turningOn
      ? "Biztosan be akarja kapcsolni az email küldési funkciót?"
      : "Biztosan ki akarja kapcsolni az email küldési funkciót?";
    if (!window.confirm(question)) return;

    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      const updated = await updateEmailSettings({
        enabled: turningOn,
        confirm: true,
        tenantId,
        clientId,
        clientSecret: clientSecret || undefined,
        senderMailbox,
      });
      setSettings(updated);
      setClientSecret("");
      setNotice(turningOn ? "Email delivery enabled." : "Email delivery disabled.");
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.error ?? "Failed to update email delivery." : "Failed to update email delivery.");
    } finally {
      setSaving(false);
    }
  }

  if (!user?.isMaster) {
    return (
      <div className="dashboard-page">
        <p className="form-error">Access restricted to the master administrator.</p>
        <Link className="nav-button" to="/">Back to tickets</Link>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header>
        <h1>Email delivery settings</h1>
        <Link id="nav-back-to-tickets-email-settings" className="nav-button" data-name="back-to-tickets" to="/">Back to tickets</Link>
      </header>

      <p className="hint">
        Configure delivery via Exchange Online / Microsoft Graph. When disabled, the app behaves
        exactly as before: notifications only appear in-app. Enabling requires all fields below to
        already be filled in and saved.
      </p>

      {notice && <p className="hint">{notice}</p>}
      {error && <p className="form-error">{error}</p>}

      {settings && (
        <p>
          Status: <strong>{settings.enabled ? "Enabled" : "Disabled"}</strong>
          {settings.updatedByEmail && (
            <span className="hint"> — last changed by {settings.updatedByEmail}</span>
          )}
          {" "}
          <button className="statusButton" disabled={saving} onClick={toggleEnabled}>
            {settings.enabled ? "Disable email delivery" : "Enable email delivery"}
          </button>
        </p>
      )}

      <form className="ticket-form" onSubmit={saveDetails}>
        <label htmlFor="email-tenant-id">Entra ID Tenant ID</label>
        <input id="email-tenant-id" value={tenantId} onChange={(e) => setTenantId(e.target.value)} />

        <label htmlFor="email-client-id">App registration Client ID</label>
        <input id="email-client-id" value={clientId} onChange={(e) => setClientId(e.target.value)} />

        <label htmlFor="email-client-secret">Client secret {settings?.hasClientSecret ? "(leave blank to keep current)" : ""}</label>
        <input
          id="email-client-secret"
          type="password"
          value={clientSecret}
          onChange={(e) => setClientSecret(e.target.value)}
          placeholder={settings?.hasClientSecret ? "•••••••• (unchanged)" : ""}
        />

        <label htmlFor="email-sender-mailbox">Sender mailbox</label>
        <input
          id="email-sender-mailbox"
          type="email"
          value={senderMailbox}
          onChange={(e) => setSenderMailbox(e.target.value)}
          placeholder="itsd-notifications@company.example"
        />

        <button className="saveButton" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save details"}
        </button>
      </form>
    </div>
  );
}
