"use client";

import { useEffect, useState } from "react";

export default function FeeDefaultersList() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [defaultersOnly, setDefaultersOnly] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/fees?defaultersOnly=${defaultersOnly}`)
      .then((r) => r.json())
      .then((d) => setRecords(d.feeRecords || []))
      .finally(() => setLoading(false));
  }, [defaultersOnly]);

  return (
    <div>
      <label className="flex items-center gap-2 text-sm text-navy-600">
        <input type="checkbox" checked={defaultersOnly} onChange={(e) => setDefaultersOnly(e.target.checked)} />
        Show overdue only
      </label>

      <div className="mt-4 overflow-x-auto rounded-sm border border-navy-100 bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Annual fee</th>
              <th className="px-4 py-3">Paid so far</th>
              <th className="px-4 py-3">Months pending</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="px-4 py-6 text-center text-navy-400">Loading...</td></tr>}
            {!loading && !records.length && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-navy-400">No records found.</td></tr>
            )}
            {records.map((r) => {
              const paid = r.installments.reduce((s, i) => s + (i.amountPaid || 0), 0);
              return (
                <tr key={r._id} className="border-b border-navy-100 last:border-0">
                  <td className="px-4 py-3">{r.student?.name}</td>
                  <td className="px-4 py-3">{r.className}</td>
                  <td className="px-4 py-3">₹{r.totalAnnualFee.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">₹{paid.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">
                    {r.pendingMonths > 0 ? (
                      <span className="text-maroon">{r.pendingMonths} month{r.pendingMonths > 1 ? "s" : ""}</span>
                    ) : (
                      <span className="text-navy-400">&mdash;</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.isDefaulter ? (
                      <span className="rounded-sm bg-maroon/10 px-2 py-0.5 text-xs text-maroon">Overdue</span>
                    ) : (
                      <span className="rounded-sm bg-sage/10 px-2 py-0.5 text-xs text-sage">On track</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
