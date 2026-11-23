// ─── Bengali numeral & date helpers ──────────────────────────────────────────

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBn(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

/** Formats a number as Bengali-taka, e.g. 2150 → "৳২,১৫০". */
export function formatTaka(n: number): string {
  const safe = Math.max(0, Math.round(Number.isFinite(n) ? n : 0));
  const digits = String(safe);
  let out = "";
  for (let i = 0; i < digits.length; i++) {
    const posFromEnd = digits.length - i;
    out += digits[i];
    if (posFromEnd > 1 && posFromEnd % 3 === 1) out += ",";
  }
  return "৳" + toBn(out);
}

const BN_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

function periodBn(hour: number): string {
  if (hour < 4) return "রাত";
  if (hour < 6) return "ভোর";
  if (hour < 12) return "সকাল";
  if (hour < 16) return "দুপুর";
  if (hour < 18) return "বিকাল";
  if (hour < 20) return "সন্ধ্যা";
  return "রাত";
}

/** e.g. "১৫ ফেব্রুয়ারি, রাত ৯:৩০" (uses the visitor's own device time). */
export function formatBnDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const h = d.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const minutes = toBn(String(d.getMinutes()).padStart(2, "0"));
  return `${toBn(d.getDate())} ${BN_MONTHS[d.getMonth()]}, ${periodBn(h)} ${toBn(h12)}:${minutes}`;
}

const DAY_MS = 86400000;

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** "আজ" / "গতকাল" / full date. */
export function formatBnRelative(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(d)) / DAY_MS);
  if (diffDays <= 0) return "আজ";
  if (diffDays === 1) return "গতকাল";
  return formatBnDateTime(iso);
}
