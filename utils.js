// Calculates the distance between two points [lat lng]
export function distance(pointOne, pointTwo) {
  assert(
    Array.isArray(pointOne) &&
      Array.isArray(pointTwo) &&
      pointOne.length == 2 &&
      pointTwo.length == 2,
    "Violated preconditions of point distance"
  );
  return (
    ((Number(pointOne[0]) - Number(pointTwo[0])) ** 2 +
      (Number(pointOne[1]) - Number(pointTwo[1])) ** 2) **
    (1 / 2)
  );
}

export function assert(condition, message) {
  if (!condition) {
    throw message || "Assertion failed";
  }
}
