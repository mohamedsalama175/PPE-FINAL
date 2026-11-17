/**
 * Serial number helpers (Epic 12, PPE-057 to PPE-059).
 * Pure functions, no store access, so they can be used by the store, the UI and tests.
 */

/** Up to 50 letters, digits or dashes. No spaces. Not case sensitive (stored upper-case). */
export const SERIAL_PATTERN = /^[A-Z0-9-]{1,50}$/;
export const SERIAL_MAX_LENGTH = 50;

export function normalizeSerial(raw: string): string {
  return String(raw ?? '').trim().toUpperCase();
}

/**
 * Splits typed, scanned or pasted text into serial entries.
 * A scanner sends each serial followed by Enter; a pasted list may use new lines, commas, semicolons or tabs.
 * Empty lines are ignored here: a text box cannot hold a meaningful blank entry.
 */
export function parseSerialInput(text: string): string[] {
  return String(text ?? '')
    .split(/[\r\n,;\t]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

export type SerialErrorCode = 'blank' | 'format' | 'duplicate_in_entry' | 'already_registered';

export interface SerialEntryError {
  index: number;
  serial: string; // as entered (normalized when possible)
  code: SerialErrorCode;
  message: string;
}

/**
 * Validates one stock-entry list of serials for a single item (PPE-057).
 * @param entries   serials as entered (blank strings are reported, e.g. from an Excel column)
 * @param existing  lookup of serials already registered for this item, returning where the unit is now
 */
export function validateSerialEntry(
  entries: string[],
  existing: (normalizedSerial: string) => string | null
): SerialEntryError[] {
  const errors: SerialEntryError[] = [];
  const seen = new Map<string, number>();

  entries.forEach((raw, index) => {
    const serial = normalizeSerial(raw);
    if (!serial) {
      errors.push({ index, serial: '', code: 'blank', message: `Line ${index + 1}: serial number is blank.` });
      return;
    }
    if (!SERIAL_PATTERN.test(serial)) {
      errors.push({
        index,
        serial,
        code: 'format',
        message: `${serial}: use up to ${SERIAL_MAX_LENGTH} letters, digits or dashes, no spaces.`,
      });
      return;
    }
    if (seen.has(serial)) {
      errors.push({ index, serial, code: 'duplicate_in_entry', message: `${serial} is repeated in this entry.` });
      return;
    }
    seen.set(serial, index);
    const where = existing(serial);
    if (where) {
      errors.push({ index, serial, code: 'already_registered', message: `${serial} is already registered for this item (${where}).` });
    }
  });

  return errors;
}
