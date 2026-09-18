"use client";

import { useEffect, useState } from "react";

const STATUS_OPTIONS = ["Pending", "Contacted", "Approved", "Rejected"];

const STATUS_STYLES = {
  Pending: "bg-brass/10 text-brass-600",
  Contacted: "bg-navy/10 text-navy",
  Approved: "bg-sage/10 text-sage",
  Rejected: "bg-maroon/10 text-maroon",
};

export default function InquiriesTable() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  function load() {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    fetch(`/api/inquiry${qs}`)
      .then((r) => r.json())
      .then((data) => setInquiries(data.inquiries || []))
      .finally(() => setLoading(false));
  }

  useEffect(load, [filter]);

  // Update a single inquiry's status in place via AJAX — no page refresh.
  // Optimistically updates the row, then rolls back if the request fails.
  async function updateStatus(id, nextStatus) {
    const previous = inquiries;
    setUpdatingId(id);
    setInquiries((prev) => prev.map((inq) => (inq._id === id ? { ...inq, status: nextStatus } : inq)));

    try {
      const res = await fetch(`/api/inquiry/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Update failed");

      // If a status filter is active and the new status no longer matches,
      // drop the row from view after a short beat instead of yanking it
      // instantly out from under the click.
      if (filter && nextStatus !== filter) {
        setTimeout(() => {
          setInquiries((prev) => prev.filter((inq) => inq._id !== id));
        }, 400);
      }
    } catch {
      setInquiries(previous);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter("")}
          className={`rounded-sm border px-3 py-1 text-xs ${!filter ? "border-navy bg-navy text-ivory" : "border-navy-100 text-navy-600"}`}
        >
          All
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-sm border px-3 py-1 text-xs ${filter === s ? "border-navy bg-navy text-ivory" : "border-navy-100 text-navy-600"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-sm border border-navy-100 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Received</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-navy-400">Loading...</td></tr>
            )}
            {!loading && !inquiries.length && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-navy-400">No inquiries yet.</td></tr>
            )}
            {inquiries.map((inq) => (
              <tr key={inq._id} className="border-b border-navy-100 last:border-0">
                <td className="px-4 py-3">{inq.studentOrParentName}</td>
                <td className="px-4 py-3">{inq.classAppliedFor}</td>
                <td className="px-4 py-3">{inq.mobileNumber}</td>
                <td className="px-4 py-3">{inq.area}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-sm px-2 py-0.5 text-xs ${STATUS_STYLES[inq.status] || "bg-navy-50 text-navy-600"}`}>
                    {inq.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-navy-400">
                  {new Date(inq.createdAt).toLocaleDateString("en-IN")}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={inq.status}
                    disabled={updatingId === inq._id}
                    onChange={(e) => updateStatus(inq._id, e.target.value)}
                    className="rounded-sm border border-navy-100 px-2 py-1 text-xs disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {updatingId === inq._id && (
                    <span className="ml-2 text-xs text-navy-400">Saving…</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
