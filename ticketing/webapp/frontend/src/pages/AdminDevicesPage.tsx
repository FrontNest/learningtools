import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import {
  fetchManagedDevices,
  importDeviceInventory,
  syncDeviceInventory,
  type ManagedDevice,
} from "../lib/deviceAdminApi";

export function AdminDevicesPage() {
  const [devices, setDevices] = useState<ManagedDevice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    fetchManagedDevices().then(setDevices).catch(() => setError("Failed to load devices."));
  }

  useEffect(load, []);

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a CSV file first.");
      return;
    }
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const result = await importDeviceInventory(file);
      setNotice(`Inventory imported — ${result.imported} device(s) processed.`);
      load();
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.error ?? "Failed to import inventory." : "Failed to import inventory.");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSync() {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const result = await syncDeviceInventory();
      setNotice(`Inventory re-synced — ${result.imported} device(s) processed.`);
      load();
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.error ?? "Failed to sync inventory." : "Failed to sync inventory.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dashboard-page">
      <header>
        <h1>Device inventory</h1>
        <Link id="nav-back-to-tickets-devices" className="nav-button" data-name="back-to-tickets" to="/">Back to tickets</Link>
      </header>

      <p className="hint">
        Upload the periodic Intune/company device export (same semicolon-delimited CSV format as
        before) to refresh which devices requesters can pick from when creating a ticket, matched by
        their primary user email. "Sync now" re-reads the last uploaded file without a new upload.
      </p>

      {error && <p className="form-error">{error}</p>}
      {notice && <p className="hint">{notice}</p>}

      <div className="ticket-filters">
        <input ref={fileInputRef} type="file" accept=".csv" disabled={busy} />
        <button className="createButton" type="button" disabled={busy} onClick={handleUpload}>
          {busy ? "Working..." : "Upload & sync"}
        </button>
        <button className="statusButton" type="button" disabled={busy} onClick={handleSync}>
          Sync now
        </button>
      </div>

      <table className="ticket-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Primary user</th>
            <th>Model</th>
            <th>OS</th>
            <th>Compliance</th>
            <th>Last check-in</th>
          </tr>
        </thead>
        <tbody>
          {devices.length === 0 && (
            <tr><td colSpan={6}>No devices synced yet.</td></tr>
          )}
          {devices.map((device) => (
            <tr key={device.id}>
              <td>{device.deviceName}{device.serialNumber ? ` (SN ${device.serialNumber})` : ""}</td>
              <td>{device.primaryUserEmail ?? "—"}</td>
              <td>{device.model ?? "—"}</td>
              <td>{device.operatingSystem ?? "—"} {device.osVersion ?? ""}</td>
              <td>{device.complianceState ?? "—"}</td>
              <td>{device.lastCheckIn ? new Date(device.lastCheckIn).toLocaleString() : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
