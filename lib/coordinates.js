export function parseCoordinate(value, min, max) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && value.trim() === "") return null;

  const coordinate = Number(value);
  if (!Number.isFinite(coordinate) || coordinate < min || coordinate > max) return null;
  return coordinate;
}

export function getCoordinatePair(latitude, longitude) {
  const parsedLatitude = parseCoordinate(latitude, -90, 90);
  const parsedLongitude = parseCoordinate(longitude, -180, 180);
  if (parsedLatitude === null || parsedLongitude === null) return null;

  return {
    latitude: parsedLatitude,
    longitude: parsedLongitude,
  };
}
