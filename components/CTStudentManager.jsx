"use client";

import { useEffect, useState } from "react";

function currentAcademicYear() {
  const d = new Date();
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

const emptyForm = {
  admissionNumber: "",
  name: "",
  fatherName: "",
  motherName: "",
  section: "A",
  rollNumber: "",
  dob: "",
  gender: "",
  guardianMobile: "",
  address: "",
  academicYear: currentAcademicYear(),
};

export default function CTStudentManager({ classTeacherOf }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function load() {
    setLoading(true);
    fetch(`/api/students?className=${encodeURIComponent(classTeacherOf)}`)
      .then((r) => r.json())
      .then((d) => setStudents(d.students || []))
      .finally(() => setLoading(false));
  }
  useEffect(load, [classTeacherOf]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          className: classTeacherOf,
          rollNumber: form.rollNumber ? Number(form.rollNumber) : undefined,
          dob: form.dob || undefined,
          gender: form.gender || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add student");
      setMessage(`Added ${data.student.name} to ${classTeacherOf}.`);
      setForm({ ...emptyForm, section: form.section, academicYear: form.academicYear });
      load();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <form onSubmit={handleSubmit} className="space-y-3 rounded-sm border border-navy-100 bg-white p-5">
        <h2 className="font-display text-lg text-navy">Add student to {classTeacherOf}</h2>

        <input required placeholder="Admission number" value={form.admissionNumber}
          onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })}
          className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm" />
        <input required placeholder="Full name" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm" />

        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Father's name" value={form.fatherName}
            onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
            className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm" />
          <input placeholder="Mother's name" value={form.motherName}
            onChange={(e) => setForm({ ...form, motherName: e.target.value })}
            className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Section" value={form.section}
            onChange={(e) => setForm({ ...form, section: e.target.value })}
            className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm" />
          <input type="number" placeholder="Roll number" value={form.rollNumber}
            onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
            className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input type="date" value={form.dob}
            onChange={(e) => setForm({ ...form, dob: e.target.value })}
            className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm" />
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm">
            <option value="">Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <input placeholder="Guardian mobile" value={form.guardianMobile}
          onChange={(e) => setForm({ ...form, guardianMobile: e.target.value })}
          className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm" />
        <textarea placeholder="Address" value={form.address} rows={2}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm" />
        <input required placeholder="Academic year (e.g. 2025-26)" value={form.academicYear}
          onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
          className="w-full rounded-sm border border-navy-100 px-3 py-2 text-sm" />

        {message && <p className="text-sm text-navy-600">{message}</p>}

        <button type="submit" disabled={saving}
          className="w-full rounded-sm bg-navy px-5 py-2 text-sm text-ivory hover:bg-navy-600 disabled:opacity-50">
          {saving ? "Saving..." : "Add student"}
        </button>
      </form>

      <div>
        <h2 className="font-display text-lg text-navy">{classTeacherOf} roster</h2>
        <div className="mt-3 divide-y divide-navy-100 rounded-sm border border-navy-100 bg-white">
          {loading && <p className="p-4 text-sm text-navy-400">Loading...</p>}
          {!loading && !students.length && (
            <p className="p-4 text-sm text-navy-400">No students added yet.</p>
          )}
          {students.map((s) => (
            <div key={s._id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <p className="text-navy">{s.name}</p>
                <p className="text-xs text-navy-400">
                  Roll {s.rollNumber ?? "-"} · Section {s.section} · Adm. #{s.admissionNumber}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
