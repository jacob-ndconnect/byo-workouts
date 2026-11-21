const LB_TO_KG = 0.453592;
const MILES_TO_METERS = 1609.344;
const MINUTES_TO_SECONDS = 60;

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function lbToKg(lb: number): number {
  return round3(lb * LB_TO_KG);
}

export function kgToLb(kg: number): number {
  return round3(kg / LB_TO_KG);
}

export function milesToMeters(miles: number): number {
  return round3(miles * MILES_TO_METERS);
}

export function metersToMiles(meters: number): number {
  return round3(meters / MILES_TO_METERS);
}

export function minutesToSeconds(minutes: number): number {
  return round3(minutes * MINUTES_TO_SECONDS);
}

export function secondsToMinutes(seconds: number): number {
  return round3(seconds / MINUTES_TO_SECONDS);
}