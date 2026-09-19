import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { createTicket, fetchCategories, fetchMyDevices } from "../lib/ticketApi";
import type { Category, DeviceOption, Priority } from "../types/ticket";

const PRIORITIES: Priority[] = ["LOW", "NORMAL", "HIGH", "CRITICAL"];
const OTHER_DEVICE_VALUE = "__other__";

export function NewTicketPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [devices, setDevices] = useState<DeviceOption[]>([]);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState<Priority>("NORMAL");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [otherDeviceDescription, setOtherDeviceDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then((cats) => {
        setCategories(cats);
        // Prefer a leaf category (one that is not a parent of anything) as default.
        const leaf = cats.find((c) => cats.every((other) => other.parentId !== c.id));
        if (leaf) setCategoryId(leaf.id);
      })
      .catch(() => setError("Failed to load categories."));

    fetchMyDevices()
      .then((devs) => {
        setDevices(devs);
        setSelectedDeviceId(devs.length > 0 ? devs[0].id : OTHER_DEVICE_VALUE);
      })
      .catch(() => setSelectedDeviceId(OTHER_DEVICE_VALUE));
  }, []);

  function categoryLabel(category: Category): string {
    const parent = categories.find((c) => c.id === category.parentId);
    return parent ? `${parent.name} / ${category.name}` : category.name;
  }

  const isOtherDevice = selectedDeviceId === OTHER_DEVICE_VALUE || selectedDeviceId === "";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (isOtherDevice && !otherDeviceDescription.trim()) {
      setError("Please describe the affected device.");
      return;
    }

    setSubmitting(true);
    try {
      const ticket = await createTicket({
        subject,
        description,
        categoryId,
        priority,
        ...(isOtherDevice
          ? { otherDeviceDescription }
          : { deviceId: selectedDeviceId }),
      });
      navigate(`/tickets/${ticket.id}`);
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message ?? "Failed to create ticket.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dashboard-page">
      <h1>New ticket</h1>
      <form className="ticket-form" onSubmit={handleSubmit}>
        <label htmlFor="subject">Subject</label>
        <input id="subject" required value={subject} onChange={(e) => setSubject(e.target.value)} />

        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          required
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label htmlFor="category">Category</label>
        <select id="category" required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="" disabled>
            Select a category
          </option>
          {categories
            .filter((c) => categories.every((other) => other.parentId !== c.id))
            .map((c) => (
              <option key={c.id} value={c.id}>
                {categoryLabel(c)}
              </option>
            ))}
        </select>

        <label htmlFor="priority">Priority</label>
        <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <label htmlFor="device">Affected device</label>
        <select id="device" value={selectedDeviceId} onChange={(e) => setSelectedDeviceId(e.target.value)}>
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.deviceName}
              {d.model ? ` (${d.model})` : ""}
            </option>
          ))}
          <option value={OTHER_DEVICE_VALUE}>Other device...</option>
        </select>

        {isOtherDevice && (
          <>
            <label htmlFor="otherDevice">Describe the device</label>
            <input
              id="otherDevice"
              placeholder="e.g. Dell Latitude 5420, serial ABC123"
              value={otherDeviceDescription}
              onChange={(e) => setOtherDeviceDescription(e.target.value)}
            />
          </>
        )}
        {devices.length === 0 && (
          <p className="hint">
            No devices found for your account — automatic device lookup is not available in this
            standalone deployment yet, please describe the device manually.
          </p>
        )}

        {error && <p className="form-error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create ticket"}
        </button>
      </form>
    </div>
  );
}
