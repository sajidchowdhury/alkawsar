"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MessageCircle,
  Star,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import type { PriceChange, PublicData, PublicProduct } from "@/lib/api-types";
import {
  CATEGORIES,
  QUICK_BOXES,
  TIERS,
  ladderTierForBoxes,
  whatsappLink,
  type TierDef,
} from "@/lib/tiers";
import { formatBnDateTime, formatBnRelative, formatTaka, toBn } from "@/lib/bn";
import { DEFAULT_PRODUCT_IMAGE, handleImgError, productImageSrc } from "@/lib/images";
import { withBasePath } from "@/lib/base-path";
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

/* ── horizontal carousel row with side arrows ────────────────────────────── */
function categoryImageSrc(id: string): string {
  const img = CATEGORIES.find((c) => c.id === id)?.image;
  // CATEGORIES images are raw paths; DEFAULT_PRODUCT_IMAGE is already basePath-aware
  return img ? withBasePath(img) : DEFAULT_PRODUCT_IMAGE;
}

function scrollRow(ref: React.RefObject<HTMLDivElement | null>, dir: 1 | -1) {
  ref.current?.scrollBy({ left: dir * 220, behavior: "smooth" });
}

function CarouselRow({
  scrollRef,
  children,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) {
  const btn =
    "absolute top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-cream shadow-md shadow-brand/30 transition hover:bg-brand-soft active:scale-90";
  return (
    <div className="relative">
      <button type="button" aria-label="আগেরটি" className={cn(btn, "left-0")} onClick={() => scrollRow(scrollRef, -1)}>
        <ChevronsLeft size={18} />
      </button>
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <button type="button" aria-label="পরেরটি" className={cn(btn, "right-0")} onClick={() => scrollRow(scrollRef, 1)}>
        <ChevronsRight size={18} />
      </button>
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
        <div className="mx-auto h-48 w-48 rounded-full bg-white/10 animate-pulse" />
        <div className="h-36 rounded-2xl bg-white/10 animate-pulse" />
        <div className="h-12 rounded-full bg-gold/20 animate-pulse" />
      </div>
      <div className="h-72 rounded-3xl bg-linen border border-gold/20 animate-pulse" />
    </div>
  );
}

/* ── main section ────────────────────────────────────────────────────────── */
export default function PriceSection({ data }: { data: PublicData | null }) {
  const [boxes, setBoxes] = useState(2);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuCat, setMenuCat] = useState<string>("dates");

  const products = useMemo(() => data?.products ?? [], [data]);
  const selected = useMemo(
    () => products.find((p) => p.slug === selectedSlug) ?? products[0],
    [products, selectedSlug]
  );

  const tier: TierDef = ladderTierForBoxes(boxes);

  const catProducts = useMemo(
    () => products.filter((p) => p.category === menuCat),
    [products, menuCat]
  );

  function step(dir: 1 | -1) {
    if (!selected || products.length < 2) return;
    const idx = products.findIndex((p) => p.slug === selected.slug);
    const at = (idx + dir + products.length) % products.length;
    setSelectedSlug(products[at].slug);
  }

  function openMenu() {
    setMenuCat(selected?.category ?? CATEGORIES[0]?.id ?? "dates");
    setMenuOpen(true);
  }

  function pick(p: PublicProduct) {
    setSelectedSlug(p.slug);
    setMenuOpen(false);
  }

  // swipe support on the product stage (mobile)
  const touchX = useRef<number | null>(null);
  const catsRef = useRef<HTMLDivElement | null>(null);

  const price = selected?.prices[tier.id]?.price ?? 0;
  const shown = useCountUp(price);
  const total = price * boxes;
  const hasPrice = price > 0;
  const available = selected ? selected.stock === "available" : false;

  const waMessage = selected
    ? `আসসালামু আলাইকুম। আমি AL-KAWSAR ওয়েবসাইট থেকে দাম দেখে ${selected.nameBn} ${toBn(boxes)} বাক্স অর্ডার করতে চাই (টিয়ার: ${tier.labelBn})।`
    : "";

  const panelMotion = {
    initial: { opacity: 0, y: -16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
    transition: { duration: 0.26, ease: "easeOut" as const },
  };

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
          <div className="mt-12">
            <PriceSkeleton />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="mt-12 space-y-7"
          >
            {/* ═══ MAIN CARD — MENU pill + calculator/menu picker + product stage ═══ */}
            <div className="relative">
              {/* MENU pill — overlaps the top edge */}
              <button
                type="button"
                onClick={() => (menuOpen ? setMenuOpen(false) : openMenu())}
                aria-expanded={menuOpen}
                className="absolute left-1/2 top-0 z-30 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-cream px-6 py-2.5 text-sm font-bold tracking-wide text-brand-deep shadow-lg shadow-brand/40 ring-1 ring-gold/40 transition hover:bg-white active:scale-95"
              >
                {menuOpen ? (
                  <>
                    <X size={15} strokeWidth={2.5} />
                    বন্ধ করুন
                  </>
                ) : (
                  "MENU"
                )}
              </button>

              <div className="overflow-hidden rounded-3xl bg-brand shadow-xl shadow-brand/30">
                {/* ── panel slot: calculator ⇄ menu picker ── */}
                <div className="relative">
                  <AnimatePresence initial={false} mode="popLayout">
                    {menuOpen ? (
                      /* ── MENU PICKER (off-canvas) ─────────────────────────── */
                      <motion.div
                        key="menu"
                        {...panelMotion}
                        className="rounded-b-[26px] border-b-2 border-gold/60 bg-cream px-4 pb-5 pt-9 sm:px-6"
                      >
                        <p className="text-center font-bengali text-[11px] font-bold tracking-wide text-brand/60">
                          ক্যাটাগরি বাছুন — তারপর পণ্য বাছুন
                        </p>

                        {/* category circles */}
                        <div className="mt-3.5">
                          <CarouselRow scrollRef={catsRef}>
                            {CATEGORIES.map((c) => {
                              const active = c.id === menuCat;
                              const count = products.filter((p) => p.category === c.id).length;
                              return (
                                <div key={c.id} className="w-[78px] shrink-0 snap-center">
                                  <button
                                    type="button"
                                    onClick={() => setMenuCat(c.id)}
                                    aria-pressed={active}
                                    className={cn(
                                      "relative flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full border-2 transition active:scale-95",
                                      active
                                        ? "border-gold bg-white shadow-lg shadow-brand/25"
                                        : "border-transparent bg-brand-deep text-cream hover:bg-brand-soft"
                                    )}
                                  >
                                    {active ? (
                                      <img
                                        src={categoryImageSrc(c.id)}
                                        alt={c.labelBn}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <span className="px-1.5 text-center font-bengali text-[11px] font-bold leading-tight">
                                        {c.labelBn}
                                        <span className="mt-0.5 block text-[9px] font-semibold text-cream/50">
                                          {toBn(count)} টি
                                        </span>
                                      </span>
                                    )}
                                  </button>
                                  {active && (
                                    <p className="mt-1 text-center font-bengali text-[10px] font-bold text-brand">
                                      {c.labelBn}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </CarouselRow>
                        </div>

                        {/* products of the active category */}
                        <div className="mt-2.5">
                          {catProducts.length === 0 ? (
                            <p className="py-5 text-center font-bengali text-xs font-semibold text-stone-warm">
                              এই ক্যাটাগরিতে পণ্য শীঘ্রই যোগ হবে ইনশাআল্লাহ
                            </p>
                          ) : (
                            <MenuProductsRow catProducts={catProducts} selectedSlug={selected?.slug ?? ""} onPick={pick} />
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      /* ── PRICE CALCULATOR (kept as-is) ────────────────────── */
                      <motion.div key="calc" {...panelMotion} className="p-5 pt-10 sm:p-7 sm:pt-10">
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
                          <span className="text-[11px] text-cream/70">সর্বোচ্চ ছাড়:</span>
                          <span className="inline-flex items-center gap-1 font-bengali text-xs font-bold text-gold-light">
                            {tier.featured && <Star size={12} className="fill-gold text-gold" />}
                            {tier.labelBn} · {tier.buyerBn}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── SINGLE PRODUCT STAGE (m1) ─────────────────────────────── */}
                {selected ? (
                  <>
                    <div
                      className="relative mt-2 select-none"
                      onTouchStart={(e) => {
                        touchX.current = e.touches[0]?.clientX ?? null;
                      }}
                      onTouchEnd={(e) => {
                        if (touchX.current === null) return;
                        const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
                        if (Math.abs(dx) > 42) step(dx < 0 ? 1 : -1);
                        touchX.current = null;
                      }}
                    >
                      {products.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => step(-1)}
                            aria-label="আগের পণ্য"
                            className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full p-1 text-cream/90 transition hover:text-gold-light active:scale-90 sm:left-4"
                          >
                            <ChevronsLeft size={38} strokeWidth={2.4} />
                          </button>
                          <button
                            type="button"
                            onClick={() => step(1)}
                            aria-label="পরের পণ্য"
                            className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full p-1 text-cream/90 transition hover:text-gold-light active:scale-90 sm:right-4"
                          >
                            <ChevronsRight size={38} strokeWidth={2.4} />
                          </button>
                        </>
                      )}

                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={selected.slug}
                          initial={{ opacity: 0, x: 44 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -44 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                          <img
                            src={productImageSrc(selected)}
                            onError={handleImgError}
                            alt={selected.nameBn}
                            className="mx-auto h-44 w-auto max-w-[72%] object-contain sm:h-60 [mask-image:radial-gradient(circle_at_center,black_58%,transparent_79%)]"
                          />
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* position dots */}
                    {products.length > 1 && (
                      <div className="mt-1 flex justify-center gap-1.5" role="tablist" aria-label="পণ্য নির্বাচন">
                        {products.map((p) => (
                          <button
                            key={p.slug}
                            type="button"
                            role="tab"
                            aria-selected={p.slug === selected.slug}
                            aria-label={p.nameBn}
                            onClick={() => setSelectedSlug(p.slug)}
                            className={cn(
                              "h-1.5 rounded-full transition-all active:scale-125",
                              p.slug === selected.slug ? "w-6 bg-gold" : "w-1.5 bg-cream/25 hover:bg-cream/50"
                            )}
                          />
                        ))}
                      </div>
                    )}

                    {/* product info card */}
                    <div className="relative z-10 mx-auto mt-3 max-w-sm px-4">
                      <div className="rounded-2xl border border-gold/30 bg-white/5 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-bengali text-base font-bold text-cream">
                              {selected.nameBn}
                            </p>
                            <p className="truncate text-[11px] font-semibold text-gold-light/90">
                              {selected.nameEn} · {selected.gradeBn}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap",
                              available ? "bg-brand-soft text-gold-light" : "bg-gold/15 text-gold-light/90"
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                available ? "bg-gold-light animate-ak-pulse-dot" : "bg-gold-light/60"
                              )}
                              aria-hidden
                            />
                            {available ? "স্টকে আছে" : "শীঘ্রই আসছে"}
                          </span>
                        </div>

                        <div className="mt-2 flex items-end justify-between gap-2">
                          <div className="flex items-end gap-1.5">
                            {hasPrice ? (
                              <span className="font-bengali text-3xl font-bold leading-none text-gold-light sm:text-4xl">
                                {formatTaka(shown)}
                              </span>
                            ) : (
                              <span className="font-bengali text-3xl font-bold leading-none text-gold-light/50 sm:text-4xl">
                                দাম শীঘ্রই
                              </span>
                            )}
                            {hasPrice && <span className="pb-1 text-[11px] text-cream/60">/বাক্স</span>}
                            <span className="pb-1">
                              <ChangeBadge change={selected.prices[tier.id]?.change ?? null} dark />
                            </span>
                          </div>
                          {tier.id === "sample" && hasPrice && (
                            <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-brand-deep">
                              স্যাম্পল রেট
                            </span>
                          )}
                        </div>

                        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-gold/15 bg-brand-deep/50 px-3 py-2 text-[11px]">
                          <span className="font-bengali text-cream/80">
                            প্যাক: <b className="font-bold text-gold-light">{selected.packSizeBn}</b>
                          </span>
                          <span className="font-bengali text-cream/80">
                            {toBn(boxes)} বাক্স ≈{" "}
                            <b className="font-bold text-gold-light">
                              {hasPrice ? formatTaka(total) : "—"}
                            </b>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="px-5 pb-5 pt-4 sm:px-7">
                      <a
                        href={whatsappLink(waMessage)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gold px-6 font-bold text-sm text-brand-deep shadow-lg shadow-gold/25 transition hover:bg-gold-light active:scale-[0.99]"
                      >
                        <MessageCircle size={17} />
                        WhatsApp-এ এই অর্ডার জিজ্ঞেস করুন
                      </a>
                      <p className="mt-2 text-center text-[11px] text-cream/55">
                        বক্স হাতে পেয়ে গ্রেড মিলিয়ে নিন — তারপর সিদ্ধান্ত নিন।
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="px-6 pb-10 pt-4 text-center">
                    <p className="font-bengali text-sm font-semibold text-cream/80">
                      পণ্য শীঘ্রই যোগ হবে ইনশাআল্লাহ
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ═══ FULL PRICE LIST — only the selected product, updates dynamically ═══ */}
            {selected && (
              <div className="rounded-3xl border border-gold/25 bg-linen overflow-hidden shadow-sm">
                {/* header with product switcher */}
                <div className="flex items-center justify-between gap-2 border-b border-gold/25 bg-cream/60 px-3 sm:px-5 py-3">
                  <div className="flex min-w-0 items-center gap-0.5">
                    {products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => step(-1)}
                        aria-label="আগের পণ্য"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-stone-warm transition hover:bg-brand/10 hover:text-brand active:scale-90"
                      >
                        <ChevronLeft size={15} />
                      </button>
                    )}
                    <img
                      src={productImageSrc(selected)}
                      onError={handleImgError}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-gold/40"
                    />
                    <div className="min-w-0 px-1.5">
                      <h3 className="truncate font-bengali text-sm font-bold leading-tight text-brand">
                        {selected.nameBn}
                      </h3>
                      <p className="truncate text-[10px] text-stone-warm">
                        {selected.nameEn} · প্যাক {selected.packSizeBn}
                      </p>
                    </div>
                    {products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => step(1)}
                        aria-label="পরের পণ্য"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-stone-warm transition hover:bg-brand/10 hover:text-brand active:scale-90"
                      >
                        <ChevronRight size={15} />
                      </button>
                    )}
                  </div>
                  <p className="shrink-0 text-[10px] font-semibold text-stone-warm">
                    প্রতি বাক্সের দাম · টাকায়
                  </p>
                </div>

                {/* desktop table */}
                <div className="hidden sm:block">
                  <div
                    className="grid items-center gap-2 bg-brand px-5 py-2.5 text-[11px] font-bold text-cream"
                    style={{ gridTemplateColumns: "1.35fr 0.7fr 1fr 1.1fr" }}
                  >
                    <span>স্তর</span>
                    <span className="text-center">বাক্স</span>
                    <span className="text-center">দাম</span>
                    <span className="text-right">ক্রেতার ধরন</span>
                  </div>
                  {TIERS.map((t) => {
                    const pr = selected.prices[t.id];
                    return (
                      <div
                        key={t.id}
                        className={cn(
                          "grid items-center gap-2 border-b border-gold/15 px-5 py-3 text-sm last:border-0",
                          t.featured ? "bg-gold/15" : "hover:bg-cream/70"
                        )}
                        style={{ gridTemplateColumns: "1.35fr 0.7fr 1fr 1.1fr" }}
                      >
                        <span className="flex items-center gap-1.5 font-bengali font-semibold text-ink">
                          {t.featured && <Star size={13} className="shrink-0 fill-gold text-gold-deep" />}
                          {t.labelBn}
                        </span>
                        <span className="text-center text-xs font-semibold text-stone-warm">
                          {t.max ? `${toBn(t.min)}–${toBn(t.max)}` : `${toBn(t.min)}+`}
                        </span>
                        <span className="text-center">
                          {pr && pr.price > 0 ? (
                            <>
                              <span className="font-bengali font-bold text-brand">{formatTaka(pr.price)}</span>
                              <span className="ml-1 align-middle">
                                <ChangeBadge change={pr.change ?? null} />
                              </span>
                            </>
                          ) : (
                            <span className="text-stone-warm">—</span>
                          )}
                        </span>
                        <span className="text-right text-xs text-stone-warm">{t.buyerBn}</span>
                      </div>
                    );
                  })}
                </div>

                {/* mobile stacked cards */}
                <div className="divide-y divide-gold/15 sm:hidden">
                  {TIERS.map((t) => {
                    const pr = selected.prices[t.id];
                    return (
                      <div key={t.id} className={cn("px-4 py-3", t.featured && "bg-gold/15")}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 font-bengali font-semibold text-sm text-ink">
                            {t.featured && <Star size={13} className="shrink-0 fill-gold text-gold-deep" />}
                            {t.labelBn}
                          </span>
                          <span className="rounded-full border border-brand/15 bg-brand/8 px-2 py-0.5 text-[10px] font-bold text-brand">
                            {t.max ? `${toBn(t.min)}–${toBn(t.max)} বাক্স` : `${toBn(t.min)}+ বাক্স`}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          {pr && pr.price > 0 ? (
                            <p className="font-bengali text-xl font-bold text-brand">
                              {formatTaka(pr.price)}
                              <span className="ml-1 text-[10px] font-semibold text-stone-warm">/বাক্স</span>
                            </p>
                          ) : (
                            <p className="font-bengali text-xl font-bold text-stone-warm/60">—</p>
                          )}
                          <ChangeBadge change={pr?.change ?? null} />
                        </div>
                        <p className="mt-0.5 text-[11px] text-stone-warm">ক্রেতা: {t.buyerBn}</p>
                      </div>
                    );
                  })}
                </div>

                <p className="border-t border-gold/25 bg-cream/60 px-4 sm:px-5 py-2.5 text-center text-[11px] text-stone-warm">
                  উপরের ক্যারোসেল বা MENU থেকে পণ্য বদলালে এই তালিকাও বদলে যাবে।
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}

/* ── menu picker products row (kept separate so refs stay stable) ────────── */
function MenuProductsRow({
  catProducts,
  selectedSlug,
  onPick,
}: {
  catProducts: PublicProduct[];
  selectedSlug: string;
  onPick: (p: PublicProduct) => void;
}) {
  const prodsRef = useRef<HTMLDivElement | null>(null);
  return (
    <CarouselRow scrollRef={prodsRef}>
      {catProducts.map((p) => {
        const isSel = p.slug === selectedSlug;
        return (
          <button
            key={p.slug}
            type="button"
            onClick={() => onPick(p)}
            aria-label={`${p.nameBn} বাছুন`}
            className="group w-[104px] shrink-0 snap-center"
          >
            <div
              className={cn(
                "overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition group-active:scale-95",
                isSel ? "border-gold ring-2 ring-gold/50" : "border-transparent group-hover:border-gold/60"
              )}
            >
              <img
                src={productImageSrc(p)}
                onError={handleImgError}
                alt={p.nameBn}
                loading="lazy"
                className="h-[88px] w-full object-cover"
              />
            </div>
            <p
              className={cn(
                "mt-1 truncate text-center text-[10px] font-bold",
                isSel ? "text-brand" : "text-ink/70"
              )}
            >
              {p.nameBn}
            </p>
          </button>
        );
      })}
    </CarouselRow>
  );
}
