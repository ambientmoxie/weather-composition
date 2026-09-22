// Generates a random number between two values
function randomInRange(minValue, maxValue) {
  return Math.random() * (maxValue - minValue) + minValue;
}

// Equivalent of Processing's remap function
function remap(value, oldMin, oldMax, newMin, newMax) {
  return ((value - oldMin) / (oldMax - oldMin)) * (newMax - newMin) + newMin;
}

// Generates a random but consistent number between two values using a seed
function hashToRange(seed, minRange, maxRange) {
  // Security checks before manipulations
  if (typeof seed !== "number") {
    throw new Error("Seed must be a number");
  }
  if (typeof minRange !== "number" || typeof maxRange !== "number") {
    throw new Error("minRange and maxRange must be numbers");
  }
  if (minRange >= maxRange) {
    throw new Error("minRange must be less than maxRange");
  }

  // Bitwise operations and mathematical transformations
  let hash = seed;
  hash = (hash << 5) - hash + (hash >>> 3);
  hash = hash * 2654435761;
  hash = (hash ^ (hash >>> 16)) & 0xffffffff;

  const range = maxRange - minRange; // Calculate the range
  const hashedValue = Math.abs(hash % range); // Use modulo to bring the number within the range 0 to (range - 1)
  const finalValue = minRange + hashedValue; // Offset the value by minRange to bring it within the desired range

  return finalValue;
}

// Turns a string into a 32-bit integer (FNV-1a), to be used as a seed
function hashString(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(hash ^ str.charCodeAt(i), 16777619);
  }
  return hash >>> 0;
}

// Seeded pseudo-random generator (mulberry32).
// Returns a function giving numbers between 0 and 1: the same seed always gives the same sequence
function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export { randomInRange, remap, hashToRange, hashString, createRandom };
