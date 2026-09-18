// Late Attendance Buffer Time System — shared by both the manual
// teacher-attendance check-in endpoint and the face-recognition punch-in
// endpoint, so the same grace-period rule applies no matter how the teacher
// checks in.
//
// Rule: if Punch-in Time > (Shift Start Time + Grace Period), status is
// automatically "late" and the late duration (actual time - shift time) is
// calculated and logged.

/**
 * @param {Date} punchInAt - the moment the teacher actually checked in
 * @param {{ shiftStartTime?: string, gracePeriodMinutes?: number }} settings
 * @returns {{ status: "present" | "late", lateMinutes?: number }}
 */
export function computeCheckInStatus(punchInAt, settings) {
  const shiftStartTime = settings?.shiftStartTime || "08:00";
  const gracePeriodMinutes = settings?.gracePeriodMinutes ?? 15;

  const [hh, mm] = shiftStartTime.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return { status: "present" };

  const shiftStart = new Date(punchInAt);
  shiftStart.setHours(hh, mm, 0, 0);

  const cutoff = new Date(shiftStart.getTime() + gracePeriodMinutes * 60000);

  if (punchInAt > cutoff) {
    const lateMinutes = Math.round((punchInAt - shiftStart) / 60000);
    return { status: "late", lateMinutes };
  }
  return { status: "present" };
}
