// src/utils/noteMath.ts
// Helpers for Hz <-> MIDI note <-> name <-> cents, default A4 = 440 Hz

export function hzToNoteNumber(hz: number, a4 = 440): number {
  return 69 + 12 * Math.log2(hz / a4);
}

export function noteNumberToHz(n: number, a4 = 440): number {
  return a4 * Math.pow(2, (n - 69) / 12);
}

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function noteNameFromNumber(n: number): string {
  const i = Math.round(n);
  const name = NAMES[((i % 12) + 12) % 12];
  const octave = Math.floor(i / 12) - 1;
  return `${name}${octave}`;
}

export function centsOff(
  hz: number,
  a4 = 440,
): { cents: number; nearest: number; nearestHz: number } {
  const n = hzToNoteNumber(hz, a4);
  const nearest = Math.round(n);
  const nearestHz = noteNumberToHz(nearest, a4);
  const cents = 1200 * Math.log2(hz / nearestHz);
  return { cents, nearest, nearestHz };
}
