"use client";

const LINES = [
  "সততার সাথে সংগৃহীত · বিশ্বাসের সাথে বিক্রি",
  "আমরা সবচেয়ে সস্তা নই — তবে যা বলি, ঠিক সেটাই দিই",
  "এক নম্বর, এক প্রতিশ্রুতি — ০১৭৩১ ৭৭৯৭২৪",
  "স্টক না থাকলে ‘নেই’ বলি — আছে বললে আছেই থাকে",
  "প্রতিটি বাক্স ব্যক্তিগতভাবে পরীক্ষা করা",
];

export default function Ticker() {
  return (
    <section className="bg-gold border-y border-gold-deep/40 overflow-hidden" aria-hidden>
      <div className="py-2.5">
        <div className="flex w-max animate-ak-marquee">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center">
              {LINES.map((line) => (
                <span
                  key={`${dup}-${line}`}
                  className="mx-7 inline-flex items-center gap-2.5 whitespace-nowrap text-[13px] font-bold text-brand-deep"
                >
                  <span className="text-gold-deep">✦</span>
                  {line}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
