import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { changePassword } from "../lib/authApi";
import { useAuth } from "../auth/AuthContext";
import { validatePasswordPolicy, PASSWORD_MIN_LENGTH } from "../constants/passwordPolicy";

export function ChangePasswordPage() {
  const { user, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const policyError = validatePasswordPolicy(newPassword);
    if (policyError) {
      setError(policyError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from the current password.");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      await refresh();
      navigate("/");
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message ?? "Failed to change password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      
      <form className="auth-form" onSubmit={handleSubmit}>
        <header>
          <Link to="/">Back to tickets</Link>
        <h1>Change password</h1>
        </header>
        {user?.mustChangePassword && (
          <p className="hint">
            You must set a new password before continuing (your account was created with a
            temporary one).
          </p>
        )}
        <label htmlFor="currentPassword">Current password</label>
        <input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <label htmlFor="newPassword">New password</label>
        <input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <p className="hint">
          At least {PASSWORD_MIN_LENGTH} characters, with an uppercase and lowercase letter, a
          number, and a special character. Must differ from your current password.
        </p>
        <label htmlFor="confirmPassword">Confirm new password</label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Change password"}
        </button>
        {!user?.mustChangePassword && (
          <button type="button" onClick={() => navigate("/")}>
            Cancel
          </button>
        )}
        <button type="button" onClick={() => logout()}>
          Sign out
        </button>
      </form>
    </div>
  );
}
