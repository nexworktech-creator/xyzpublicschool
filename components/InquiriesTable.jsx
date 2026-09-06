"use client";

import { useEffect, useState } from "react";

const STATUS_OPTIONS = ["new", "contacted", "visited", "admitted", "closed"];

export default function InquiriesTable() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  function load() {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    fetch(`/api/inquiry${qs}`)
      .then((r) => r.json())
      .then((data) => setInquiries(data.inquiries || []))
      .finally(() => setLoading(false));
  }

  useEffect(load, [filter]);

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
            className={`rounded-sm border px-3 py-1 text-xs capitalize ${filter === s ? "border-navy bg-navy text-ivory" : "border-navy-100 text-navy-600"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-sm border border-navy-100 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Received</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-navy-400">Loading...</td></tr>
            )}
            {!loading && !inquiries.length && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-navy-400">No inquiries yet.</td></tr>
            )}
            {inquiries.map((inq) => (
              <tr key={inq._id} className="border-b border-navy-100 last:border-0">
                <td className="px-4 py-3">{inq.studentOrParentName}</td>
                <td className="px-4 py-3">{inq.classAppliedFor}</td>
                <td className="px-4 py-3">{inq.mobileNumber}</td>
                <td className="px-4 py-3">{inq.area}</td>
                <td className="px-4 py-3 capitalize">{inq.status}</td>
                <td className="px-4 py-3 text-navy-400">
                  {new Date(inq.createdAt).toLocaleDateString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
