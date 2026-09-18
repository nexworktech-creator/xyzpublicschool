/**
 * Computes totals, percentage and per-subject + overall grade for a result,
 * given the subject marks and a GradeScale document (with `bands` sorted
 * high-to-low or any order — we just find the band that contains the %).
 */
export function computeResult(subjects, gradeScale) {
  // Non-academic (gradeOnly) subjects are graded directly by Admin's
  // grading options, not by marks — they're left out of the marks totals.
  const markedSubjects = subjects.filter((s) => !s.gradeOnly);

  const totalMax = markedSubjects.reduce((sum, s) => sum + Number(s.maxMarks), 0);
  const totalObtained = markedSubjects.reduce((sum, s) => sum + Number(s.marksObtained), 0);
  const percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;

  const findBand = (pct) =>
    gradeScale?.bands?.find((b) => pct >= b.minPercent && pct <= b.maxPercent);

  const gradedSubjects = subjects.map((s) => {
    if (s.gradeOnly) return { ...s, grade: s.gradeOnly };
    const subjectPct = (Number(s.marksObtained) / Number(s.maxMarks)) * 100;
    const band = findBand(subjectPct);
    return { ...s, grade: band?.grade || "-" };
  });

  const overallBand = findBand(percentage);
  const passPercent = gradeScale?.passPercent ?? 33;
  const anySubjectFail = markedSubjects.some(
    (s) => (Number(s.marksObtained) / Number(s.maxMarks)) * 100 < passPercent
  );

  return {
    subjects: gradedSubjects,
    totalMax,
    totalObtained,
    percentage,
    overallGrade: overallBand?.grade || "-",
    result: anySubjectFail || percentage < passPercent ? "fail" : "pass",
  };
}

/**
 * Assigns rankInClass (1-based, dense) to a list of result docs for the same
 * class/section/exam, ordered by percentage descending.
 */
export function assignRanks(results) {
  const sorted = [...results].sort((a, b) => b.percentage - a.percentage);
  return sorted.map((r, idx) => ({ ...r, rankInClass: idx + 1 }));
}
