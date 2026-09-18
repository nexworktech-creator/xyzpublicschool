"use client";

import { useEffect, useState } from "react";

const CLASS_OPTIONS = [
  "Nursery", "LKG", "UKG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
  "Class 11", "Class 12",
];

const initialForm = {
  studentOrParentName: "",
  classAppliedFor: "",
  mobileNumber: "",
  area: "",
};

export default function AdmissionInquiryModal({ triggerClassName, triggerLabel = "Inquiry for Admission" }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function closeAndReset() {
    setOpen(false);
    setTimeout(() => {
      setStatus("idle");
      setForm(initialForm);
      setErrorMsg("");
    }, 200);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          triggerClassName ||
          "inline-flex items-center gap-2 rounded-sm bg-brass px-6 py-3 text-sm font-medium text-navy-900 transition-colors hover:bg-brass-400"
        }
      >
        {triggerLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inquiry-modal-title"
          onClick={(e) => e.target === e.currentTarget && closeAndReset()}
        >
          <div className="relative w-full max-w-md rounded-sm bg-ivory shadow-plaque">
            <div className="flex items-center justify-between border-b border-navy-100 px-6 py-4">
              <h2 id="inquiry-modal-title" className="font-display text-xl text-navy">
                Admission Inquiry
              </h2>
              <button
                type="button"
                onClick={closeAndReset}
                aria-label="Close"
                className="text-navy-400 transition-colors hover:text-maroon"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {status === "success" ? (
              <div className="px-6 py-8 text-center">
                <p className="font-display text-lg text-navy">Thank you.</p>
                <p className="mt-2 text-sm text-navy-600">
                  We&apos;ve received your inquiry and our admissions team will call you shortly.
                </p>
                <button
                  type="button"
                  onClick={closeAndReset}
                  className="mt-6 rounded-sm bg-navy px-5 py-2 text-sm text-ivory transition-colors hover:bg-navy-600"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
                <div>
                  <label htmlFor="classAppliedFor" className="mb-1 block text-sm text-navy-600">
                    Select class
                  </label>
                  <select
                    id="classAppliedFor"
                    required
                    value={form.classAppliedFor}
                    onChange={(e) => setForm({ ...form, classAppliedFor: e.target.value })}
                    className="w-full rounded-sm border border-navy-100 bg-white px-3 py-2 text-sm text-ink focus:border-brass"
                  >
                    <option value="" disabled>
                      Choose a class
                    </option>
                    {CLASS_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="studentOrParentName" className="mb-1 block text-sm text-navy-600">
                    Student / Parent name
                  </label>
                  <input
                    id="studentOrParentName"
                    required
                    value={form.studentOrParentName}
                    onChange={(e) => setForm({ ...form, studentOrParentName: e.target.value })}
                    className="w-full rounded-sm border border-navy-100 bg-white px-3 py-2 text-sm text-ink focus:border-brass"
                    placeholder="e.g. Anjali Sharma"
                  />
                </div>

                <div>
                  <label htmlFor="mobileNumber" className="mb-1 block text-sm text-navy-600">
                    Mobile number
                  </label>
                  <input
                    id="mobileNumber"
                    required
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    title="Enter a 10-digit mobile number"
                    value={form.mobileNumber}
                    onChange={(e) => setForm({ ...form, mobileNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    className="w-full rounded-sm border border-navy-100 bg-white px-3 py-2 text-sm text-ink focus:border-brass"
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div>
                  <label htmlFor="area" className="mb-1 block text-sm text-navy-600">
                    Area / address
                  </label>
                  <input
                    id="area"
                    required
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                    className="w-full rounded-sm border border-navy-100 bg-white px-3 py-2 text-sm text-ink focus:border-brass"
                    placeholder="e.g. Sigra, Varanasi"
                  />
                </div>

                {status === "error" && (
                  <p className="text-sm text-maroon" role="alert">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full rounded-sm bg-brass px-5 py-2.5 text-sm font-medium text-navy-900 transition-colors hover:bg-brass-400 disabled:opacity-60"
                >
                  {status === "submitting" ? "Submitting..." : "Submit Inquiry"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
