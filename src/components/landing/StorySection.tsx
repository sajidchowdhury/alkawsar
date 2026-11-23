"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const VALUES = ["খাঁটিপনা", "সৎ কথা", "সম্পর্ক আগে", "নিয়মিত যত্ন", "বরকত > আয়তন"];

const fadeUp = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
};

export default function StorySection() {
  return (
    <section
      className="relative overflow-hidden bg-brand-deep py-16 md:py-20"
      aria-label="ব্র্যান্ডের গল্প"
    >
      {/* drifting river lines */}
      <div className="absolute bottom-0 left-0 right-0 h-28 opacity-25 pointer-events-none" aria-hidden>
        <svg
          className="absolute top-0 left-0 h-full w-[200%] animate-ak-wave-drift"
          viewBox="0 0 2400 120"
          preserveAspectRatio="none"
          fill="none"
        >
          {[28, 60, 92].map((y, i) => (
            <path
              key={i}
              d={`M0 ${y} Q150 ${y - 14} 300 ${y} T600 ${y} T900 ${y} T1200 ${y} T1500 ${y} T1800 ${y} T2100 ${y} T2400 ${y}`}
              stroke="#C9A961"
              strokeWidth={i === 1 ? 2.4 : 1.6}
            />
          ))}
        </svg>
      </div>

      <div className="relative max-w-2xl mx-auto px-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <motion.div {...fadeUp} transition={{ duration: 0.6 }}>
            <p className="text-[11px] font-bold tracking-[0.3em] text-gold">OUR STORY</p>
            <h2 className="mt-1.5 font-bengali text-3xl font-bold text-cream">
              নামের মধ্যেই প্রতিশ্রুতি
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-cream/80">
              আল-কাওসার — জান্নাতের সেই নদী, যার পানি প্রাচুর্যের প্রতীক। সূরা আল-কাওসারের নাম থেকে
              ব্র্যান্ডটি বেছে নেওয়া হয়েছে, যেন প্রতিটি বক্সে সেই প্রাচুর্য ও বরকত বয়ে আসে।
            </p>
            <p className="mt-3 font-bengali text-sm leading-relaxed text-gold-light">
              এই ব্যবসা একটি সদকায়ে জারিয়ার অভিপ্রায়ে — মুনাফার একটি অংশ নীরবে খাদ্য, পানি ও
              কুরআন শিক্ষায় ব্যয় হয়।
            </p>
            <p className="mt-4 text-xs italic text-cream/50">কাওসার জান্নাত আরার স্মরণে।</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {VALUES.map((v) => (
                <span
                  key={v}
                  className="rounded-full border border-gold/35 px-3 py-1 text-[11px] font-semibold text-gold-light"
                >
                  {v}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="relative aspect-[4/3.4] overflow-hidden rounded-3xl border border-gold/30 shadow-2xl shadow-black/40">
              <Image
                src="/images/story-palm.png"
                alt="সোনালি আলোয় খেজুর গাছ ও শান্ত নদী — আল-কাওসারের প্রতীক"
                fill
                sizes="(max-width: 768px) 100vw, 340px"
                className="object-cover"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-brand-deep/55 via-transparent to-transparent"
                aria-hidden
              />
            </div>
            <div className="absolute -bottom-4 left-4 right-8 rounded-2xl border border-gold/40 bg-brand px-4 py-3 shadow-lg">
              <p className="font-display text-sm italic text-gold-light">
                “From abundance, given with honesty.”
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
