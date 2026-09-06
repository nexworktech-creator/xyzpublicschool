"use client";

import { useEffect, useRef, useState } from "react";
import { getFaceDescriptor } from "@/lib/faceApi";

const CLASS_OPTIONS = [
  "Nursery", "LKG", "UKG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12",
];

const emptyForm = {
  name: "",
  email: "",
  password: "",
  pin: "",
  role: "teacher",
  roleType: "Teacher",
  teacherId: "",
  classTeacherOf: "",
  phone: "",
};

export default function StaffManager() {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [subjectRows, setSubjectRows] = useState([{ subject: "", className: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  // --- Face capture ------------------------------------------------------
  const videoRef = useRef(null);
  const [camOn, setCamOn] = useState(false);
  const [faceImage, setFaceImage] = useState(null); // data URL snapshot
  const [faceDescriptor, setFaceDescriptor] = useState(null); // 128-d array used for matching
  const [faceBusy, setFaceBusy] = useState(false);
  const [faceNote, setFaceNote] = useState("");

  function load() {
    fetch("/api/staff").then((r) => r.json()).then((d) => setStaff(d.staff || []));
  }
  useEffect(load, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamOn(true);
    } catch {
      setError("Could not access camera. Check browser permissions.");
    }
  }

  function stopCamera() {
    const stream = videoRef.current?.srcObject;
    stream?.getTracks()?.forEach((t) => t.stop());
    setCamOn(false);
  }

  async function captureFace() {
    const video = videoRef.current;
    if (!video) return;
    setFaceBusy(true);
    setFaceNote("");
    try {
      // Compute the recognition descriptor from the live video first — it's
      // what "face recognition" attendance actually matches against later.
      const descriptor = await getFaceDescriptor(video);
      if (!descriptor) {
        setFaceNote("No face detected — face the camera directly in good light and try again.");
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
      setFaceImage(canvas.toDataURL("image/jpeg", 0.85));
      setFaceDescriptor(descriptor);
      stopCamera();
    } catch {
      setFaceNote("Could not process the face capture. Try again.");
    } finally {
      setFaceBusy(false);
    }
  }

  function updateSubjectRow(i, key, value) {
    setSubjectRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  }
  function addSubjectRow() {
    setSubjectRows((rows) => [...rows, { subject: "", className: "" }]);
  }
  function removeSubjectRow(i) {
    setSubjectRows((rows) => rows.filter((_, idx) => idx !== i));
  }

  function resetForm() {
    setForm(emptyForm);
    setSubjectRows([{ subject: "", className: "" }]);
    setFaceImage(null);
    setFaceDescriptor(null);
    setFaceNote("");
    setEditingId(null);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        classTeacherOf: form.classTeacherOf || null,
        subjectAssignments: subjectRows.filter((r) => r.subject && r.className),
        faceCaptured: !!faceImage,
        faceImageUrl: faceImage || undefined,
        // Only send a descriptor when a fresh capture happened this session —
        // on edit, leaving this out keeps the previously-saved match data
        // intact (the API never returns the stored descriptor to the client).
        ...(faceDescriptor ? { faceDescriptor } : {}),
      };

      const url = editingId ? `/api/staff/${editingId}` : "/api/staff";
      const method = editingId ? "PATCH" : "POST";
      if (editingId) {
        // Password/PIN are optional on edit — only send if the admin typed one.
        if (!payload.password) delete payload.password;
        if (!payload.pin) delete payload.pin;
        delete payload.email; // email is immutable once created
        delete payload.role;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save account");
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(u) {
    setEditingId(u._id);
    setForm({
      name: u.name,
      email: u.email,
      password: "",
      pin: "",
      role: u.role,
      roleType: u.roleType || "Teacher",
      teacherId: u.teacherId || "",
      classTeacherOf: u.classTeacherOf || "",
      phone: u.phone || "",
    });
    setSubjectRows(u.subjectAssignments?.length ? u.subjectAssignments : [{ subject: "", className: "" }]);
    setFaceImage(u.faceImageUrl || null);
    setFaceDescriptor(null); // previously-saved descriptor isn't returned to the client; recapture to change it
    setFaceNote("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id, hard) {
    if (!confirm(hard ? "Permanently delete this staff record? This cannot be undone." : "Deactivate this staff account?")) return;
    await fetch(`/api/staff/${id}${hard ? "?hard=true" : ""}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <form onSubmit={handleSubmit} className="space-y-3 rounded-sm border border-navy-100 bg-white p-5">
        <h2 className="font-display text-lg text-navy">
          {editingId ? "Edit staff account" : "Add teacher / staff"}
        </h2>

        <input required placeholder="Full name" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm" />

        <input required disabled={!!editingId} type="email" placeholder="Email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm disabled:bg-navy-50" />

        <div className="grid grid-cols-2 gap-3">
          <input type="password" placeholder={editingId ? "New password (optional)" : "System password"}
            required={!editingId} value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm" />
          <input type="text" inputMode="numeric" placeholder="Login PIN (optional)" value={form.pin}
            onChange={(e) => setForm({ ...form, pin: e.target.value })}
            className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm" />
        </div>

        <input placeholder="Unique Teacher ID (auto-generated if left blank)" value={form.teacherId}
          disabled={!!editingId}
          onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
          className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm disabled:bg-navy-50" />

        <input placeholder="Phone" value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm" />

        <div className="grid grid-cols-2 gap-3">
          <select disabled={!!editingId} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm disabled:bg-navy-50">
            <option value="teacher">Portal role: Teacher</option>
            <option value="admin">Portal role: Admin</option>
            <option value="accountant">Portal role: Accountant</option>
            <option value="principal">Portal role: Principal</option>
          </select>
          <select value={form.roleType} onChange={(e) => setForm({ ...form, roleType: e.target.value })}
            className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm">
            <option value="Teacher">Role type: Teacher</option>
            <option value="Accountant">Role type: Accountant</option>
            <option value="Principal">Role type: Principal</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-navy-400">Class Teacher designation</label>
          <select value={form.classTeacherOf} onChange={(e) => setForm({ ...form, classTeacherOf: e.target.value })}
            className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm">
            <option value="">Not a class teacher</option>
            {CLASS_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-navy-400">Subject Teacher assignments</label>
          <div className="space-y-2">
            {subjectRows.map((row, i) => (
              <div key={i} className="flex gap-2">
                <input placeholder="Subject (e.g. Mathematics)" value={row.subject}
                  onChange={(e) => updateSubjectRow(i, "subject", e.target.value)}
                  className="w-1/2 rounded-sm border border-navy-100 px-3 py-2 text-sm" />
                <select value={row.className} onChange={(e) => updateSubjectRow(i, "className", e.target.value)}
                  className="w-1/2 rounded-sm border border-navy-100 px-3 py-2 text-sm">
                  <option value="">Class</option>
                  {CLASS_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <button type="button" onClick={() => removeSubjectRow(i)}
                  className="px-2 text-navy-400 hover:text-maroon">&times;</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addSubjectRow}
            className="mt-2 text-xs text-brass-600 hover:underline">+ Add subject-class mapping</button>
        </div>

        <div className="rounded-sm border border-dashed border-navy-100 p-3">
          <p className="mb-2 text-xs text-navy-400">Face Recognition data (optional)</p>
          {faceImage ? (
            <div className="flex items-center gap-3">
              <img src={faceImage} alt="Captured face" className="h-16 w-16 rounded-sm object-cover" />
              <button type="button" onClick={() => { setFaceImage(null); setFaceDescriptor(null); }} className="text-xs text-maroon">Remove</button>
            </div>
          ) : camOn ? (
            <div className="space-y-2">
              <video ref={videoRef} autoPlay muted className="h-32 w-full rounded-sm bg-navy-900 object-cover" />
              <div className="flex gap-2">
                <button type="button" onClick={captureFace} disabled={faceBusy}
                  className="rounded-sm bg-brass px-3 py-1 text-xs text-navy disabled:opacity-50">
                  {faceBusy ? "Reading face…" : "Capture"}
                </button>
                <button type="button" onClick={stopCamera}
                  className="rounded-sm border border-navy-100 px-3 py-1 text-xs text-navy-600">Cancel</button>
              </div>
              {faceNote && <p className="text-xs text-maroon">{faceNote}</p>}
            </div>
          ) : (
            <button type="button" onClick={startCamera}
              className="rounded-sm border border-navy-100 px-3 py-1.5 text-xs text-navy-600 hover:border-brass">
              Capture &amp; save face data
            </button>
          )}
        </div>

        {error && <p className="text-sm text-maroon">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={saving}
            className="flex-1 rounded-sm bg-navy px-5 py-2 text-sm text-ivory hover:bg-navy-600 disabled:opacity-50">
            {saving ? "Saving..." : editingId ? "Save changes" : "Create account"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm}
              className="rounded-sm border border-navy-100 px-4 py-2 text-sm text-navy-600">Cancel</button>
          )}
        </div>
      </form>

      <div>
        <h2 className="font-display text-lg text-navy">Staff</h2>
        <ul className="mt-3 space-y-2">
          {staff.map((u) => (
            <li key={u._id} className="rounded-sm border border-navy-100 bg-white px-4 py-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-navy">
                    {u.name} <span className="text-navy-400">&middot; {u.roleType || u.role}</span>
                  </p>
                  <p className="text-xs text-navy-400">{u.email} &middot; ID: {u.teacherId || "—"}</p>
                  {u.classTeacherOf && (
                    <p className="text-xs text-navy-400">Class Teacher: {u.classTeacherOf}</p>
                  )}
                  {!!u.subjectAssignments?.length && (
                    <p className="text-xs text-navy-400">
                      Subjects: {u.subjectAssignments.map((a) => `${a.subject} (${a.className})`).join(", ")}
                    </p>
                  )}
                  {u.faceCaptured && <p className="text-xs text-sage">Face data on file</p>}
                  {!u.active && <p className="text-xs text-maroon">Deactivated</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
                  <button onClick={() => startEdit(u)} className="text-brass-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(u._id, false)} className="text-navy-400 hover:underline">Deactivate</button>
                  <button onClick={() => handleDelete(u._id, true)} className="text-maroon hover:underline">Delete permanently</button>
                </div>
              </div>
            </li>
          ))}
          {!staff.length && <p className="text-sm text-navy-400">No staff accounts yet.</p>}
        </ul>
      </div>
    </div>
  );
}
