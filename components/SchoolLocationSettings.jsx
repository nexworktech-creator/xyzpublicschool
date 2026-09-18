"use client";

import { useEffect, useState } from "react";

export default function SchoolLocationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [radiusMeters, setRadiusMeters] = useState(200);
  const [address, setAddress] = useState("");
  const [savedAt, setSavedAt] = useState(null);
  const [shiftStartTime, setShiftStartTime] = useState("08:00");
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(15);
  const [savingTiming, setSavingTiming] = useState(false);
  const [timingMessage, setTimingMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/school-settings");
        const data = await res.json();
        if (data.settings) {
          setLatitude(data.settings.latitude);
          setLongitude(data.settings.longitude);
          setRadiusMeters(data.settings.radiusMeters || 200);
          setAddress(data.settings.address || "");
          setSavedAt(data.settings.updatedAt);
          setShiftStartTime(data.settings.shiftStartTime || "08:00");
          setGracePeriodMinutes(data.settings.gracePeriodMinutes ?? 15);
        }
      } catch {
        setError("Could not load current school location.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function fetchCurrentLocation() {
    setError("");
    setSuccess("");
    if (!("geolocation" in navigator)) {
      setError("This browser does not support location access.");
      return;
    }
    setFetching(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setAccuracy(pos.coords.accuracy);
        setFetching(false);
      },
      (err) => {
        setFetching(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Allow location access in the browser and try again."
            : "Could not fetch current location. Try again from within school premises."
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  async function save() {
    if (latitude == null || longitude == null) {
      setError("Fetch the school's current location first.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/school-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude, radiusMeters, address, shiftStartTime, gracePeriodMinutes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSuccess("School location saved. Teachers can now punch in/out from within this range.");
      setSavedAt(data.settings.updatedAt);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveTiming() {
    setSavingTiming(true);
    setTimingMessage("");
    try {
      const res = await fetch("/api/school-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftStartTime, gracePeriodMinutes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setTimingMessage(
        `Saved. Teachers checking in after ${shiftStartTime} + ${gracePeriodMinutes} min grace will be auto-marked Late.`
      );
    } catch (e) {
      setTimingMessage(e.message);
    } finally {
      setSavingTiming(false);
    }
  }

  if (loading) return <p className="text-sm text-navy-400">Loading…</p>;

  return (
    <>
    <div className="max-w-xl rounded-sm border border-navy-100 bg-white p-5">
      <h2 className="font-display text-lg text-navy">Attendance Geofence</h2>
      <p className="mt-1 text-sm text-navy-600">
        Set the school's location. Teachers can only punch in/out via face recognition when their
        device is within this radius of the school.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={fetchCurrentLocation}
          disabled={fetching}
          className="rounded-sm bg-navy px-4 py-2 text-sm text-white hover:bg-navy-600 disabled:opacity-50"
        >
          {fetching ? "Fetching location…" : "Fetch Current Location"}
        </button>
        {latitude != null && longitude != null && (
          <span className="text-xs text-navy-500">
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
            {accuracy ? ` (±${Math.round(accuracy)}m)` : ""}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-navy-400">
        Open this page on a device physically inside the school before clicking — the browser
        reports wherever the device currently is.
      </p>

      <label className="mt-5 block text-sm text-navy-700">
        School address / landmark (optional)
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="mt-1 w-full rounded-sm border border-navy-100 px-3 py-2 text-sm"
          placeholder="e.g. XYZ Public School, Main Gate"
        />
      </label>

      <label className="mt-5 block text-sm text-navy-700">
        Allowed radius: <span className="font-semibold text-navy">{radiusMeters}m</span>
        <input
          type="range"
          min={100}
          max={1000}
          step={50}
          value={radiusMeters}
          onChange={(e) => setRadiusMeters(Number(e.target.value))}
          className="mt-2 w-full"
        />
        <div className="flex justify-between text-xs text-navy-400">
          <span>100m</span>
          <span>1000m</span>
        </div>
      </label>

      {error && <p className="mt-4 text-sm text-maroon">{error}</p>}
      {success && <p className="mt-4 text-sm text-sage">{success}</p>}
      {savedAt && !success && (
        <p className="mt-4 text-xs text-navy-400">Last saved {new Date(savedAt).toLocaleString()}</p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving || latitude == null}
        className="mt-5 w-full rounded-sm bg-brass px-4 py-2.5 text-sm font-medium text-navy hover:bg-brass-600 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save School Location"}
      </button>
    </div>

    <div className="mt-6 max-w-xl rounded-sm border border-navy-100 bg-white p-5">
      <h2 className="font-display text-lg text-navy">Late Attendance Buffer Time</h2>
      <p className="mt-1 text-sm text-navy-600">
        Set the school's shift start time and a grace period. A teacher whose punch-in falls after
        shift start + grace period is automatically marked <span className="font-medium text-maroon">Late</span>,
        with the late duration logged.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <label className="text-sm text-navy-700">
          Shift start time
          <input
            type="time"
            value={shiftStartTime}
            onChange={(e) => setShiftStartTime(e.target.value)}
            className="mt-1 block rounded-sm border border-navy-100 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm text-navy-700">
          Grace period (minutes)
          <input
            type="number"
            min={0}
            max={120}
            value={gracePeriodMinutes}
            onChange={(e) => setGracePeriodMinutes(Number(e.target.value))}
            className="mt-1 block w-32 rounded-sm border border-navy-100 px-3 py-2 text-sm"
          />
        </label>
      </div>
      <p className="mt-2 text-xs text-navy-400">
        Example: shift starts {shiftStartTime}, grace {gracePeriodMinutes} min &rarr; a check-in at{" "}
        {(() => {
          const [h, m] = shiftStartTime.split(":").map(Number);
          const d = new Date(2000, 0, 1, h, m + Number(gracePeriodMinutes) + 20);
          return d.toTimeString().slice(0, 5);
        })()}{" "}
        would be logged as Late (20 mins).
      </p>

      {timingMessage && <p className="mt-3 text-sm text-sage">{timingMessage}</p>}

      <button
        type="button"
        onClick={saveTiming}
        disabled={savingTiming}
        className="mt-4 rounded-sm bg-navy px-4 py-2 text-sm text-ivory hover:bg-navy-600 disabled:opacity-50"
      >
        {savingTiming ? "Saving…" : "Save Attendance Timing"}
      </button>
    </div>
    </>
  );
}
