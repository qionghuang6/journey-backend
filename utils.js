// Calculates the distance between two points [lat lng]
export function distance(pointOne, pointTwo) {
  assert(
    Array.isArray(pointOne) &&
      Array.isArray(pointTwo) &&
      pointOne.length == 2 &&
      pointTwo.length == 2,
    "Violated preconditions of point distance"
  );
  lon1 = (pointOne[1] * Math.PI) / 180;
  lon2 = (pointTwo[1] * Math.PI) / 180;
  lat1 = (pointOne[0] * Math.PI) / 180;
  lat2 = (pointTwo[0] * Math.PI) / 180;

  // Haversine formula
  let dlon = lon2 - lon1;
  let dlat = lat2 - lat1;
  let a =
    Math.pow(Math.sin(dlat / 2), 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlon / 2), 2);

  let c = 2 * Math.asin(Math.sqrt(a));

  // 3956 is the radius of the earth in miles
  return c * 3956;
}

export function assert(condition, message) {
  if (!condition) {
    throw message || "Assertion failed";
  }
}
