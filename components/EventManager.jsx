"use client";

import { useEffect, useState } from "react";

const emptyForm = { heading: "", description: "", eventDate: "", category: "other", embedUrl: "" };
const MAX_PHOTOS = 6;

function fileToDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function EventManager() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  // Up to MAX_PHOTOS images per event — they'll auto-rotate as a slideshow
  // on the public Activities & Events card, alongside the video (if any).
  const [photoFiles, setPhotoFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  function handlePhotoPick(fileList) {
    const picked = Array.from(fileList || []).slice(0, MAX_PHOTOS);
    if (fileList && fileList.length > MAX_PHOTOS) {
      setError(`Only the first ${MAX_PHOTOS} photos were kept — that's the max per event.`);
    } else {
      setError("");
    }
    setPhotoFiles(picked);
  }

  function load() {
    fetch("/api/events").then((r) => r.json()).then((d) => setEvents(d.events || []));
  }
  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const mediaItems = [];
      for (const file of photoFiles) {
        mediaItems.push({ type: "image", photoDataUri: await fileToDataUri(file) });
      }
      if (form.embedUrl) {
        mediaItems.push({ type: "video", isEmbed: true, url: form.embedUrl });
      }

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heading: form.heading,
          description: form.description,
          eventDate: form.eventDate,
          category: form.category,
          mediaItems,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setForm(emptyForm);
      setPhotoFiles([]);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Remove this event/activity from the public gallery? This cannot be undone.")) return;
    setDeletingId(id);
    setError("");
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Could not delete event");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <form onSubmit={handleSubmit} className="space-y-3 rounded-sm border border-navy-100 bg-white p-5">
        <h2 className="font-display text-lg text-navy">Add an event</h2>
        <input required placeholder="Heading" value={form.heading}
          onChange={(e) => setForm({ ...form, heading: e.target.value })}
          className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm" />
        <textarea required placeholder="Description" rows={3} value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm" />
        <div className="flex gap-3">
          <input required type="date" value={form.eventDate}
            onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
            className="w-1/2 rounded-sm border border-navy-100 px-3 py-2 text-sm" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-1/2 rounded-sm border border-navy-100 px-3 py-2 text-sm">
            {["sports", "cultural", "academic", "excursion", "celebration", "other"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <input type="file" accept="image/*" multiple
            onChange={(e) => handlePhotoPick(e.target.files)}
            className="w-full text-sm" />
          <p className="mt-1 text-xs text-navy-400">
            Pick up to {MAX_PHOTOS} photos — they auto-play as a slideshow on the public card.
            {photoFiles.length > 0 && ` ${photoFiles.length} selected.`}
          </p>
        </div>
        <input placeholder="Or paste a video embed URL (YouTube, etc.)" value={form.embedUrl}
          onChange={(e) => setForm({ ...form, embedUrl: e.target.value })}
          className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm" />
        {error && <p className="text-sm text-maroon">{error}</p>}
        <button type="submit" disabled={saving}
          className="w-full rounded-sm bg-navy px-5 py-2 text-sm text-ivory hover:bg-navy-600 disabled:opacity-50">
          {saving ? "Saving..." : "Publish event"}
        </button>
      </form>

      <div>
        <h2 className="font-display text-lg text-navy">Published events</h2>
        <ul className="mt-3 space-y-2">
          {events.map((ev) => (
            <li key={ev._id} className="flex items-start justify-between gap-3 rounded-sm border border-navy-100 bg-white px-4 py-2 text-sm">
              <div>
                <p className="text-navy">{ev.heading}</p>
                <p className="text-xs text-navy-400">
                  {new Date(ev.eventDate).toLocaleDateString("en-IN")} &middot; {ev.category}
                </p>
              </div>
              <button type="button" onClick={() => handleDelete(ev._id)} disabled={deletingId === ev._id}
                className="shrink-0 text-xs text-maroon hover:underline disabled:opacity-50">
                {deletingId === ev._id ? "Deleting..." : "Delete"}
              </button>
            </li>
          ))}
          {!events.length && <p className="text-sm text-navy-400">No events published yet.</p>}
        </ul>
      </div>
    </div>
  );
}
