import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { createTicket, fetchCategories, fetchMyDevices } from "../lib/ticketApi";
import type { Category, DeviceOption, Priority } from "../types/ticket";

const PRIORITIES: Priority[] = ["LOW", "NORMAL", "HIGH", "CRITICAL"];
const OTHER_DEVICE_VALUE = "__other__";
const OTHER_CATEGORY_VALUE = "__other_category__";

export function NewTicketPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [devices, setDevices] = useState<DeviceOption[]>([]);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [topCategoryId, setTopCategoryId] = useState("");
  const [problemCategoryId, setProblemCategoryId] = useState("");
  const [otherCategoryDescription, setOtherCategoryDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("NORMAL");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [otherDeviceDescription, setOtherDeviceDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then((cats) => {
        setCategories(cats);
        const top = cats.find((category) => !category.parentId);
        if (top) {
          setTopCategoryId(top.id);
          const problemCategory = cats.find((category) => category.parentId === top.id);
          setProblemCategoryId(problemCategory?.id ?? top.id);
          setCategoryId(problemCategory?.id ?? top.id);
        }
      })
      .catch(() => setError("Failed to load categories."));

    fetchMyDevices()
      .then((devs) => {
        setDevices(devs);
        setSelectedDeviceId(devs.length > 0 ? devs[0].id : OTHER_DEVICE_VALUE);
      })
      .catch(() => setSelectedDeviceId(OTHER_DEVICE_VALUE));
  }, []);

  const topCategories = categories.filter((category) => !category.parentId);
  const subCategories = categories.filter((category) => category.parentId === topCategoryId);
  const problemSubcategories = categories.filter((category) => category.parentId === problemCategoryId);
  const isOtherCategory = categoryId === OTHER_CATEGORY_VALUE;

  const isOtherDevice = selectedDeviceId === OTHER_DEVICE_VALUE || selectedDeviceId === "";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (isOtherDevice && !otherDeviceDescription.trim()) {
      setError("Please describe the affected device.");
      return;
    }
    if (isOtherCategory && !otherCategoryDescription.trim()) {
      setError("Please describe the category or problem type.");
      return;
    }

    setSubmitting(true);
    try {
      const ticket = await createTicket({
        subject,
        description,
        categoryId: isOtherCategory ? topCategoryId : categoryId,
        otherCategoryDescription: isOtherCategory ? otherCategoryDescription : undefined,
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
      <header>
        <h1>New ticket</h1>
        <h3><Link id="nav-back-to-tickets-new" className="nav-button" data-name="back-to-tickets" to="/">Back to tickets</Link></h3>
      </header>
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

        <label htmlFor="category-level-one">Category</label>
        <select id="category-level-one" required value={topCategoryId} onChange={(e) => {
          const nextTopId = e.target.value;
          const nextProblemCategory = categories.find((category) => category.parentId === nextTopId);
          setTopCategoryId(nextTopId);
          setProblemCategoryId(nextProblemCategory?.id ?? nextTopId);
          setCategoryId(nextProblemCategory?.id ?? nextTopId);
          setOtherCategoryDescription("");
        }}>
          <option value="" disabled>Select a category group</option>
          {topCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>

        <label htmlFor="category-level-two">Problem category</label>
        <select id="category-level-two" required value={isOtherCategory ? OTHER_CATEGORY_VALUE : problemCategoryId} onChange={(e) => {
          const nextProblemCategoryId = e.target.value;
          if (nextProblemCategoryId === OTHER_CATEGORY_VALUE) {
            setCategoryId(OTHER_CATEGORY_VALUE);
            return;
          }
          setProblemCategoryId(nextProblemCategoryId);
          setCategoryId(categories.find((category) => category.parentId === nextProblemCategoryId)?.id ?? nextProblemCategoryId);
          setOtherCategoryDescription("");
        }}>
          <option value="" disabled>Select a problem category</option>
          {subCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          <option value={OTHER_CATEGORY_VALUE}>Other...</option>
        </select>

        {!isOtherCategory && problemSubcategories.length > 0 && <>
          <label htmlFor="category-level-three">Problem subcategory</label>
          <select id="category-level-three" required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {problemSubcategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </>}

        {isOtherCategory && <>
          <label htmlFor="otherCategoryDescription">Describe the problem category</label>
          <input id="otherCategoryDescription" required value={otherCategoryDescription} onChange={(e) => setOtherCategoryDescription(e.target.value)} placeholder="Describe the category or problem type" />
        </>}

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
