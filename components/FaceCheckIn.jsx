"use client";

import { useEffect, useRef, useState } from "react";
import { getFaceDescriptor } from "@/lib/faceApi";

export default function FaceCheckIn() {
  const videoRef = useRef(null);
  const [camOn, setCamOn] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null); // { action, distanceMeters }
  const [today, setToday] = useState(null); // { checkInAt, checkOutAt }

  useEffect(() => {
    loadToday();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadToday() {
    try {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const res = await fetch(`/api/teacher-attendance?month=${month}`);
      const data = await res.json();
      const todayStr = now.toDateString();
      const log = (data.logs || []).find((l) => new Date(l.date).toDateString() === todayStr);
      setToday(log || null);
    } catch {
      // non-fatal — punch button still works without today's summary
    }
  }

  async function startCamera() {
    setError("");
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamOn(true);
    } catch {
      setError("Could not access camera. Check browser permissions.");
    }
  }

  function stopCamera() {
    const stream = videoRef.current?.srcObject;
    stream?.getTracks()?.forEach((t) => t.stop());
    setCamOn(false);
  }

  function getLocation() {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("This browser does not support location access."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () =>
          reject(
            new Error("Could not read your location. Enable location access and try again.")
          ),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }

  // Punch IN needs face + location (camera stays on for it). Punch OUT only
  // needs location, so it never opens the camera or asks for a face match.
  async function punch(action) {
    if (action === "check-out") return punchOutWithLocationOnly();
    return punchInWithFace();
  }

  async function punchInWithFace() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      if (!camOn) await startCamera();
      // Give the camera a moment to actually start streaming frames.
      await new Promise((r) => setTimeout(r, 400));

      setModelsReady(false);
      const [descriptor, location] = await Promise.all([
        getFaceDescriptor(videoRef.current),
        getLocation(),
      ]);
      setModelsReady(true);

      if (!descriptor) {
        setError("No face detected. Face the camera directly in good light and try again.");
        return;
      }

      const res = await fetch("/api/teacher-attendance/face-punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check-in",
          latitude: location.latitude,
          longitude: location.longitude,
          descriptor,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not record attendance");

      setResult({ action: "check-in", distanceMeters: data.distanceMeters });
      stopCamera();
      loadToday();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  // Location-only punch out — no camera, no face descriptor sent.
  async function punchOutWithLocationOnly() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const location = await getLocation();

      const res = await fetch("/api/teacher-attendance/face-punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check-out",
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not record attendance");

      setResult({ action: "check-out", distanceMeters: data.distanceMeters });
      loadToday();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md rounded-sm border border-navy-100 bg-white p-5">
      <h2 className="font-display text-lg text-navy">Face Punch In / Out</h2>
      <p className="mt-1 text-sm text-navy-600">
        Punch In verifies your face and location. Punch Out only checks that you're on the
        school premises — no camera needed.
      </p>

      {today && (
        <div className="mt-4 flex gap-4 text-xs text-navy-500">
          <span>In: {today.checkInAt ? new Date(today.checkInAt).toLocaleTimeString() : "—"}</span>
          <span>Out: {today.checkOutAt ? new Date(today.checkOutAt).toLocaleTimeString() : "—"}</span>
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-sm bg-navy-900">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`h-56 w-full object-cover ${camOn ? "" : "hidden"}`}
        />
        {!camOn && (
          <div className="flex h-56 items-center justify-center text-xs text-navy-300">
            Camera preview appears here
          </div>
        )}
      </div>
      {camOn && busy && !modelsReady && (
        <p className="mt-1 text-xs text-navy-400">Reading your face…</p>
      )}

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => punch("check-in")}
          disabled={busy}
          className="flex-1 rounded-sm bg-navy px-4 py-2.5 text-sm text-white hover:bg-navy-600 disabled:opacity-50"
        >
          {busy ? "Verifying…" : "Punch In"}
        </button>
        <button
          type="button"
          onClick={() => punch("check-out")}
          disabled={busy}
          className="flex-1 rounded-sm bg-brass px-4 py-2.5 text-sm font-medium text-navy hover:bg-brass-600 disabled:opacity-50"
        >
          {busy ? "Checking location…" : "Punch Out"}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-maroon">{error}</p>}
      {result && (
        <p className="mt-4 text-sm text-sage">
          {result.action === "check-in" ? "Checked in" : "Checked out"} successfully
          {typeof result.distanceMeters === "number" ? ` — ${result.distanceMeters}m from school.` : "."}
        </p>
      )}
    </div>
  );
}
