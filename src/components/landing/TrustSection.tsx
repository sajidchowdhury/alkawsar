"use client";

import { motion } from "framer-motion";
import { BadgeCheck, BellRing, HandCoins, Truck } from "lucide-react";

const RULES = [
  {
    n: "১",
    title: "দাম যেমন আছে, তেমনই বলি",
    desc: "লুকানো চার্জ নেই, ফুসলা ছাড় নেই। তালিকার দামই একই টিয়ারে সবার জন্য এক।",
  },
  {
    n: "২",
    title: "মান যেমন আছে, তেমনই বলি",
    desc: "গ্রেড হাতে পেয়ে নিজেই যাচাই করুন — বক্স খুলে দানা মিলিয়ে দেখুন, তারপর সিদ্ধান্ত।",
  },
  {
    n: "৩",
    title: "সময় যেমন বলি, তেমনই মানি",
    desc: "ডেলিভারির সময় নিয়ে যা কথা দিই, পালাই না; কোনো সমস্যা হলে আগে থেকেই জানাই।",
  },
];

const PILLARS = [
  {
    icon: BadgeCheck,
    title: "যাচাইযোগ্য গ্রেড",
    desc: "A/B গ্রেড স্পষ্ট চিহ্নিত — ডেলিভারিতে বক্স খুলে নিজে মিলিয়ে নিন।",
  },
  {
    icon: HandCoins,
    title: "স্বচ্ছ দাম",
    desc: "এই পেজের দামই চূড়ান্ত — আলোচনার ফাঁক নেই, চাপও নেই।",
  },
  {
    icon: Truck,
    title: "নির্ভরযোগ্য ডেলিভারি",
    desc: "কথা দেওয়া সময়ে পৌঁছে দিই — দেরির সম্ভাবনা থাকলে আগেই বলি।",
  },
  {
    icon: BellRing,
    title: "সৎ স্টক আপডেট",
    desc: "যা নেই, সেটা নেই বলি। আছে বললে আছেই থাকে — এটাই আমাদের নিয়ম।",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
};

export default function TrustSection() {
  return (
    <section className="bg-linen py-16 md:py-20" aria-label="আস্থার কারণ">
      <div className="max-w-2xl mx-auto px-5">
        <motion.header {...fadeUp} transition={{ duration: 0.55 }} className="text-center">
          <p className="text-[11px] font-bold tracking-[0.3em] text-gold-deep">THE 3 IRON RULES</p>
          <h2 className="mt-1.5 font-bengali text-3xl font-bold text-brand">
            কেন AL-KAWSAR-এ বিশ্বাস করবেন?
          </h2>
          <p className="mt-2 text-sm text-stone-warm">
            সুন্দর কথা নয় — তিনটি নিয়ম, যেগুলো আমরা প্রতিদিন মানি।
          </p>
        </motion.header>

        {/* 3 iron rules */}
        <div className="mt-9 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {RULES.map((r, i) => (
            <motion.div
              key={r.n}
              {...fadeUp}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative rounded-3xl border border-gold/30 bg-cream p-5 shadow-sm"
            >
              <span className="absolute -top-4 left-5 flex h-9 w-9 items-center justify-center rounded-full bg-brand border-2 border-gold font-bengali text-sm font-bold text-gold-light shadow">
                {r.n}
              </span>
              <h3 className="mt-3 font-bengali text-[15px] font-bold text-brand leading-snug">
                {r.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-stone-warm">{r.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* pillars */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.title}
              {...fadeUp}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex gap-3.5 rounded-2xl bg-cream border border-gold/25 p-4"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/8 text-brand">
                <p.icon size={22} />
              </span>
              <div>
                <h3 className="font-bengali text-sm font-bold text-brand">{p.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-stone-warm">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* honesty seal */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6 }}
          className="mt-10 flex flex-col items-center gap-4 rounded-3xl bg-brand px-6 py-8 text-center shadow-xl shadow-brand/25"
        >
          <svg viewBox="0 0 120 120" className="h-28 w-28" role="img" aria-label="Honesty Seal">
            <defs>
              <path id="ak-seal-arc" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
            </defs>
            <circle cx="60" cy="60" r="57" fill="#063328" />
            <circle cx="60" cy="60" r="57" fill="none" stroke="#C9A961" strokeWidth="2" />
            <g className="animate-ak-seal" style={{ transformOrigin: "60px 60px" }}>
              <text fontSize="9" fill="#E0C892" letterSpacing="2.5" fontWeight="700">
                <textPath href="#ak-seal-arc">HONESTY SEAL · AL-KAWSAR · প্রতিশ্রুতি ·</textPath>
              </text>
            </g>
            <circle cx="60" cy="60" r="30" fill="none" stroke="#C9A961" strokeWidth="1.2" />
            <g stroke="#C9A961" fill="none" strokeLinecap="round">
              <path d="M60 74 C59.5 70 59.5 66 60 63" strokeWidth="2.4" />
              <path d="M60 63 L60 51" strokeWidth="2.4" />
              <path d="M60 63 Q55 59 52.5 51" strokeWidth="2" />
              <path d="M60 63 Q65 59 67.5 51" strokeWidth="2" />
              <path d="M60 63 Q53 61 47 58" strokeWidth="1.8" />
              <path d="M60 63 Q67 61 73 58" strokeWidth="1.8" />
              <path d="M48 79 Q54 76.5 60 79 T72 79" strokeWidth="2" />
              <path d="M51 85 Q55.5 82.5 60 85 T69 85" strokeWidth="2" />
            </g>
          </svg>
          <div>
            <h3 className="font-bengali text-base font-bold text-gold-light">সততা সিল</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-cream/75 max-w-sm">
              প্রতিটি বাক্স পাঠানোর আগে ব্যক্তিগতভাবে পরীক্ষা করা হয় — যে বক্সে এই নাম আছে, সেখানে
              প্রতিশ্রুতিও আছে।
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
