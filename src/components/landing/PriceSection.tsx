"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Star, TrendingDown, TrendingUp } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import type { PriceChange, PublicData, PublicProduct } from "@/lib/api-types";
import { TIERS, QUICK_BOXES, ladderTierForBoxes, whatsappLink, type TierDef } from "@/lib/tiers";
import { formatTaka, toBn, formatBnDateTime, formatBnRelative } from "@/lib/bn";
import { cn } from "@/lib/utils";

/* ── animated number ─────────────────────────────────────────────────────── */
function useCountUp(value: number, duration = 550): number {
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);

  useEffect(() => {
    const from = displayRef.current;
    if (from === value) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = Math.round(from + (value - from) * eased);
      displayRef.current = next;
      setDisplay(next);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return display;
}

/* ── price-change badge ──────────────────────────────────────────────────── */
function ChangeBadge({ change, dark = false }: { change: PriceChange; dark?: boolean }) {
  if (!change || change.delta === 0) return null;
  const up = change.delta > 0;
  return (
    <span
      title={`আগের দাম · ${formatBnDateTime(change.at)}`}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
        dark ? (up ? "bg-brick/30 text-brick" : "bg-brand/10 text-brand") : up ? "bg-brick/10 text-brick" : "bg-brand/10 text-brand"
      )}
    >
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {up ? "+" : "−"}
      {formatTaka(Math.abs(change.delta))}
    </span>
  );
}

/* ── one product price card inside the calculator ────────────────────────── */
function CalcProductCard({
  product,
  tier,
  boxes,
  sampleActive,
}: {
  product: PublicProduct | undefined;
  tier: TierDef;
  boxes: number;
  sampleActive: boolean;
}) {
  const price = product?.prices[tier.id]?.price ?? 0;
  const shown = useCountUp(price);
  if (!product) {
    return <div className="rounded-2xl bg-white/5 border border-gold/20 p-4 h-36 animate-pulse" />;
  }
  const total = price * boxes;
  const available = product.stock === "available";

  return (
    <div className="relative rounded-2xl bg-white/5 border border-gold/25 p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-bengali font-bold text-cream text-sm leading-tight">{product.nameBn}</p>
          <p className="text-[10px] text-gold-light/80 font-semibold tracking-wide">
            {product.nameEn} · {product.gradeBn}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap",
            available ? "bg-brand-soft text-gold-light" : "bg-gold/15 text-gold-light/90"
          )}
        >
          <span
            className={cn("h-1.5 w-1.5 rounded-full", available ? "bg-gold-light animate-ak-pulse-dot" : "bg-gold-light/60")}
            aria-hidden
          />
          {available ? "স্টকে আছে" : "শীঘ্রই আসছে"}
        </span>
      </div>

      <div className="flex items-end gap-1.5">
        <span className="font-bengali text-2xl sm:text-3xl font-bold text-gold-light leading-none">
          {formatTaka(shown)}
        </span>
        <span className="text-[11px] text-cream/60 pb-0.5">/বাক্স</span>
        <span className="ml-auto pb-0.5">
          <ChangeBadge change={product.prices[tier.id]?.change ?? null} dark />
        </span>
      </div>

      <div className="flex items-center justify-between text-[11px] text-cream/70">
        <span>
          {toBn(boxes)} বাক্স ≈ <span className="font-bold text-cream">{formatTaka(total)}</span>
        </span>
        {sampleActive && (
          <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-brand-deep">
            স্যাম্পল রেট সক্রিয়
          </span>
        )}
      </div>
    </div>
  );
}

/* ── skeleton while first load ───────────────────────────────────────────── */
function PriceSkeleton() {
  return (
    <div className="space-y-6" aria-busy>
      <div className="rounded-3xl bg-brand p-6 space-y-5">
        <div className="h-5 w-40 rounded bg-white/10 animate-pulse" />
        <div className="h-10 w-56 rounded bg-white/10 animate-pulse" />
        <div className="h-8 rounded-full bg-white/10 animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-36 rounded-2xl bg-white/10 animate-pulse" />
          <div className="h-36 rounded-2xl bg-white/10 animate-pulse" />
        </div>
        <div className="h-12 rounded-full bg-gold/20 animate-pulse" />
      </div>
      <div className="h-72 rounded-3xl bg-linen border border-gold/20 animate-pulse" />
    </div>
  );
}

