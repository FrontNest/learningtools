import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import {
  createManagedCategory,
  fetchManagedCategories,
  updateManagedCategory,
  type ManagedCategory,
} from "../lib/categoryAdminApi";

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ManagedCategory[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState("");
  const [editingName, setEditingName] = useState("");
  const [editingParentId, setEditingParentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function load() {
    fetchManagedCategories().then(setCategories).catch(() => setError("Failed to load categories."));
  }

  useEffect(load, []);

  const categoryNames = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await createManagedCategory({ code: code.trim().toUpperCase(), name: name.trim(), parentId: parentId || null });
      setCode("");
      setName("");
      setParentId("");
      setNotice("Category created.");
      load();
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.error ?? "Failed to create category." : "Failed to create category.");
    }
  }

  function startEditing(category: ManagedCategory) {
    setEditingId(category.id);
    setEditingCode(category.code);
    setEditingName(category.name);
    setEditingParentId(category.parentId ?? "");
    setError(null);
  }

  async function saveEditing(category: ManagedCategory) {
    try {
      await updateManagedCategory(category.id, {
        code: editingCode.trim().toUpperCase(),
        name: editingName.trim(),
        parentId: editingParentId || null,
      });
      setEditingId(null);
      setNotice("Category updated.");
      load();
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.error ?? "Failed to update category." : "Failed to update category.");
    }
  }

  async function toggleActive(category: ManagedCategory) {
    try {
      await updateManagedCategory(category.id, { active: !category.active });
      setNotice(category.active ? "Category deactivated." : "Category activated.");
      load();
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.error ?? "Failed to update category." : "Failed to update category.");
    }
  }

  function parentOptions(currentId: string) {
    return categories.filter((category) => category.id !== currentId);
  }

  return (
    <div className="dashboard-page">
      <header>
        <h1>Manage categories</h1>
        <Link id="nav-back-to-tickets-categories" className="nav-button" data-name="back-to-tickets" to="/">Back to tickets</Link>
      </header>

      {notice && <p className="hint">{notice}</p>}
      {error && <p className="form-error">{error}</p>}

      <h2>New category</h2>
      <form className="ticket-form" onSubmit={handleCreate}>
        <label htmlFor="category-code">Code</label>
        <input id="category-code" required placeholder="e.g. SW.OUTLOOK.LOGIN" value={code} onChange={(event) => setCode(event.target.value)} />
        <label htmlFor="category-name">Name</label>
        <input id="category-name" required value={name} onChange={(event) => setName(event.target.value)} />
        <label htmlFor="category-parent">Parent category</label>
        <select id="category-parent" value={parentId} onChange={(event) => setParentId(event.target.value)}>
          <option value="">Top-level category</option>
          {categories.filter((category) => category.active).map((category) => (
            <option key={category.id} value={category.id}>{category.code} — {category.name}</option>
          ))}
        </select>
        <button className="createButton" type="submit">Create category</button>
      </form>

      <h2>Categories</h2>
      <table className="ticket-table">
        <thead>
          <tr><th>Code</th><th>Name</th><th>Parent</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id}>
              <td>{editingId === category.id ? <input value={editingCode} onChange={(event) => setEditingCode(event.target.value)} /> : category.code}</td>
              <td>{editingId === category.id ? <input value={editingName} onChange={(event) => setEditingName(event.target.value)} /> : category.name}</td>
              <td>
                {editingId === category.id ? (
                  <select value={editingParentId} onChange={(event) => setEditingParentId(event.target.value)}>
                    <option value="">Top-level</option>
                    {parentOptions(category.id).map((parent) => <option key={parent.id} value={parent.id}>{parent.code} — {parent.name}</option>)}
                  </select>
                ) : category.parentId ? categoryNames.get(category.parentId) : "Top-level"}
              </td>
              <td>{category.active ? "Active" : "Inactive"}</td>
              <td className="admin-action-cell">
                <div className="admin-action-stack">
                {editingId === category.id ? (
                  <><button className="saveButton" onClick={() => saveEditing(category)}>Save</button><button className="cancelButton" onClick={() => setEditingId(null)}>Cancel</button></>
                ) : <button className="editButton" onClick={() => startEditing(category)}>Edit</button>}
                <button className="statusButton" onClick={() => toggleActive(category)}>{category.active ? "Deactivate" : "Activate"}</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
