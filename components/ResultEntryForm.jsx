"use client";

import { useEffect, useMemo, useState } from "react";

function currentAcademicYear() {
  const d = new Date();
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

// subjectAssignments: [{ subject, className }] — this teacher's Subject
// Teacher assignments, carried on the session token. The Class dropdown
// only ever shows classes from this list, and Subject only ever shows the
// subject(s) this teacher is assigned for the selected class.
export default function ResultEntryForm({ subjectAssignments = [] }) {
  const classOptions = useMemo(
    () => [...new Set(subjectAssignments.map((a) => a.className))],
    [subjectAssignments]
  );

  const [className, setClassName] = useState(classOptions[0] || "");
  const subjectOptions = useMemo(
    () => [...new Set(subjectAssignments.filter((a) => a.className === className).map((a) => a.subject))],
    [subjectAssignments, className]
  );
  const [subject, setSubject] = useState(subjectOptions[0] || "");

  const [section, setSection] = useState("A");
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [examName, setExamName] = useState("");
  const [gradeScales, setGradeScales] = useState([]);
  const [gradeScaleId, setGradeScaleId] = useState("");

  const [subjectConfig, setSubjectConfig] = useState(null); // { isNonAcademic, components, gradingOptions }
  const [students, setStudents] = useState([]);
  const [rows, setRows] = useState({}); // studentId -> { values: {componentName: string}, gradeOnly, enteredByName }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Keep Subject valid whenever Class changes.
  useEffect(() => {
    if (!subjectOptions.includes(subject)) setSubject(subjectOptions[0] || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [className]);

  useEffect(() => {
    fetch("/api/grade-scales").then((r) => r.json()).then((d) => setGradeScales(d.gradeScales || []));
  }, []);

  useEffect(() => {
    if (!className || !subject || !section || !examName || !academicYear) return;
    let cancelled = false;
    setLoading(true);
    setMessage("");

    (async () => {
      try {
        const [configRes, studentsRes, resultsRes] = await Promise.all([
          fetch(`/api/exam-config?academicYear=${encodeURIComponent(academicYear)}&className=${encodeURIComponent(className)}`).then((r) => r.json()),
          fetch(`/api/students?className=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}`).then((r) => r.json()),
          fetch(`/api/results?className=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}&examName=${encodeURIComponent(examName)}&academicYear=${encodeURIComponent(academicYear)}`).then((r) => r.json()),
        ]);
        if (cancelled) return;

        const cfg = configRes.examConfigs?.[0]?.subjects?.find((s) => s.subject === subject) || null;
        setSubjectConfig(cfg);
        setStudents(studentsRes.students || []);

        const resultByStudent = {};
        (resultsRes.results || []).forEach((r) => {
          resultByStudent[r.student?._id || r.student] = r;
        });

        const initialRows = {};
        (studentsRes.students || []).forEach((s) => {
          const existingResult = resultByStudent[s._id];
          const existingSubject = existingResult?.subjects?.find((sub) => sub.subject === subject);
          const values = {};
          (cfg?.components || []).forEach((c) => {
            const match = existingSubject?.components?.find((ec) => ec.name === c.name);
            values[c.name] = match ? String(match.obtained) : "";
          });
          initialRows[s._id] = {
            values,
            gradeOnly: existingSubject?.gradeOnly || "",
            enteredByName: existingSubject?.enteredBy?.name || "",
          };
        });
        setRows(initialRows);
      } catch {
        if (!cancelled) setMessage("Could not load class data. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [className, subject, section, examName, academicYear]);

  function updateValue(studentId, componentName, value) {
    setRows((r) => ({
      ...r,
      [studentId]: { ...r[studentId], values: { ...r[studentId]?.values, [componentName]: value } },
    }));
  }

  function updateGradeOnly(studentId, value) {
    setRows((r) => ({ ...r, [studentId]: { ...r[studentId], gradeOnly: value } }));
  }

  function rowTotal(studentId) {
    const values = rows[studentId]?.values || {};
    return Object.values(values).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }

  const maxTotal = (subjectConfig?.components || []).reduce((sum, c) => sum + Number(c.maxMarks || 0), 0);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const results = await Promise.all(
        students.map(async (s) => {
          const row = rows[s._id] || {};
          const subjectPayload = subjectConfig?.isNonAcademic
            ? { subject, gradeOnly: row.gradeOnly || undefined }
            : {
                subject,
                components: (subjectConfig?.components || []).map((c) => ({
                  name: c.name,
                  maxMarks: c.maxMarks,
                  obtained: Number(row.values?.[c.name]) || 0,
                })),
              };

          const res = await fetch("/api/results", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              student: s._id,
              className,
              section,
              academicYear,
              examName,
              gradeScaleId: gradeScaleId || undefined,
              subjects: [subjectPayload],
            }),
          });
          const data = await res.json();
          return { student: s, ok: res.ok, data };
        })
      );

      const failed = results.filter((r) => !r.ok);
      const lockedElsewhere = results.filter((r) => r.ok && r.data.rejectedSubjects?.length);

      if (!failed.length && !lockedElsewhere.length) {
        setMessage(`Saved marks for ${results.length} student(s).`);
      } else {
        const parts = [];
        if (failed.length) parts.push(`${failed.length} failed to save`);
        if (lockedElsewhere.length)
          parts.push(`${lockedElsewhere.length} already locked by another teacher's entry`);
        setMessage(`Saved with issues: ${parts.join(", ")}.`);
      }
    } catch (err) {
      setMessage(err.message || "Could not save results");
    } finally {
      setSaving(false);
    }
  }

  const components = subjectConfig?.components || [];
  const isNonAcademic = !!subjectConfig?.isNonAcademic;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-sm border border-navy-100 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs text-navy-600">Class</label>
          <select value={className} onChange={(e) => setClassName(e.target.value)}
            className="rounded-sm border border-navy-100 px-3 py-1.5 text-sm">
            {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-navy-600">Subject</label>
          <select value={subject} onChange={(e) => setSubject(e.target.value)}
            className="rounded-sm border border-navy-100 px-3 py-1.5 text-sm">
            {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-navy-600">Section</label>
          <input value={section} onChange={(e) => setSection(e.target.value)}
            className="w-16 rounded-sm border border-navy-100 px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-navy-600">Academic year</label>
          <input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}
            className="w-24 rounded-sm border border-navy-100 px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-navy-600">Exam name</label>
          <input value={examName} onChange={(e) => setExamName(e.target.value)}
            placeholder="e.g. Half-Yearly"
            className="rounded-sm border border-navy-100 px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-navy-600">Grade scale</label>
          <select value={gradeScaleId} onChange={(e) => setGradeScaleId(e.target.value)}
            className="rounded-sm border border-navy-100 px-3 py-1.5 text-sm">
            <option value="">None (percentage only)</option>
            {gradeScales.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
          </select>
        </div>
        <button type="button" onClick={handleSave}
          disabled={saving || loading || !students.length || !examName}
          className="ml-auto rounded-sm bg-navy px-5 py-2 text-sm text-ivory hover:bg-navy-600 disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {message && <p className="text-sm text-navy-600">{message}</p>}

      {!examName && (
        <p className="text-sm text-navy-400">Enter an exam name to load the marks sheet.</p>
      )}

      {examName && loading && <p className="text-sm text-navy-400">Loading class data...</p>}

      {examName && !loading && !isNonAcademic && !components.length && (
        <p className="text-sm text-navy-400">
          No mark distribution set up yet for {subject} in {className} ({academicYear}). Ask
          Admin to set it up in Exam Config first.
        </p>
      )}

      {examName && !loading && (isNonAcademic || components.length > 0) && (
        <div className="overflow-x-auto rounded-sm border border-navy-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50 text-left text-xs text-navy-600">
                <th className="p-2">Roll No</th>
                <th className="p-2">Student Name</th>
                <th className="p-2">{subject}</th>
                {isNonAcademic ? (
                  <th className="p-2">Grade</th>
                ) : (
                  <>
                    {components.map((c) => (
                      <th key={c.name} className="whitespace-nowrap p-2">{c.name} /{c.maxMarks}</th>
                    ))}
                    <th className="whitespace-nowrap p-2">Total /{maxTotal}</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {!students.length && (
                <tr><td colSpan={10} className="p-4 text-center text-navy-400">No students found for this class/section.</td></tr>
              )}
              {students.map((s) => {
                const row = rows[s._id] || { values: {} };
                return (
                  <tr key={s._id} className="border-b border-navy-50">
                    <td className="p-2">{s.rollNumber ?? "-"}</td>
                    <td className="p-2">{s.name}</td>
                    <td className="p-2 text-navy-400">{subject}</td>
                    {isNonAcademic ? (
                      <td className="p-2">
                        <select value={row.gradeOnly || ""} onChange={(e) => updateGradeOnly(s._id, e.target.value)}
                          className="rounded-sm border border-navy-100 px-2 py-1 text-sm">
                          <option value="">—</option>
                          {(subjectConfig?.gradingOptions || []).map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </td>
                    ) : (
                      <>
                        {components.map((c) => (
                          <td key={c.name} className="p-2">
                            <input type="number" min="0" max={c.maxMarks}
                              value={row.values?.[c.name] ?? ""}
                              onChange={(e) => updateValue(s._id, c.name, e.target.value)}
                              className="w-20 rounded-sm border border-navy-100 px-2 py-1 text-sm" />
                          </td>
                        ))}
                        <td className="p-2 font-medium text-navy">{rowTotal(s._id)}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {message === "" && Object.values(rows).some((r) => r.enteredByName) && (
        <p className="text-xs text-navy-400">
          Rows already saved show the previously entered marks — change and hit Save to edit.
        </p>
      )}
    </div>
  );
}
