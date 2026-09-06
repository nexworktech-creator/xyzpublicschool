"use client";

import { useEffect, useState } from "react";

const CLASS_OPTIONS = [
  "Nursery", "LKG", "UKG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12",
];

function currentAcademicYear() {
  const d = new Date();
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1; // school year starts ~April
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

export default function AccountantFeeManager() {
  const [className, setClassName] = useState(CLASS_OPTIONS[3]);
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [students, setStudents] = useState([]);
  const [feeByStudent, setFeeByStudent] = useState({});
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState({ totalAnnualFee: "", label: "", dueDate: "", amountDue: "", amountPaid: "", mode: "cash" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function load() {
    setLoading(true);
    Promise.all([
      fetch(`/api/students?className=${encodeURIComponent(className)}`).then((r) => r.json()),
      fetch(`/api/fees?className=${encodeURIComponent(className)}&academicYear=${encodeURIComponent(academicYear)}&defaultersOnly=false`).then((r) => r.json()),
    ]).then(([sData, fData]) => {
      setStudents(sData.students || []);
      const map = {};
      (fData.feeRecords || []).forEach((r) => (map[r.student?._id] = r));
      setFeeByStudent(map);
    }).finally(() => setLoading(false));
  }
  useEffect(load, [className, academicYear]);

  function openStudent(s) {
    const existing = feeByStudent[s._id];
    setOpenId(s._id === openId ? null : s._id);
    setForm({
      totalAnnualFee: existing?.totalAnnualFee || "",
      label: "",
      dueDate: "",
      amountDue: existing ? Math.round(existing.totalAnnualFee / 12) : "",
      amountPaid: "",
      mode: "cash",
    });
    setMessage("");
  }

  async function submitMark(studentId, paid) {
    if (!form.label) {
      setMessage("Enter a month/term label first (e.g. \"April\").");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/fees/mark", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student: studentId,
          academicYear,
          className,
          totalAnnualFee: form.totalAnnualFee ? Number(form.totalAnnualFee) : undefined,
          label: form.label,
          dueDate: form.dueDate || undefined,
          amountDue: form.amountDue ? Number(form.amountDue) : undefined,
          paid,
          amountPaid: form.amountPaid ? Number(form.amountPaid) : undefined,
          mode: form.mode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setFeeByStudent((prev) => ({ ...prev, [studentId]: data.feeRecord }));
      setMessage(`Marked "${form.label}" as ${paid ? "Paid" : "Unpaid"}.`);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4 rounded-sm border border-navy-100 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs text-navy-600">Class</label>
          <select value={className} onChange={(e) => setClassName(e.target.value)}
            className="rounded-sm border border-navy-100 px-3 py-1.5 text-sm">
            {CLASS_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-navy-600">Academic Year</label>
          <input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}
            className="w-28 rounded-sm border border-navy-100 px-3 py-1.5 text-sm" />
        </div>
      </div>

      <div className="mt-5 divide-y divide-navy-100 rounded-sm border border-navy-100 bg-white">
        {loading && <p className="p-4 text-sm text-navy-400">Loading students...</p>}
        {!loading && !students.length && (
          <p className="p-4 text-sm text-navy-400">No students found for {className}.</p>
        )}
        {students.map((s) => {
          const record = feeByStudent[s._id];
          const paidSoFar = record?.installments?.reduce((sum, i) => sum + (i.amountPaid || 0), 0) || 0;
          return (
            <div key={s._id} className="p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-navy">{s.name} <span className="text-navy-400">· Roll {s.rollNumber}</span></p>
                  <p className="text-xs text-navy-400">
                    {record ? (
                      <>
                        ₹{paidSoFar.toLocaleString("en-IN")} paid of ₹{record.totalAnnualFee.toLocaleString("en-IN")}
                        {" · "}
                        {record.isDefaulter ? (
                          <span className="text-maroon">{record.pendingMonths} month(s) overdue</span>
                        ) : (
                          <span className="text-sage">On track</span>
                        )}
                      </>
                    ) : (
                      "No fee record yet"
                    )}
                  </p>
                </div>
                <button type="button" onClick={() => openStudent(s)}
                  className="rounded-sm border border-navy-100 px-3 py-1.5 text-xs text-navy-600 hover:border-brass">
                  {openId === s._id ? "Close" : "Mark fee status"}
                </button>
              </div>

              {openId === s._id && (
                <div className="mt-3 rounded-sm border border-dashed border-navy-100 bg-navy-50/40 p-3">
                  <div className="grid gap-2 sm:grid-cols-3">
                    {!record && (
                      <input type="number" placeholder="Total annual fee (₹)" value={form.totalAnnualFee}
                        onChange={(e) => setForm({ ...form, totalAnnualFee: e.target.value })}
                        className="rounded-sm border border-navy-100 px-3 py-1.5 text-sm" />
                    )}
                    <input placeholder='Month/term label (e.g. "April")' value={form.label}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                      className="rounded-sm border border-navy-100 px-3 py-1.5 text-sm" />
                    <input type="date" value={form.dueDate}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                      className="rounded-sm border border-navy-100 px-3 py-1.5 text-sm" />
                    <input type="number" placeholder="Amount due (₹)" value={form.amountDue}
                      onChange={(e) => setForm({ ...form, amountDue: e.target.value })}
                      className="rounded-sm border border-navy-100 px-3 py-1.5 text-sm" />
                    <input type="number" placeholder="Amount paid (if partial)" value={form.amountPaid}
                      onChange={(e) => setForm({ ...form, amountPaid: e.target.value })}
                      className="rounded-sm border border-navy-100 px-3 py-1.5 text-sm" />
                    <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}
                      className="rounded-sm border border-navy-100 px-3 py-1.5 text-sm">
                      <option value="cash">Cash</option>
                      <option value="online">Online</option>
                      <option value="cheque">Cheque</option>
                      <option value="upi">UPI</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" disabled={saving} onClick={() => submitMark(s._id, true)}
                      className="rounded-sm bg-sage px-4 py-1.5 text-xs text-white hover:opacity-90 disabled:opacity-50">
                      Mark Paid
                    </button>
                    <button type="button" disabled={saving} onClick={() => submitMark(s._id, false)}
                      className="rounded-sm bg-maroon px-4 py-1.5 text-xs text-white hover:opacity-90 disabled:opacity-50">
                      Mark Unpaid
                    </button>
                  </div>

                  {!!record?.installments?.length && (
                    <div className="mt-3 space-y-1">
                      {record.installments.map((i, idx) => (
                        <p key={idx} className="text-xs text-navy-600">
                          {i.label}: ₹{i.amountPaid}/{i.amountDue}
                          {i.amountPaid >= i.amountDue ? (
                            <span className="ml-1 text-sage">Paid</span>
                          ) : (
                            <span className="ml-1 text-maroon">Unpaid</span>
                          )}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {message && <p className="mt-3 text-sm text-navy-600">{message}</p>}
    </div>
  );
}
