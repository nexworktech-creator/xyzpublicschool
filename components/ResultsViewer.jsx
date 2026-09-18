"use client";

import { useState } from "react";

export default function ResultsViewer() {
  const [filters, setFilters] = useState({ className: "", section: "", examName: "", academicYear: "" });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    const qs = new URLSearchParams(filters).toString();
    const data = await fetch(`/api/results?${qs}`).then((r) => r.json());
    setResults(data.results || []);
    setLoading(false);
  }

  const qs = new URLSearchParams(filters).toString();

  return (
    <div>
      <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3 rounded-sm border border-navy-100 bg-white p-4">
        {["className", "section", "examName", "academicYear"].map((key) => (
          <div key={key}>
            <label className="mb-1 block text-xs capitalize text-navy-600">{key}</label>
            <input
              value={filters[key]}
              onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
              className="rounded-sm border border-navy-100 px-3 py-1.5 text-sm"
              placeholder={key === "className" ? "Class 10" : key === "section" ? "A" : key === "examName" ? "Final Term" : "2025-26"}
            />
          </div>
        ))}
        <button type="submit" className="rounded-sm bg-navy px-5 py-2 text-sm text-ivory hover:bg-navy-600">
          {loading ? "Loading..." : "Search"}
        </button>
      </form>

      {results.length > 0 && (
        <div className="mt-3 flex gap-3">
          <a href={`/api/results/export/excel?${qs}`} className="text-sm text-navy underline decoration-brass underline-offset-4">
            Download Excel
          </a>
        </div>
      )}

      <div className="mt-5 overflow-x-auto rounded-sm border border-navy-100 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400">
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">%</th>
              <th className="px-4 py-3">Grade</th>
              <th className="px-4 py-3">Result</th>
              <th className="px-4 py-3">Report card</th>
            </tr>
          </thead>
          <tbody>
            {searched && !loading && !results.length && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-navy-400">No results found for these filters.</td></tr>
            )}
            {results.map((r) => (
              <tr key={r._id} className="border-b border-navy-100 last:border-0">
                <td className="px-4 py-3">{r.rankInClass}</td>
                <td className="px-4 py-3">{r.student?.name}</td>
                <td className="px-4 py-3">{r.totalObtained}/{r.totalMax}</td>
                <td className="px-4 py-3">{r.percentage}%</td>
                <td className="px-4 py-3">{r.overallGrade}</td>
                <td className="px-4 py-3 capitalize">{r.result}</td>
                <td className="px-4 py-3">
                  <a href={`/api/results/export/pdf?resultId=${r._id}`} className="text-navy underline decoration-brass underline-offset-4">
                    PDF
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
