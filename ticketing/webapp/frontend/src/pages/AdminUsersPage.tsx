import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import {
  createManagedUser,
  deleteManagedUser,
  fetchAllUsers,
  fetchUserManagementAuditLog,
  importUsersCsv,
  resetManagedUserPassword,
  updateManagedUser,
  type ImportResult,
  type ManagedUser,
  type UserManagementAuditEntry,
} from "../lib/userAdminApi";
import { fetchTeams } from "../lib/ticketApi";
import { useAuth } from "../auth/AuthContext";
import type { Team } from "../types/ticket";
import type { Role } from "../types/user";

const ROLES: Role[] = ["REQUESTER", "ADMIN"];

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState<Role>("REQUESTER");
  const [teamId, setTeamId] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState("");
  const [editingName, setEditingName] = useState("");
  const [auditEntries, setAuditEntries] = useState<UserManagementAuditEntry[]>([]);

  function load() {
    fetchAllUsers()
      .then(setUsers)
      .catch(() => setError("Failed to load users."));
  }

  useEffect(() => {
    if (!currentUser?.isMaster) return;
    fetchUserManagementAuditLog().then(setAuditEntries).catch(() => undefined);
  }, [currentUser?.isMaster]);

  useEffect(load, []);
  useEffect(() => {
    fetchTeams().then(setTeams).catch(() => undefined);
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setCreating(true);
    try {
      const { tempPassword, user } = await createManagedUser({
        email,
        displayName,
        department: department || undefined,
        role,
        teamId: teamId || null,
      });
      setNotice(`User ${user.email} created. Temporary password: ${tempPassword}`);
      setEmail("");
      setDisplayName("");
      setDepartment("");
      setRole("REQUESTER");
      setTeamId("");
      load();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message ?? "Failed to create user.");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(user: ManagedUser) {
    try {
      await updateManagedUser(user.id, { active: !user.active });
      load();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message ?? "Failed to update user.");
    }
  }

  async function handleRoleChange(user: ManagedUser, newRole: Role) {
    try {
      await updateManagedUser(user.id, { role: newRole });
      load();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message ?? "Failed to update role.");
    }
  }

  async function handleTeamChange(user: ManagedUser, newTeamId: string) {
    try {
      await updateManagedUser(user.id, { teamId: newTeamId || null });
      load();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message ?? "Failed to update team.");
    }
  }

  async function handleResetPassword(user: ManagedUser) {
    try {
      const { tempPassword } = await resetManagedUserPassword(user.id);
      setNotice(`New temporary password for ${user.email}: ${tempPassword}`);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message ?? "Failed to reset password.");
    }
  }

  async function handleDelete(user: ManagedUser) {
    if (user.isMaster) {
      setError("The master user cannot be deleted.");
      return;
    }
    if (
      !window.confirm(
        `Permanently delete ${user.email}? This will also delete all of this user's tickets, comments, worklogs, attachments and notifications. This cannot be undone.`
      )
    ) {
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await deleteManagedUser(user.id, true);
      setNotice(`${user.email} and its ticket history were deleted.`);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message ?? "Failed to delete user.");
    }
  }

  function startEditing(user: ManagedUser) {
    setEditingUserId(user.id);
    setEditingEmail(user.email);
    setEditingName(user.displayName);
    setError(null);
  }

  async function saveUserDetails(user: ManagedUser) {
    try {
      await updateManagedUser(user.id, { email: editingEmail, displayName: editingName });
      setEditingUserId(null);
      setNotice(`${user.email} details updated.`);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message ?? "Failed to update user details.");
    }
  }

  async function handleImport() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setError(null);
    setImportResult(null);
    try {
      const result = await importUsersCsv(file);
      setImportResult(result);
      load();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message ?? "Failed to import users.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="dashboard-page">
      <header>
        <h1>Manage users</h1>
        <Link id="nav-back-to-tickets-users" className="nav-button" data-name="back-to-tickets" to="/">Back to tickets</Link>
      </header>

      {notice && <p className="hint">{notice}</p>}
      {error && <p className="form-error">{error}</p>}

      <details className="collapsible-section">
        <summary><h2>New user</h2></summary>
        <form className="ticket-form" onSubmit={handleCreate}>
        <label htmlFor="new-email">Email</label>
        <input id="new-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

        <label htmlFor="new-displayName">Display name</label>
        <input
          id="new-displayName"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        <label htmlFor="new-department">Department</label>
        <input id="new-department" value={department} onChange={(e) => setDepartment(e.target.value)} />

        <label htmlFor="new-role">Role</label>
        <select id="new-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <label htmlFor="new-team">Team (optional)</label>
        <select id="new-team" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
          <option value="">None</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <button className="createButton" type="submit" disabled={creating}>
          {creating ? "Creating..." : "Create user"}
        </button>
        </form>
      </details>

      <details className="collapsible-section" open>
        <summary><h2>Users</h2></summary>
        <table className="ticket-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Role</th>
            <th>Team</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const canEditRow = !u.isMaster || currentUser?.isMaster;
            return (
            <tr key={u.id}>
              <td>
                {editingUserId === u.id ? (
                  <input type="email" value={editingEmail} onChange={(e) => setEditingEmail(e.target.value)} />
                ) : (
                  u.email
                )}
              </td>
              <td>
                {editingUserId === u.id ? (
                  <input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                ) : (
                  u.displayName
                )}
              </td>
              <td>
                {canEditRow ? (
                  <select value={u.role} onChange={(e) => handleRoleChange(u, e.target.value as Role)}>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                ) : (
                  u.role
                )}
              </td>
              <td>
                {canEditRow ? (
                  <select value={u.teamId ?? ""} onChange={(e) => handleTeamChange(u, e.target.value)}>
                    <option value="">None</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  u.team?.name ?? "None"
                )}
              </td>
              <td>{u.isMaster ? "Master" : u.active ? "Yes" : "No"}</td>
              <td className="admin-action-cell">
                <div className="admin-action-stack">
                {canEditRow && (
                  editingUserId === u.id ? (
                    <>
                      <button className="saveButton" onClick={() => saveUserDetails(u)}>Save</button>
                      <button className="cancelButton" onClick={() => setEditingUserId(null)}>Cancel</button>
                    </>
                  ) : (
                    <button className="editButton" onClick={() => startEditing(u)}>Edit</button>
                  )
                )}
                {!u.isMaster && (
                  <>
                    <button className="statusButton" onClick={() => handleToggleActive(u)}>{u.active ? "Deactivate" : "Activate"}</button>
                    <button className="resetPasswordButton" onClick={() => handleResetPassword(u)}>Reset password</button>
                    {currentUser?.isMaster && <button className="deleteButton" onClick={() => handleDelete(u)}>Delete</button>}
                  </>
                )}
                </div>
              </td>
            </tr>
            );
          })}
        </tbody>
        </table>
      </details>

      <h2>Bulk import (CSV)</h2>
      <p className="hint">
        Semicolon-delimited: email;displayName;department;jobTitle;role;team. Existing users are
        updated (never their password); new users get a generated temporary password shown below.
      </p>
      <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImport} />
      {importResult && (
        <div className="hint">
          <p>
            Created: {importResult.created.length}, Updated: {importResult.updated.length}, Skipped:{" "}
            {importResult.skipped.length}
          </p>
          {importResult.created.length > 0 && (
            <ul>
              {importResult.created.map((c) => (
                <li key={c.email}>
                  {c.email}: {c.tempPassword}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {currentUser?.isMaster && (
        <details className="collapsible-section">
          <summary><h2>Account activity log (master only)</h2></summary>
          <ul className="audit-list">
            {auditEntries.length === 0 && <li className="hint">No account management activity yet.</li>}
            {auditEntries.map((entry) => (
              <li key={entry.id}>
                <span className="hint">{new Date(entry.createdAt).toLocaleString()}</span>{" "}
                <strong>{entry.actor?.displayName ?? "SYSTEM"}</strong> — {entry.action}
                {entry.oldValue || entry.newValue ? (
                  <span> ({entry.oldValue ?? "—"} → {entry.newValue ?? "—"})</span>
                ) : null}
                {entry.details ? <span className="hint"> — {entry.details}</span> : null}
              </li>
            ))}
          </ul>
        </details>
      )}

    </div>
  );
}
