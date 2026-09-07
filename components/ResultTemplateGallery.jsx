"use client";

import { useEffect, useState } from "react";
import { RESULT_TEMPLATES } from "@/lib/resultTemplates";

// Sample data used only to preview how each template will look — matches
// the roll no / marks style from the Admin's own mark-sheet (Written 80 +
// Copy 20 columns).
const SAMPLE = {
  student: "Aman",
  rollNo: 1,
  className: "Class 8",
  subjects: [
    { name: "Science", written: 65, copy: 20, grade: "A1" },
    { name: "Maths", written: 58, copy: 18, grade: "A2" },
    { name: "English", written: 51, copy: 9, grade: "B1" },
  ],
};

function fileToDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// A rough HTML/Tailwind approximation of each PDFKit header/table style, so
// Admin can see the shape of the design before picking it — the real
// printed/downloaded PDF is generated server-side from the same template id.
function TemplatePreview({ t, schoolName, logoUrl }) {
  const totalObtained = SAMPLE.subjects.reduce((s, x) => s + x.written + x.copy, 0);
  const totalMax = SAMPLE.subjects.length * 100;

  return (
    <div className="overflow-hidden rounded-sm border border-navy-100 bg-white text-[9px] leading-tight">
      {/* Header */}
      {t.headerStyle === "band" ? (
        <div className="px-2 py-2 text-center text-white" style={{ backgroundColor: t.accent }}>
          <p className="text-[11px] font-bold">{schoolName}</p>
          <p className="text-[7px] opacity-90">{t.description.split(" — ")[0]}</p>
        </div>
      ) : t.headerStyle === "double-border" ? (
        <div className="m-1.5 rounded-sm border-2 p-2 text-center" style={{ borderColor: t.accent }}>
          <div className="rounded-sm border p-1" style={{ borderColor: t.accentSoft }}>
            <p className="text-[11px] font-bold" style={{ color: t.accent }}>{schoolName}</p>
            <p className="text-[7px] text-navy-400">OFFICIAL REPORT CARD</p>
          </div>
        </div>
      ) : t.headerStyle === "plain" ? (
        <div className="border-b px-2 py-2 text-center" style={{ borderColor: t.accent }}>
          <p className="text-[11px] font-bold" style={{ color: t.accent }}>{schoolName}</p>
          <p className="text-[7px] text-navy-400">Report Card</p>
        </div>
      ) : (
        <div className="m-1.5 rounded-sm border p-2 text-center" style={{ borderColor: t.accent }}>
          <p className="text-[11px] font-bold" style={{ color: t.accent }}>{schoolName}</p>
          <p className="text-[7px] text-navy-400">OFFICIAL REPORT CARD</p>
        </div>
      )}

      {/* Student line + optional ribbon */}
      <div className="relative px-2 pt-1">
        {t.showRibbon && (
          <span
            className="absolute right-1 top-0 rounded-sm px-1.5 py-0.5 text-[7px] font-bold text-white"
            style={{ backgroundColor: t.accent }}
          >
            Rank 1 | A1
          </span>
        )}
        <p>{SAMPLE.student} &middot; Roll {SAMPLE.rollNo} &middot; {SAMPLE.className}</p>
      </div>

      {/* Table */}
      <div className="px-2 py-1.5">
        {t.tableStyle === "grid" ? (
          <div className="grid grid-cols-2 gap-1">
            {SAMPLE.subjects.map((s) => (
              <div key={s.name} className="rounded-sm border p-1" style={{ borderColor: t.accent }}>
                <p className="font-semibold" style={{ color: t.accent }}>{s.name}</p>
                <p>{s.written + s.copy}/100 &middot; {s.grade}</p>
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr
                className={t.tableStyle === "striped" ? "text-white" : ""}
                style={t.tableStyle === "striped" ? { backgroundColor: t.accent } : {}}
              >
                <th className="py-0.5 text-left font-semibold">Subject</th>
                <th className="py-0.5 text-right font-semibold">Written(80)</th>
                <th className="py-0.5 text-right font-semibold">Copy(20)</th>
                <th className="py-0.5 text-right font-semibold">Grade</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE.subjects.map((s, i) => (
                <tr
                  key={s.name}
                  className={t.tableStyle === "striped" && i % 2 === 0 ? "bg-navy-50" : ""}
                >
                  <td className="py-0.5">{s.name}</td>
                  <td className="py-0.5 text-right">{s.written}</td>
                  <td className="py-0.5 text-right">{s.copy}</td>
                  <td className="py-0.5 text-right">{s.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="border-t px-2 py-1 text-[8px] font-semibold" style={{ borderColor: t.accentSoft, color: t.accent }}>
        Total {totalObtained}/{totalMax} &middot; Result: PASS
      </div>

      {t.showSignatureBox && (
        <div className="flex justify-between px-2 pb-1.5 pt-3 text-[7px] text-navy-400">
          <span className="border-t border-navy-300 pt-0.5">Class Teacher</span>
          <span className="border-t border-navy-300 pt-0.5">Principal</span>
        </div>
      )}
    </div>
  );
}

export default function ResultTemplateGallery() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({ schoolName: "", phone: "", address: "", affiliation: "" });
  const [logoFile, setLogoFile] = useState(null);
  const [selected, setSelected] = useState("classic-navy");
  const [saving, setSaving] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    fetch("/api/school-settings")
      .then((r) => r.json())
      .then((d) => {
        const s = d.settings;
        setSettings(s);
        if (s) {
          setForm({
            schoolName: s.schoolName || "",
            phone: s.phone || "",
            address: s.address || "",
            affiliation: s.affiliation || "",
          });
          setSelected(s.selectedTemplateId || "classic-navy");
        }
      });
  }, []);

  async function saveSchoolInfo(e) {
    e.preventDefault();
    setSavingInfo(true);
    setNote("");
    try {
      const body = { ...form };
      if (logoFile) body.logoDataUri = await fileToDataUri(logoFile);
      const res = await fetch("/api/school-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setSettings(data.settings);
      setLogoFile(null);
      setNote("School info saved.");
    } catch (err) {
      setNote(err.message);
    } finally {
      setSavingInfo(false);
    }
  }

  async function chooseTemplate(id) {
    setSelected(id);
    setSaving(true);
    try {
      const res = await fetch("/api/school-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedTemplateId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setSettings(data.settings);
    } catch (err) {
      setNote(err.message);
    } finally {
      setSaving(false);
    }
  }

  const previewSchoolName = form.schoolName || "XYZ Public School";

  return (
    <div className="space-y-10">
      <section className="rounded-sm border border-navy-100 bg-white p-5">
        <h2 className="font-display text-lg text-navy">School information</h2>
        <p className="mt-1 text-sm text-navy-600">
          Shown on the header of every printed/downloaded result, whichever template is selected below.
        </p>
        <form onSubmit={saveSchoolInfo} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input placeholder="School name" value={form.schoolName}
            onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
            className="rounded-sm border border-navy-100 px-3 py-2 text-sm" />
          <input placeholder="Contact number" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="rounded-sm border border-navy-100 px-3 py-2 text-sm" />
          <input placeholder="Address" value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="rounded-sm border border-navy-100 px-3 py-2 text-sm sm:col-span-2" />
          <input placeholder="Affiliation / Board (e.g. CBSE Affiliation No. 123456)" value={form.affiliation}
            onChange={(e) => setForm({ ...form, affiliation: e.target.value })}
            className="rounded-sm border border-navy-100 px-3 py-2 text-sm sm:col-span-2" />
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-navy-400">School logo</label>
            <div className="flex items-center gap-3">
              {(settings?.logoUrl || logoFile) && (
                <img
                  src={logoFile ? URL.createObjectURL(logoFile) : settings.logoUrl}
                  alt="School logo"
                  className="h-10 w-10 rounded-sm border border-navy-100 object-contain"
                />
              )}
              <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                className="text-sm" />
            </div>
          </div>
          <button type="submit" disabled={savingInfo}
            className="rounded-sm bg-navy px-5 py-2 text-sm text-ivory hover:bg-navy-600 disabled:opacity-50 sm:col-span-2 sm:w-fit">
            {savingInfo ? "Saving..." : "Save school info"}
          </button>
        </form>
        {note && <p className="mt-2 text-sm text-navy-600">{note}</p>}
      </section>

      <section>
        <h2 className="font-display text-lg text-navy">Choose a result template</h2>
        <p className="mt-1 text-sm text-navy-600">
          Pick one design for every printed/downloaded report card. Sample data below is only a preview —
          real student marks are pulled from Results at print time.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {RESULT_TEMPLATES.map((t) => {
            const isSelected = selected === t.id;
            return (
              <div
                key={t.id}
                className={`rounded-sm border p-3 transition-colors ${
                  isSelected ? "border-brass bg-brass-50" : "border-navy-100 bg-white"
                }`}
              >
                <TemplatePreview t={t} schoolName={previewSchoolName} />
                <p className="mt-2 text-sm font-medium text-navy">{t.name}</p>
                <p className="mt-0.5 text-xs text-navy-400">{t.description}</p>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => chooseTemplate(t.id)}
                  className={`mt-2 w-full rounded-sm px-3 py-1.5 text-xs disabled:opacity-50 ${
                    isSelected
                      ? "bg-brass text-navy"
                      : "border border-navy-100 text-navy-600 hover:border-brass"
                  }`}
                >
                  {isSelected ? "Selected — used for all report cards" : "Use this template"}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
