"use client";

import { useEffect, useState } from "react";

const CLASS_OPTIONS = [
  "Nursery", "LKG", "UKG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12",
];

const blankSubject = () => ({
  subject: "",
  isNonAcademic: false,
  components: [{ name: "PA-1", maxMarks: 15 }, { name: "Notebook/Copy", maxMarks: 5 }, { name: "Half-Yearly Exam", maxMarks: 80 }],
  gradingOptions: ["A+", "B+", "C+"],
});

export default function ExamConfigForm() {
  const [academicYear, setAcademicYear] = useState("2026-27");
  // Multiple classes can now be selected together — the same subjects/marks
  // below get saved to every selected class in one go instead of repeating
  // this whole form once per class.
  const [selectedClasses, setSelectedClasses] = useState([CLASS_OPTIONS[3]]);
  const [subjects, setSubjects] = useState([blankSubject()]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Prefill from the first selected class's existing config (if any), so
  // editing an already-configured class still works as before.
  useEffect(() => {
    const primaryClass = selectedClasses[0];
    if (!primaryClass) {
      setSubjects([blankSubject()]);
      return;
    }
    fetch(`/api/exam-config?academicYear=${academicYear}&className=${encodeURIComponent(primaryClass)}`)
      .then((r) => r.json())
      .then((d) => {
        const existing = d.examConfigs?.[0];
        setSubjects(existing?.subjects?.length ? existing.subjects : [blankSubject()]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academicYear, selectedClasses[0]]);

  function toggleClass(cls) {
    setSelectedClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    );
  }
  function selectAllClasses() {
    setSelectedClasses(CLASS_OPTIONS);
  }
  function clearClasses() {
    setSelectedClasses([]);
  }

  function updateSubject(i, patch) {
    setSubjects((s) => s.map((sub, idx) => (idx === i ? { ...sub, ...patch } : sub)));
  }
  function updateComponent(i, ci, patch) {
    setSubjects((s) =>
      s.map((sub, idx) =>
        idx === i ? { ...sub, components: sub.components.map((c, cidx) => (cidx === ci ? { ...c, ...patch } : c)) } : sub
      )
    );
  }
  function addComponent(i) {
    setSubjects((s) => s.map((sub, idx) => (idx === i ? { ...sub, components: [...sub.components, { name: "", maxMarks: 0 }] } : sub)));
  }
  function removeComponent(i, ci) {
    setSubjects((s) => s.map((sub, idx) => (idx === i ? { ...sub, components: sub.components.filter((_, cidx) => cidx !== ci) } : sub)));
  }
  function updateGradingOptions(i, text) {
    updateSubject(i, { gradingOptions: text.split(",").map((g) => g.trim()).filter(Boolean) });
  }
  function addSubject() {
    setSubjects((s) => [...s, blankSubject()]);
  }
  function removeSubject(i) {
    setSubjects((s) => s.filter((_, idx) => idx !== i));
  }

  async function save() {
    if (!selectedClasses.length) {
      setMessage("Select at least one class.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/exam-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ academicYear, classNames: selectedClasses, subjects }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not save");
      setMessage(
        selectedClasses.length > 1
          ? `Saved for ${selectedClasses.length} classes.`
          : "Saved."
      );
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-sm border border-navy-100 bg-white p-5">
      <div className="flex flex-wrap items-center gap-3">
        <input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}
          placeholder="Academic year e.g. 2026-27"
          className="rounded-sm border border-navy-100 px-3 py-1.5 text-sm" />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-xs text-navy-400">
            Classes (same subject/marks will be saved to all selected)
          </label>
          <div className="flex gap-2 text-xs">
            <button type="button" onClick={selectAllClasses} className="text-brass-600 hover:underline">
              Select all
            </button>
            <button type="button" onClick={clearClasses} className="text-navy-400 hover:underline">
              Clear
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 rounded-sm border border-navy-100 p-3">
          {CLASS_OPTIONS.map((c) => (
            <label
              key={c}
              className={`flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs cursor-pointer ${
                selectedClasses.includes(c)
                  ? "border-navy bg-navy text-ivory"
                  : "border-navy-100 text-navy-600"
              }`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={selectedClasses.includes(c)}
                onChange={() => toggleClass(c)}
              />
              {c}
            </label>
          ))}
        </div>
        {selectedClasses.length > 1 && (
          <p className="mt-1 text-xs text-navy-400">
            Editing/prefilled from: {selectedClasses[0]} — will overwrite exam config for all {selectedClasses.length} selected classes on save.
          </p>
        )}
      </div>

      {subjects.map((sub, i) => (
        <div key={i} className="rounded-sm border border-navy-100 p-4">
          <div className="flex items-center gap-3">
            <input placeholder="Subject name" value={sub.subject}
              onChange={(e) => updateSubject(i, { subject: e.target.value })}
              className="flex-1 rounded-sm border border-navy-100 px-3 py-1.5 text-sm" />
            <label className="flex items-center gap-1.5 text-xs text-navy-600">
              <input type="checkbox" checked={sub.isNonAcademic}
                onChange={(e) => updateSubject(i, { isNonAcademic: e.target.checked })} />
              Non-academic (grade only)
            </label>
            <button onClick={() => removeSubject(i)} className="text-maroon">&times;</button>
          </div>

          {sub.isNonAcademic ? (
            <div className="mt-3">
              <label className="mb-1 block text-xs text-navy-400">Grading options (comma separated)</label>
              <input value={sub.gradingOptions.join(", ")}
                onChange={(e) => updateGradingOptions(i, e.target.value)}
                placeholder="A+, B+, C+"
                className="w-full rounded-sm border border-navy-100 px-3 py-1.5 text-sm" />
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <label className="mb-1 block text-xs text-navy-400">Mark distribution</label>
              {sub.components.map((c, ci) => (
                <div key={ci} className="flex items-center gap-2">
                  <input placeholder="Component (e.g. PA-1)" value={c.name}
                    onChange={(e) => updateComponent(i, ci, { name: e.target.value })}
                    className="flex-1 rounded-sm border border-navy-100 px-3 py-1.5 text-sm" />
                  <input type="number" placeholder="Marks" value={c.maxMarks}
                    onChange={(e) => updateComponent(i, ci, { maxMarks: Number(e.target.value) })}
                    className="w-24 rounded-sm border border-navy-100 px-3 py-1.5 text-sm" />
                  <button onClick={() => removeComponent(i, ci)} className="text-navy-400 hover:text-maroon">&times;</button>
                </div>
              ))}
              <button onClick={() => addComponent(i)} className="text-xs text-brass-600 hover:underline">+ Add component</button>
              <p className="text-xs text-navy-400">
                Total: {sub.components.reduce((s, c) => s + Number(c.maxMarks || 0), 0)} marks
              </p>
            </div>
          )}
        </div>
      ))}

      <button onClick={addSubject} className="text-sm text-brass-600 hover:underline">+ Add subject</button>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving}
          className="rounded-sm bg-navy px-5 py-2 text-sm text-ivory hover:bg-navy-600 disabled:opacity-50">
          {saving
            ? "Saving..."
            : selectedClasses.length > 1
            ? `Save for ${selectedClasses.length} classes`
            : "Save exam configuration"}
        </button>
        {message && <span className="text-sm text-navy-600">{message}</span>}
      </div>
    </div>
  );
}
