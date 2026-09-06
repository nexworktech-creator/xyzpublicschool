import Image from "next/image";

const RANK_LABEL = { 1: "1st", 2: "2nd", 3: "3rd" };

export default function ToppersCorner({ toppers = [] }) {
  const list = toppers.length ? toppers : PLACEHOLDER_TOPPERS;

  return (
    <section id="toppers" className="bg-navy-900 text-ivory">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-sm italic text-brass-200">Academic Year 2025&ndash;26</p>
            <h2 className="mt-1 font-display text-3xl text-ivory sm:text-4xl">Topper&apos;s Corner</h2>
          </div>
          <p className="max-w-sm text-sm text-navy-100/80">
            A place on this board every year for the students whose results speak for themselves.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((t, idx) => (
            <div
              key={t._id || idx}
              className="group relative overflow-hidden rounded-sm border border-brass-400/30 bg-navy-700 p-4 shadow-plaque"
            >
              <span className="absolute right-3 top-3 font-display text-xs text-brass-200">
                {RANK_LABEL[t.rank] || `#${t.rank}`}
              </span>
              <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full border-2 border-brass-400 bg-navy-400">
                {t.photoUrl ? (
                  <Image src={t.photoUrl} alt={t.studentName} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-display text-xl text-brass-200">
                    {t.studentName?.charAt(0)}
                  </div>
                )}
              </div>
              <p className="mt-3 text-center font-display text-base text-ivory">{t.studentName}</p>
              <p className="text-center text-xs text-navy-100/70">{t.className}</p>
              <p className="mt-2 text-center font-display text-lg text-brass-200">{t.percentage}%</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const PLACEHOLDER_TOPPERS = [
  { studentName: "Add your toppers", className: "via Admin Dashboard", rank: 1, percentage: "--" },
  { studentName: "Add your toppers", className: "via Admin Dashboard", rank: 2, percentage: "--" },
  { studentName: "Add your toppers", className: "via Admin Dashboard", rank: 3, percentage: "--" },
  { studentName: "Add your toppers", className: "via Admin Dashboard", rank: 4, percentage: "--" },
];