/* ── main section ────────────────────────────────────────────────────────── */
export default function PriceSection({ data }: { data: PublicData | null }) {
  const [boxes, setBoxes] = useState(2);

  const products = useMemo(() => {
    const map = new Map<string, PublicProduct>();
    data?.products.forEach((p) => map.set(p.slug, p));
    return map;
  }, [data]);

  const tier: TierDef = ladderTierForBoxes(boxes);
  const juicy = products.get("juicy");
  const hard = products.get("hard");

  // The calculator shows the tier price for the active tier directly.
  const priceFor = (p: PublicProduct | undefined) => p?.prices[tier.id]?.price ?? 0;

  const waMessage = `আসসালামু আলাইকুম। আমি AL-KAWSAR ওয়েবসাইট থেকে দাম দেখে ${toBn(boxes)} বাক্স সুকারি খেজুর অর্ডার করতে চাই (টিয়ার: ${tier.labelBn})।`;

  return (
    <section id="prices" className="relative bg-cream py-14 md:py-20 scroll-mt-4">
      <div className="max-w-2xl mx-auto px-5">
        {/* header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
          className="text-center"
        >
          <p className="text-[11px] font-bold tracking-[0.3em] text-gold-deep">TODAY&apos;S PRICE</p>
          <h2 className="mt-1.5 font-bengali text-3xl font-bold text-brand">আজকের দাম</h2>
          <div className="mt-2.5 inline-flex items-center gap-2 text-xs text-stone-warm">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-brand opacity-60 animate-ak-pulse-dot" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
            </span>
            লাইভ রেট · সর্বশেষ হালনাগাদ:{" "}
            <span className="font-semibold text-ink">
              {data ? formatBnRelative(data.meta.updatedAt) : "…"}
            </span>
          </div>
          {data?.meta.noteBn ? (
            <div className="mt-3 inline-block rounded-full border border-gold/50 bg-gold/15 px-4 py-1.5 text-xs font-semibold text-brand-deep">
              🗒 {data.meta.noteBn}
            </div>
          ) : null}
        </motion.div>

        {!data ? (
          <div className="mt-8">
            <PriceSkeleton />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="mt-8 space-y-7"
          >
            {/* ── calculator ─────────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-3xl bg-brand p-5 sm:p-7 shadow-xl shadow-brand/30">
              <div
                className="absolute -top-16 -right-14 h-48 w-48 rounded-full bg-gold/20 blur-3xl pointer-events-none"
                aria-hidden
              />
              <p className="text-[10px] font-bold tracking-[0.28em] text-gold-light/90">
                PRICE CALCULATOR
              </p>
              <div className="mt-1 flex items-end justify-between gap-3">
                <h3 className="font-bengali text-lg font-bold text-cream">কত বাক্স লাগবে?</h3>
                <p className="font-bengali text-2xl font-bold text-gold-light leading-none">
                  {toBn(boxes)}{" "}
                  <span className="text-xs font-semibold text-cream/70">বাক্স</span>
                </p>
              </div>

              {/* quick chips */}
              <div className="mt-4 flex flex-wrap gap-2">
                {QUICK_BOXES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setBoxes(q)}
                    className={cn(
                      "min-h-9 rounded-full border px-4 text-xs font-bold transition active:scale-95",
                      boxes === q
                        ? "bg-gold border-gold text-brand-deep shadow shadow-gold/30"
                        : "border-gold/40 text-gold-light hover:bg-gold/15"
                    )}
                  >
                    {toBn(q)}
                  </button>
                ))}
              </div>

              {/* slider */}
              <div className="mt-5 [&_[data-slot=slider-track]]:bg-gold/25 [&_[data-slot=slider-range]]:bg-gold [&_[data-slot=slider-thumb]]:border-gold [&_[data-slot=slider-thumb]]:bg-cream [&_[data-slot=slider-thumb]]:size-5">
                <Slider
                  value={[boxes]}
                  onValueChange={(v) => setBoxes(v[0] ?? 1)}
                  min={1}
                  max={100}
                  step={1}
                  aria-label="বাক্স সংখ্যা"
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-cream/50 font-semibold">
                <span>১</span>
                <span>১০০ বাক্স+</span>
              </div>

              {/* active tier */}
              <div className="mt-4 flex items-center justify-center gap-2 rounded-full border border-gold/30 bg-brand-deep/60 px-4 py-2">
                <span className="text-[11px] text-cream/70">সক্রিয় টিয়ার:</span>
                <span className="inline-flex items-center gap-1 font-bengali text-xs font-bold text-gold-light">
                  {tier.featured && <Star size={12} className="fill-gold text-gold" />}
                  {tier.labelBn} · {tier.buyerBn}
                </span>
              </div>

              {/* two product prices */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CalcProductCard product={juicy} tier={tier} boxes={boxes} sampleActive={tier.id === "sample"} />
                <CalcProductCard product={hard} tier={tier} boxes={boxes} sampleActive={tier.id === "sample"} />
              </div>

              {/* CTA */}
              <a
                href={whatsappLink(waMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gold px-6 font-bold text-sm text-brand-deep shadow-lg shadow-gold/25 transition hover:bg-gold-light active:scale-[0.99]"
              >
                <MessageCircle size={17} />
                WhatsApp-এ এই অর্ডার জিজ্ঞেস করুন
              </a>
              <p className="mt-2 text-center text-[11px] text-cream/55">
                বক্স হাতে পেয়ে গ্রেড মিলিয়ে নিন — তারপর সিদ্ধান্ত নিন।
              </p>
            </div>

            {/* ── full tier list ─────────────────────────────────────────── */}
            <div className="rounded-3xl border border-gold/25 bg-linen overflow-hidden shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-gold/25 bg-cream/60 px-4 sm:px-5 py-3">
                <h3 className="font-bengali text-sm font-bold text-brand">পূর্ণ দাম তালিকা</h3>
                <p className="text-[10px] font-semibold text-stone-warm">প্রতি বাক্সের দাম · টাকায়</p>
              </div>

              {/* desktop table */}
              <div className="hidden sm:block">
                <div className="grid grid-cols-[1.5fr_0.7fr_1fr_1fr_1.1fr] gap-2 bg-brand px-5 py-2.5 text-[11px] font-bold text-cream">
                  <span>স্তর</span>
                  <span className="text-center">বাক্স</span>
                  <span className="text-center">সুকারি জুসি (A)</span>
                  <span className="text-center">সুকারি হার্ড (B)</span>
                  <span className="text-right">ক্রেতার ধরন</span>
                </div>
                {TIERS.map((t) => {
                  const jp = juicy?.prices[t.id];
                  const hp = hard?.prices[t.id];
                  return (
                    <div
                      key={t.id}
                      className={cn(
                        "grid grid-cols-[1.5fr_0.7fr_1fr_1fr_1.1fr] items-center gap-2 px-5 py-3 text-sm border-b border-gold/15 last:border-0",
                        t.featured ? "bg-gold/15" : "hover:bg-cream/70"
                      )}
                    >
                      <span className="font-bengali font-semibold text-ink flex items-center gap-1.5">
                        {t.featured && <Star size={13} className="fill-gold text-gold-deep shrink-0" />}
                        {t.labelBn}
                      </span>
                      <span className="text-center text-xs text-stone-warm font-semibold">
                        {t.max ? `${toBn(t.min)}–${toBn(t.max)}` : `${toBn(t.min)}+`}
                      </span>
                      <span className="text-center">
                        <span className="font-bengali font-bold text-brand">{formatTaka(jp?.price ?? 0)}</span>
                        <span className="ml-1 align-middle">
                          <ChangeBadge change={jp?.change ?? null} />
                        </span>
                      </span>
                      <span className="text-center">
                        <span className="font-bengali font-bold text-brand">{formatTaka(hp?.price ?? 0)}</span>
                        <span className="ml-1 align-middle">
                          <ChangeBadge change={hp?.change ?? null} />
                        </span>
                      </span>
                      <span className="text-right text-xs text-stone-warm">{t.buyerBn}</span>
                    </div>
                  );
                })}
              </div>

              {/* mobile stacked cards */}
              <div className="sm:hidden divide-y divide-gold/15">
                {TIERS.map((t) => {
                  const jp = juicy?.prices[t.id];
                  const hp = hard?.prices[t.id];
                  return (
                    <div key={t.id} className={cn("px-4 py-3.5", t.featured && "bg-gold/15")}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bengali font-semibold text-sm text-ink flex items-center gap-1.5">
                          {t.featured && <Star size={13} className="fill-gold text-gold-deep shrink-0" />}
                          {t.labelBn}
                        </span>
                        <span className="rounded-full bg-brand/8 border border-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">
                          {t.max ? `${toBn(t.min)}–${toBn(t.max)} বাক্স` : `${toBn(t.min)}+ বাক্স`}
                        </span>
                      </div>
                      <div className="mt-2.5 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-cream border border-gold/20 px-3 py-2">
                          <p className="text-[10px] font-semibold text-stone-warm">জুসি · A</p>
                          <p className="font-bengali text-base font-bold text-brand">{formatTaka(jp?.price ?? 0)}</p>
                          <ChangeBadge change={jp?.change ?? null} />
                        </div>
                        <div className="rounded-xl bg-cream border border-gold/20 px-3 py-2">
                          <p className="text-[10px] font-semibold text-stone-warm">হার্ড · B</p>
                          <p className="font-bengali text-base font-bold text-brand">{formatTaka(hp?.price ?? 0)}</p>
                          <ChangeBadge change={hp?.change ?? null} />
                        </div>
                      </div>
                      <p className="mt-1.5 text-[11px] text-stone-warm">ক্রেতা: {t.buyerBn}</p>
                    </div>
                  );
                })}
              </div>

              <p className="border-t border-gold/25 bg-cream/60 px-4 sm:px-5 py-2.5 text-center text-[11px] text-stone-warm">
                দাম পরিবর্তন হলে এই পেজই আপডেট হবে — বুকমার্ক করে রাখুন।
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
