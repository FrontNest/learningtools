import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import {
  createManagedCategory,
  fetchManagedCategories,
  updateManagedCategory,
  type ManagedCategory,
} from "../lib/categoryAdminApi";

const NEW_OPTION = "__new__";

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ManagedCategory[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState("");
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // The "configure categories" row below builds a Level 1 -> Level 2 -> Level 3
  // chain: existing categories can be picked at each level, or "New category"
  // can be chosen to define a brand new one right there.
  const [rowLevel1, setRowLevel1] = useState("");
  const [rowLevel1Code, setRowLevel1Code] = useState("");
  const [rowLevel1Name, setRowLevel1Name] = useState("");
  const [rowLevel2, setRowLevel2] = useState("");
  const [rowLevel2Code, setRowLevel2Code] = useState("");
  const [rowLevel2Name, setRowLevel2Name] = useState("");
  const [rowLevel3, setRowLevel3] = useState("");
  const [rowLevel3Code, setRowLevel3Code] = useState("");
  const [rowLevel3Name, setRowLevel3Name] = useState("");
  const [rowSaving, setRowSaving] = useState(false);

  function load() {
    fetchManagedCategories().then(setCategories).catch(() => setError("Failed to load categories."));
  }

  useEffect(load, []);

  const level1Categories = useMemo(() => categories.filter((c) => !c.parentId), [categories]);
  const level2Options = useMemo(
    () => (rowLevel1 && rowLevel1 !== NEW_OPTION ? categories.filter((c) => c.parentId === rowLevel1) : []),
    [categories, rowLevel1]
  );
  const level3Options = useMemo(
    () => (rowLevel2 && rowLevel2 !== NEW_OPTION ? categories.filter((c) => c.parentId === rowLevel2) : []),
    [categories, rowLevel2]
  );

  function handleRowLevel1Change(value: string) {
    setRowLevel1(value);
    setRowLevel1Code("");
    setRowLevel1Name("");
    setRowLevel2("");
    setRowLevel2Code("");
    setRowLevel2Name("");
    setRowLevel3("");
    setRowLevel3Code("");
    setRowLevel3Name("");
  }

  function handleRowLevel2Change(value: string) {
    setRowLevel2(value);
    setRowLevel2Code("");
    setRowLevel2Name("");
    setRowLevel3("");
    setRowLevel3Code("");
    setRowLevel3Name("");
  }

  function handleRowLevel3Change(value: string) {
    setRowLevel3(value);
    setRowLevel3Code("");
    setRowLevel3Name("");
  }

  const hasNewLevel = rowLevel1 === NEW_OPTION || rowLevel2 === NEW_OPTION || rowLevel3 === NEW_OPTION;
  const deepestValue = rowLevel3 || rowLevel2 || rowLevel1;
  const deepestExisting = deepestValue && deepestValue !== NEW_OPTION
    ? categories.find((c) => c.id === deepestValue)
    : undefined;

  async function handleConfigureSave(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (rowLevel1 === NEW_OPTION && !rowLevel1Code.trim()) {
      setError("Please provide a code for the new level 1 category.");
      return;
    }
    if (rowLevel1 === NEW_OPTION && !rowLevel1Name.trim()) {
      setError("Please provide a name for the new level 1 category.");
      return;
    }
    if (rowLevel2 === NEW_OPTION && !rowLevel2Code.trim()) {
      setError("Please provide a code for the new level 2 category.");
      return;
    }
    if (rowLevel2 === NEW_OPTION && !rowLevel2Name.trim()) {
      setError("Please provide a name for the new level 2 category.");
      return;
    }
    if (rowLevel3 === NEW_OPTION && !rowLevel3Code.trim()) {
      setError("Please provide a code for the new level 3 category.");
      return;
    }
    if (rowLevel3 === NEW_OPTION && !rowLevel3Name.trim()) {
      setError("Please provide a name for the new level 3 category.");
      return;
    }

    setRowSaving(true);
    try {
      let level1Id = rowLevel1;
      if (rowLevel1 === NEW_OPTION) {
        const created = await createManagedCategory({
          code: rowLevel1Code.trim().toUpperCase(),
          name: rowLevel1Name.trim(),
          parentId: null,
        });
        level1Id = created.id;
        setRowLevel1(created.id);
        load();
      }

      let level2Id = rowLevel2;
      if (rowLevel2 === NEW_OPTION) {
        const created = await createManagedCategory({
          code: rowLevel2Code.trim().toUpperCase(),
          name: rowLevel2Name.trim(),
          parentId: level1Id,
        });
        level2Id = created.id;
        setRowLevel2(created.id);
        load();
      }

      if (rowLevel3 === NEW_OPTION) {
        await createManagedCategory({
          code: rowLevel3Code.trim().toUpperCase(),
          name: rowLevel3Name.trim(),
          parentId: level2Id || null,
        });
      }

      setNotice("Category configuration saved.");
      setRowLevel1(level1Id);
      setRowLevel1Code("");
      setRowLevel1Name("");
      setRowLevel2(level2Id || "");
      setRowLevel2Code("");
      setRowLevel2Name("");
      // Reset the leaf so another sibling leaf can be added quickly under the same group.
      setRowLevel3("");
      setRowLevel3Code("");
      setRowLevel3Name("");
      load();
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.error ?? "Failed to save category." : "Failed to save category.");
    } finally {
      setRowSaving(false);
    }
  }

  function startEditing(category: ManagedCategory) {
    setEditingId(category.id);
    setEditingCode(category.code);
    setEditingName(category.name);
    setError(null);
  }

  async function saveEditing(category: ManagedCategory) {
    try {
      await updateManagedCategory(category.id, {
        code: editingCode.trim().toUpperCase(),
        name: editingName.trim(),
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

  // Plain helper (not a component) so the returned fields stay in the same
  // JSX position across renders — extracting this as a <Component/> would
  // remount the inputs on every keystroke and steal focus.
  function renderCategoryFields(category: ManagedCategory) {
    const isEditing = editingId === category.id;
    return (
      <>
        {isEditing ? (
          <input value={editingCode} onChange={(e) => setEditingCode(e.target.value)} />
        ) : (
          <span>{category.code}</span>
        )}
        {isEditing ? (
          <input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
        ) : (
          <span>{category.name}</span>
        )}
        <span>{category.active ? "Active" : "Inactive"}</span>
        {isEditing ? (
          <>
            <button className="saveButton" onClick={() => saveEditing(category)}>Save</button>
            <button className="cancelButton" onClick={() => setEditingId(null)}>Cancel</button>
          </>
        ) : (
          <button className="editButton" onClick={() => startEditing(category)}>Edit</button>
        )}
        <button className="statusButton" onClick={() => toggleActive(category)}>
          {category.active ? "Deactivate" : "Activate"}
        </button>
      </>
    );
  }

  return (
    <div className="dashboard-page">
      <header>
        <h1>Manage categories</h1>
        <Link id="nav-back-to-tickets-categories" className="nav-button" data-name="back-to-tickets" to="/">Back to tickets</Link>
      </header>

      {notice && <p className="hint">{notice}</p>}
      {error && <p className="form-error">{error}</p>}

      <h2>Configure categories</h2>
      <p className="hint">
        Pick an existing category at each level, or choose "New category" to define one. Level 2
        and Level 3 only become available once their parent level is set.
      </p>
      <form onSubmit={handleConfigureSave}>
        <table className="ticket-table category-config-table">
          <thead>
            <tr>
              <th>Level 1</th>
              <th>Level 2</th>
              <th>Level 3</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <select value={rowLevel1} onChange={(e) => handleRowLevel1Change(e.target.value)}>
                  <option value="">Select...</option>
                  {level1Categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  <option value={NEW_OPTION}>New category...</option>
                </select>
                {rowLevel1 === NEW_OPTION && (
                  <>
                    <input placeholder="Code, e.g. SW" value={rowLevel1Code} onChange={(e) => setRowLevel1Code(e.target.value)} />
                    <input placeholder="Name" value={rowLevel1Name} onChange={(e) => setRowLevel1Name(e.target.value)} />
                  </>
                )}
              </td>
              <td>
                <select value={rowLevel2} onChange={(e) => handleRowLevel2Change(e.target.value)} disabled={!rowLevel1}>
                  <option value="">None</option>
                  {level2Options.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  <option value={NEW_OPTION}>New category...</option>
                </select>
                {rowLevel2 === NEW_OPTION && (
                  <>
                    <input placeholder="Code, e.g. SW.OUTLOOK" value={rowLevel2Code} onChange={(e) => setRowLevel2Code(e.target.value)} />
                    <input placeholder="Name" value={rowLevel2Name} onChange={(e) => setRowLevel2Name(e.target.value)} />
                  </>
                )}
              </td>
              <td>
                <select value={rowLevel3} onChange={(e) => handleRowLevel3Change(e.target.value)} disabled={!rowLevel2}>
                  <option value="">None</option>
                  {level3Options.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  <option value={NEW_OPTION}>New category...</option>
                </select>
                {rowLevel3 === NEW_OPTION && (
                  <>
                    <input placeholder="Code, e.g. SW.OUTLOOK.LOGIN" value={rowLevel3Code} onChange={(e) => setRowLevel3Code(e.target.value)} />
                    <input placeholder="Name" value={rowLevel3Name} onChange={(e) => setRowLevel3Name(e.target.value)} />
                  </>
                )}
              </td>
              <td>
                {deepestExisting ? (deepestExisting.active ? "Active" : "Inactive") : deepestValue === NEW_OPTION ? "Will be Active" : "—"}
              </td>
              <td className="admin-action-cell">
                <div className="admin-action-stack">
                  <button className="createButton" type="submit" disabled={rowSaving || !hasNewLevel}>
                    {rowSaving ? "Saving..." : "Add category"}
                  </button>
                  {deepestExisting && (
                    <button type="button" className="statusButton" onClick={() => toggleActive(deepestExisting)}>
                      {deepestExisting.active ? "Deactivate" : "Activate"}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </form>

      <h2>Categories</h2>
      {level1Categories.length === 0 && <p className="hint">No categories yet.</p>}
      {level1Categories.map((l1) => {
        const level2Children = categories.filter((c) => c.parentId === l1.id);
        return (
          <details key={l1.id} className="collapsible-section category-level-1">
            <summary><h3>{l1.name}</h3></summary>
            <div className="ticket-meta category-node-controls">{renderCategoryFields(l1)}</div>

            {level2Children.length === 0 && <p className="hint category-level-2">No level 2 subcategories yet.</p>}
            {level2Children.map((l2) => {
              const level3Children = categories.filter((c) => c.parentId === l2.id);
              return (
                <details key={l2.id} className="collapsible-section category-level-2">
                  <summary><h4>{l2.name}</h4></summary>
                  <div className="ticket-meta category-node-controls">{renderCategoryFields(l2)}</div>

                  {level3Children.length === 0 ? (
                    <p className="hint category-level-3">No level 3 subcategories yet.</p>
                  ) : (
                    <table className="ticket-table category-leaf-table">
                      <thead>
                        <tr><th>Code</th><th>Name</th><th>Status</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {level3Children.map((l3) => {
                          const isEditing = editingId === l3.id;
                          return (
                            <tr key={l3.id}>
                              <td>
                                {isEditing ? (
                                  <input value={editingCode} onChange={(e) => setEditingCode(e.target.value)} />
                                ) : l3.code}
                              </td>
                              <td>
                                {isEditing ? (
                                  <input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                                ) : l3.name}
                              </td>
                              <td>{l3.active ? "Active" : "Inactive"}</td>
                              <td className="admin-action-cell">
                                <div className="admin-action-stack">
                                  {isEditing ? (
                                    <>
                                      <button className="saveButton" onClick={() => saveEditing(l3)}>Save</button>
                                      <button className="cancelButton" onClick={() => setEditingId(null)}>Cancel</button>
                                    </>
                                  ) : (
                                    <button className="editButton" onClick={() => startEditing(l3)}>Edit</button>
                                  )}
                                  <button className="statusButton" onClick={() => toggleActive(l3)}>
                                    {l3.active ? "Deactivate" : "Activate"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </details>
              );
            })}
          </details>
        );
      })}
    </div>
  );
}
