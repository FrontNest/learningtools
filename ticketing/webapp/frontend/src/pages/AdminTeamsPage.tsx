import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import {
  createManagedTeam,
  fetchManagedTeams,
  updateManagedTeam,
  type ManagedTeam,
} from "../lib/teamAdminApi";

const TEAM_TYPES = ["REQUESTER_TEAM", "IT_TEAM"] as const;

export function AdminTeamsPage() {
  const [teams, setTeams] = useState<ManagedTeam[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<(typeof TEAM_TYPES)[number]>("REQUESTER_TEAM");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingType, setEditingType] = useState<(typeof TEAM_TYPES)[number]>("REQUESTER_TEAM");

  function load() {
    fetchManagedTeams().then(setTeams).catch(() => setError("Failed to load teams."));
  }

  useEffect(load, []);

  function reportError(err: unknown, fallback: string) {
    setNotice(null);
    setError(isAxiosError(err) ? err.response?.data?.error ?? fallback : fallback);
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    setNotice(null);
    setCreating(true);
    try {
      await createManagedTeam({ name: newName.trim(), type: newType });
      setNewName("");
      setNotice("Team created.");
      load();
    } catch (err) {
      reportError(err, "Failed to create team.");
    } finally {
      setCreating(false);
    }
  }

  function startEditing(team: ManagedTeam) {
    setEditingId(team.id);
    setEditingName(team.name);
    setEditingType(team.type as (typeof TEAM_TYPES)[number]);
  }

  async function saveEditing(team: ManagedTeam) {
    if (!editingName.trim()) return;
    setError(null);
    setNotice(null);
    try {
      await updateManagedTeam(team.id, { name: editingName.trim(), type: editingType });
      setEditingId(null);
      load();
    } catch (err) {
      reportError(err, "Failed to update team.");
    }
  }

  async function toggleActive(team: ManagedTeam) {
    setError(null);
    setNotice(null);
    try {
      await updateManagedTeam(team.id, { active: !team.active });
      load();
    } catch (err) {
      reportError(err, "Failed to update team.");
    }
  }

  return (
    <div className="dashboard-page">
      <header>
        <h1>Manage teams</h1>
        <Link id="nav-back-to-tickets-teams" className="nav-button" data-name="back-to-tickets" to="/">Back to tickets</Link>
      </header>

      <p className="hint">
        Requester teams group requesters (e.g. by department/office) so admins can assign a ticket to
        the whole team; IT teams group Admins who resolve tickets (e.g. Service Desk, L2).
      </p>

      {error && <p className="form-error">{error}</p>}
      {notice && <p className="hint">{notice}</p>}

      <form className="ticket-form" onSubmit={handleCreate}>
        <label htmlFor="new-team-name">New team name</label>
        <input
          id="new-team-name"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="e.g. Sales"
        />
        <label htmlFor="new-team-type">Team type</label>
        <select id="new-team-type" value={newType} onChange={(event) => setNewType(event.target.value as (typeof TEAM_TYPES)[number])}>
          <option value="REQUESTER_TEAM">Requester team</option>
          <option value="IT_TEAM">IT team</option>
        </select>
        <button className="createButton" type="submit" disabled={creating || !newName.trim()}>
          {creating ? "Adding..." : "Add team"}
        </button>
      </form>

      <table className="ticket-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {teams.length === 0 && (
            <tr><td colSpan={4}>No teams yet.</td></tr>
          )}
          {teams.map((team) => {
            const isEditing = editingId === team.id;
            return (
              <tr key={team.id}>
                <td>
                  {isEditing ? (
                    <input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                  ) : (
                    team.name
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <select value={editingType} onChange={(e) => setEditingType(e.target.value as (typeof TEAM_TYPES)[number])}>
                      <option value="REQUESTER_TEAM">Requester team</option>
                      <option value="IT_TEAM">IT team</option>
                    </select>
                  ) : (
                    team.type === "REQUESTER_TEAM" ? "Requester team" : "IT team"
                  )}
                </td>
                <td>{team.active ? "Active" : "Inactive"}</td>
                <td className="admin-action-cell">
                  <div className="admin-action-stack">
                    {isEditing ? (
                      <>
                        <button className="saveButton" onClick={() => saveEditing(team)}>Save</button>
                        <button className="cancelButton" onClick={() => setEditingId(null)}>Cancel</button>
                      </>
                    ) : (
                      <button className="editButton" onClick={() => startEditing(team)}>Edit</button>
                    )}
                    <button className="statusButton" onClick={() => toggleActive(team)}>
                      {team.active ? "Deactivate" : "Activate"}
                    </button>
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
