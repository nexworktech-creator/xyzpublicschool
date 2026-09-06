"use client";

import { useEffect, useState } from "react";

const emptyForm = { heading: "", description: "", eventDate: "", category: "other", embedUrl: "" };

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
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      if (photoFile) {
        mediaItems.push({ type: "image", photoDataUri: await fileToDataUri(photoFile) });
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
      setPhotoFile(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
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
        <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
          className="w-full text-sm" />
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
            <li key={ev._id} className="rounded-sm border border-navy-100 bg-white px-4 py-2 text-sm">
              <p className="text-navy">{ev.heading}</p>
              <p className="text-xs text-navy-400">
                {new Date(ev.eventDate).toLocaleDateString("en-IN")} &middot; {ev.category}
              </p>
            </li>
          ))}
          {!events.length && <p className="text-sm text-navy-400">No events published yet.</p>}
        </ul>
      </div>
    </div>
  );
}
