// Adapter interface so the Intune/Graph device source can be swapped in later
// without touching ticket creation logic or the Device data model.
export interface DeviceProvider {
  // Re-reads the source (CSV/Excel export today, Microsoft Graph later) and
  // upserts Device rows. Returns how many records were processed.
  sync(): Promise<{ imported: number }>;
}
