import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { useAuth } from "../auth/AuthContext";
import {
  createManagedPriority,
  deleteManagedPriority,
  fetchManagedPriorities,
  updateManagedPriority,
  type ManagedPriority,
} from "../lib/priorityAdminApi";
import { fetchManagedStatusLabels, updateManagedStatusLabel, type StatusLabel } from "../lib/statusAdminApi";

export function AdminWorkflowSettingsPage() {
  const { user } = useAuth();
  const [priorities, setPriorities] = useState<ManagedPriority[]>([]);
  const [statuses, setStatuses] = useState<StatusLabel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [newPriorityLabel, setNewPriorityLabel] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingPriorityId, setEditingPriorityId] = useState<string | null>(null);
  const [editingPriorityLabel, setEditingPriorityLabel] = useState("");

  const [editingStatusKey, setEditingStatusKey] = useState<string | null>(null);
  const [editingStatusLabel, setEditingStatusLabel] = useState("");

  function load() {
    fetchManagedPriorities().then(setPriorities).catch(() => setError("Failed to load priorities."));
    fetchManagedStatusLabels().then(setStatuses).catch(() => setError("Failed to load status labels."));
  }

  useEffect(load, []);

  if (!user?.isMaster) {
    return (
      <div className="dashboard-page">
        <p className="form-error">Access restricted to the master administrator.</p>
        <Link className="nav-button" to="/">Back to tickets</Link>
      </div>
    );
  }

  function reportError(err: unknown, fallback: string) {
    setNotice(null);
    setError(isAxiosError(err) ? err.response?.data?.error ?? fallback : fallback);
  }

  async function handleCreatePriority(event: FormEvent) {
    event.preventDefault();
    if (!newPriorityLabel.trim()) return;
    setError(null);
    setNotice(null);
    setCreating(true);
    try {
      await createManagedPriority(newPriorityLabel.trim());
      setNewPriorityLabel("");
      setNotice("Priority created.");
      load();
    } catch (err) {
      reportError(err, "Failed to create priority.");
    } finally {
      setCreating(false);
    }
  }

  function startEditingPriority(priority: ManagedPriority) {
    setEditingPriorityId(priority.id);
    setEditingPriorityLabel(priority.label);
  }

  async function saveEditingPriority(priority: ManagedPriority) {
    if (!editingPriorityLabel.trim()) return;
    setError(null);
    setNotice(null);
    try {
      await updateManagedPriority(priority.id, { label: editingPriorityLabel.trim() });
      setEditingPriorityId(null);
      load();
    } catch (err) {
      reportError(err, "Failed to rename priority.");
    }
  }

  async function togglePriorityActive(priority: ManagedPriority) {
    setError(null);
    setNotice(null);
    try {
      await updateManagedPriority(priority.id, { active: !priority.active });
      load();
    } catch (err) {
      reportError(err, "Failed to update priority.");
    }
  }

  async function movePriority(priority: ManagedPriority, direction: "up" | "down") {
    const sorted = [...priorities].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sorted.findIndex((p) => p.id === priority.id);
    const swapWith = direction === "up" ? sorted[index - 1] : sorted[index + 1];
    if (!swapWith) return;

    setError(null);
    setNotice(null);
    try {
      await Promise.all([
        updateManagedPriority(priority.id, { sortOrder: swapWith.sortOrder }),
        updateManagedPriority(swapWith.id, { sortOrder: priority.sortOrder }),
      ]);
      load();
    } catch (err) {
      reportError(err, "Failed to reorder priorities.");
    }
  }

  async function handleDeletePriority(priority: ManagedPriority) {
    if (!window.confirm(`Permanently delete priority "${priority.label}"? This only works if no ticket uses it.`)) {
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await deleteManagedPriority(priority.id);
      setNotice("Priority deleted.");
      load();
    } catch (err) {
      reportError(err, "Failed to delete priority — it may still be used by existing tickets. Deactivate it instead.");
    }
  }

  function startEditingStatus(status: StatusLabel) {
    setEditingStatusKey(status.key);
    setEditingStatusLabel(status.label);
  }

  async function saveEditingStatus(status: StatusLabel) {
    if (!editingStatusLabel.trim()) return;
    setError(null);
    setNotice(null);
    try {
      await updateManagedStatusLabel(status.key, editingStatusLabel.trim());
      setEditingStatusKey(null);
      load();
    } catch (err) {
      reportError(err, "Failed to rename status.");
    }
  }

  const sortedPriorities = [...priorities].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="dashboard-page">
      <header>
        <h1>Statuses &amp; priorities</h1>
        <Link id="nav-back-to-tickets-workflow-settings" className="nav-button" data-name="back-to-tickets" to="/">Back to tickets</Link>
      </header>

      {error && <p className="form-error">{error}</p>}
      {notice && <p className="hint">{notice}</p>}

      <h2>Priorities</h2>
      <p className="hint">
        Add, rename, reorder, deactivate or delete priorities. Deactivating hides a priority from new
        selections without affecting existing tickets; deleting only works while no ticket uses it.
      </p>
      <form className="ticket-form" onSubmit={handleCreatePriority}>
        <label htmlFor="new-priority-label">New priority name</label>
        <input
          id="new-priority-label"
          value={newPriorityLabel}
          onChange={(event) => setNewPriorityLabel(event.target.value)}
          placeholder="e.g. Urgent"
        />
        <button className="createButton" type="submit" disabled={creating || !newPriorityLabel.trim()}>
          {creating ? "Adding..." : "Add priority"}
        </button>
      </form>

      <table className="ticket-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Key</th>
            <th>Status</th>
            <th>Order</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedPriorities.length === 0 && (
            <tr><td colSpan={5}>No priorities yet.</td></tr>
          )}
          {sortedPriorities.map((priority, index) => {
            const isEditing = editingPriorityId === priority.id;
            return (
              <tr key={priority.id}>
                <td>
                  {isEditing ? (
                    <input value={editingPriorityLabel} onChange={(e) => setEditingPriorityLabel(e.target.value)} />
                  ) : (
                    priority.label
                  )}
                </td>
                <td className="hint">{priority.key}</td>
                <td>{priority.active ? "Active" : "Inactive"}</td>
                <td>
                  <button
                    type="button"
                    className="link-button"
                    disabled={index === 0}
                    onClick={() => movePriority(priority, "up")}
                  >
                    ↑
                  </button>{" "}
                  <button
                    type="button"
                    className="link-button"
                    disabled={index === sortedPriorities.length - 1}
                    onClick={() => movePriority(priority, "down")}
                  >
                    ↓
                  </button>
                </td>
                <td className="admin-action-cell">
                  <div className="admin-action-stack">
                    {isEditing ? (
                      <>
                        <button className="saveButton" onClick={() => saveEditingPriority(priority)}>Save</button>
                        <button className="cancelButton" onClick={() => setEditingPriorityId(null)}>Cancel</button>
                      </>
                    ) : (
                      <button className="editButton" onClick={() => startEditingPriority(priority)}>Edit</button>
                    )}
                    <button className="statusButton" onClick={() => togglePriorityActive(priority)}>
                      {priority.active ? "Deactivate" : "Activate"}
                    </button>
                    <button className="deleteButton" onClick={() => handleDeletePriority(priority)}>Delete</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2>Ticket statuses</h2>
      <p className="hint">
        The 7 status keys and the workflow rules behind them (auto-close, finalization, reopen) are fixed —
        only the displayed name can be changed here.
      </p>
      <table className="ticket-table">
        <thead>
          <tr>
            <th>Key</th>
            <th>Displayed name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {statuses.map((status) => {
            const isEditing = editingStatusKey === status.key;
            return (
              <tr key={status.key}>
                <td className="hint">{status.key}</td>
                <td>
                  {isEditing ? (
                    <input value={editingStatusLabel} onChange={(e) => setEditingStatusLabel(e.target.value)} />
                  ) : (
                    status.label
                  )}
                </td>
                <td className="admin-action-cell">
                  <div className="admin-action-stack">
                    {isEditing ? (
                      <>
                        <button className="saveButton" onClick={() => saveEditingStatus(status)}>Save</button>
                        <button className="cancelButton" onClick={() => setEditingStatusKey(null)}>Cancel</button>
                      </>
                    ) : (
                      <button className="editButton" onClick={() => startEditingStatus(status)}>Edit</button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
