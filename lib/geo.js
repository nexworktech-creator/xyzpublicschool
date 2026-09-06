// Great-circle distance between two lat/lng points, in meters.
// Used to check whether a teacher's punch-in location falls inside the
// school's configured geofence radius.
export function distanceMeters(lat1, lng1, lat2, lng2) {
  if (
    [lat1, lng1, lat2, lng2].some(
      (v) => typeof v !== "number" || Number.isNaN(v)
    )
  ) {
    return Infinity;
  }
  const R = 6371000; // Earth radius in meters
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Euclidean distance between two face-descriptor vectors (128-d from
// face-api.js). Lower = more similar. ~0.6 is the commonly used match
// threshold for face-api.js's faceRecognitionNet.
export function descriptorDistance(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return Infinity;
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}
