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

// Common subject names offered as quick-pick chips in the bulk grading
// panel — Admin can still add any other subject name by typing it.
const COMMON_SUBJECTS = ["Hindi", "English", "Science", "Maths", "Social Science", "Sanskrit", "Computer", "GK", "EVS"];

export default function ExamConfigForm() {
  const [academicYear, setAcademicYear] = useState("2026-27");
  // Multiple classes can now be selected together — the same subjects/marks
  // below get saved to every selected class in one go instead of repeating
  // this whole form once per class.
  const [selectedClasses, setSelectedClasses] = useState([CLASS_OPTIONS[3]]);
  const [subjects, setSubjects] = useState([blankSubject()]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // --- Multiple Subjects Grade Grouping ------------------------------------
  // When several subjects share the same marking scheme (e.g. Hindi, English
  // and Science all use PA-1/Notebook/Half-Yearly), Admin can multi-select
  // them here and apply one grading rule to all of them in a single click,
  // instead of repeating the same components on every subject row below.
  const [bulkSelectedSubjects, setBulkSelectedSubjects] = useState([]);
  const [bulkCustomSubject, setBulkCustomSubject] = useState("");
  const [bulkIsNonAcademic, setBulkIsNonAcademic] = useState(false);
  const [bulkComponents, setBulkComponents] = useState([
    { name: "PA-1", maxMarks: 15 },
    { name: "Notebook/Copy", maxMarks: 5 },
    { name: "Half-Yearly Exam", maxMarks: 80 },
  ]);
  const [bulkGradingOptions, setBulkGradingOptions] = useState(["A+", "B+", "C+"]);
  const [bulkMessage, setBulkMessage] = useState("");

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

  // --- Bulk grading (multiple subjects at once) ----------------------------
  function toggleBulkSubject(name) {
    setBulkSelectedSubjects((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  }
  function addCustomBulkSubject() {
    const name = bulkCustomSubject.trim();
    if (name && !bulkSelectedSubjects.some((s) => s.toLowerCase() === name.toLowerCase())) {
      setBulkSelectedSubjects((prev) => [...prev, name]);
    }
    setBulkCustomSubject("");
  }
  function updateBulkComponent(ci, patch) {
    setBulkComponents((c) => c.map((comp, idx) => (idx === ci ? { ...comp, ...patch } : comp)));
  }
  function addBulkComponent() {
    setBulkComponents((c) => [...c, { name: "", maxMarks: 0 }]);
  }
  function removeBulkComponent(ci) {
    setBulkComponents((c) => c.filter((_, idx) => idx !== ci));
  }

  // Applies the shared components/grading options above to every selected
  // subject name in one go: updates the subject row if it already exists in
  // the list below, otherwise adds a new row for it.
  function applyBulkGrading() {
    if (!bulkSelectedSubjects.length) {
      setBulkMessage("Select at least one subject first.");
      return;
    }
    setSubjects((prev) => {
      // Drop the single leftover placeholder row (empty name, untouched
      // defaults) so bulk-applying doesn't leave a stray blank subject.
      const cleaned = prev.filter((s) => s.subject.trim() !== "");
      const next = [...cleaned];
      bulkSelectedSubjects.forEach((name) => {
        const entry = {
          subject: name,
          isNonAcademic: bulkIsNonAcademic,
          components: bulkComponents.map((c) => ({ ...c })),
          gradingOptions: [...bulkGradingOptions],
        };
        const idx = next.findIndex((s) => s.subject.trim().toLowerCase() === name.toLowerCase());
        if (idx >= 0) next[idx] = entry;
        else next.push(entry);
      });
      return next.length ? next : [blankSubject()];
    });
    setBulkMessage(
      `Grading rule applied to ${bulkSelectedSubjects.length} subject${bulkSelectedSubjects.length > 1 ? "s" : ""} (${bulkSelectedSubjects.join(", ")}). Scroll down and click Save to persist it.`
    );
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

      <div className="rounded-sm border border-brass-200 bg-brass-50/40 p-4">
        <h3 className="font-display text-sm text-navy">Multiple Subjects Grade Grouping</h3>
        <p className="mt-1 text-xs text-navy-600">
          When several subjects share the same marking scheme, select them all here and apply one
          grading rule in a single click instead of setting each one up separately below.
        </p>

        <div className="mt-3">
          <label className="mb-1.5 block text-xs text-navy-400">Select subjects</label>
          <div className="flex flex-wrap gap-2">
            {[...new Set([...COMMON_SUBJECTS, ...subjects.map((s) => s.subject).filter(Boolean)])].map((name) => (
              <label
                key={name}
                className={`flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs cursor-pointer ${
                  bulkSelectedSubjects.includes(name)
                    ? "border-brass bg-brass text-navy"
                    : "border-navy-100 text-navy-600"
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={bulkSelectedSubjects.includes(name)}
                  onChange={() => toggleBulkSubject(name)}
                />
                {name}
              </label>
            ))}
            {bulkSelectedSubjects
              .filter((s) => ![...COMMON_SUBJECTS, ...subjects.map((x) => x.subject)].includes(s))
              .map((name) => (
                <label
                  key={name}
                  className="flex items-center gap-1.5 rounded-sm border border-brass bg-brass px-2.5 py-1 text-xs cursor-pointer text-navy"
                >
                  <input type="checkbox" className="hidden" checked onChange={() => toggleBulkSubject(name)} />
                  {name}
                </label>
              ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              value={bulkCustomSubject}
              onChange={(e) => setBulkCustomSubject(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomBulkSubject(); } }}
              placeholder="Other subject name"
              className="w-48 rounded-sm border border-navy-100 px-3 py-1.5 text-xs"
            />
            <button type="button" onClick={addCustomBulkSubject} className="text-xs text-brass-600 hover:underline">
              + Add to selection
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-navy-600">
            <input type="checkbox" checked={bulkIsNonAcademic} onChange={(e) => setBulkIsNonAcademic(e.target.checked)} />
            Non-academic (grade only)
          </label>
        </div>

        {bulkIsNonAcademic ? (
          <div className="mt-3">
            <label className="mb-1 block text-xs text-navy-400">Grading options (comma separated)</label>
            <input
              value={bulkGradingOptions.join(", ")}
              onChange={(e) => setBulkGradingOptions(e.target.value.split(",").map((g) => g.trim()).filter(Boolean))}
              placeholder="A+, B+, C+"
              className="w-full rounded-sm border border-navy-100 px-3 py-1.5 text-sm"
            />
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <label className="mb-1 block text-xs text-navy-400">Shared mark distribution</label>
            {bulkComponents.map((c, ci) => (
              <div key={ci} className="flex items-center gap-2">
                <input placeholder="Component (e.g. PA-1)" value={c.name}
                  onChange={(e) => updateBulkComponent(ci, { name: e.target.value })}
                  className="flex-1 rounded-sm border border-navy-100 px-3 py-1.5 text-sm" />
                <input type="number" placeholder="Marks" value={c.maxMarks}
                  onChange={(e) => updateBulkComponent(ci, { maxMarks: Number(e.target.value) })}
                  className="w-24 rounded-sm border border-navy-100 px-3 py-1.5 text-sm" />
                <button onClick={() => removeBulkComponent(ci)} className="text-navy-400 hover:text-maroon">&times;</button>
              </div>
            ))}
            <button onClick={addBulkComponent} className="text-xs text-brass-600 hover:underline">+ Add component</button>
            <p className="text-xs text-navy-400">
              Total: {bulkComponents.reduce((s, c) => s + Number(c.maxMarks || 0), 0)} marks
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={applyBulkGrading}
            className="rounded-sm bg-brass px-4 py-2 text-sm font-medium text-navy hover:bg-brass-600"
          >
            Apply to {bulkSelectedSubjects.length || 0} selected subject{bulkSelectedSubjects.length === 1 ? "" : "s"}
          </button>
          {bulkMessage && <span className="text-xs text-navy-600">{bulkMessage}</span>}
        </div>
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
