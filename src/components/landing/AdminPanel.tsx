"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2, LogOut, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TIERS } from "@/lib/tiers";
import { toBn } from "@/lib/bn";
import { cn } from "@/lib/utils";
import type { PublicData } from "@/lib/api-types";

type PriceGrid = Record<string, Record<string, string>>;

function gridFromData(data: PublicData | null): PriceGrid {
  const grid: PriceGrid = {};
  for (const p of data?.products ?? []) {
    const row: Record<string, string> = {};
    for (const t of TIERS) {
      row[t.id] = String(p.prices[t.id]?.price ?? "");
    }
    grid[p.slug] = row;
  }
  return grid;
}

export default function AdminPanel({
  open,
  onClose,
  onSaved,
  data,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  data: PublicData | null;
}) {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [grid, setGrid] = useState<PriceGrid>(() => gridFromData(data));
  const [note, setNote] = useState("");
  const [stocks, setStocks] = useState<Record<string, boolean>>({ juicy: true, hard: true });
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  // Latest data via ref — lets us sync the form on open without clobbering edits.
  const dataRef = useRef<PublicData | null>(null);
  dataRef.current = data;

  function syncFormFromData() {
    const d = dataRef.current;
    if (!d) return;
    setGrid(gridFromData(d));
    setNote(d.meta.noteBn ?? "");
    const s: Record<string, boolean> = {};
    d.products.forEach((p) => (s[p.slug] = p.stock === "available"));
    setStocks(s);
  }

  // Initialize the form each time the panel opens.
  useEffect(() => {
    if (open) syncFormFromData();
  }, [open]);

  // Restore session when opened.
  useEffect(() => {
    if (!open) return;
    setChecking(true);
    fetch("/api/admin/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setAuthed(Boolean(j.authed)))
      .catch(() => setAuthed(false))
      .finally(() => setChecking(false));
  }, [open]);

  const productsInGrid = useMemo(() => data?.products ?? [], [data]);

  async function handleLogin(e?: React.FormEvent) {
    e?.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setAuthed(true);
        setPassword("");
        syncFormFromData();
      } else {
        setLoginError(json.error || "ভুল পাসওয়ার্ড");
      }
    } catch {
      setLoginError("সংযোগ সমস্যা — আবার চেষ্টা করুন");
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSavedCount(null);
    try {
      const prices: Record<string, Record<string, number>> = {};
      for (const [slug, row] of Object.entries(grid)) {
        prices[slug] = {};
        for (const [tierId, raw] of Object.entries(row)) {
          const n = Number(String(raw).trim());
          if (Number.isFinite(n) && n >= 0) prices[slug][tierId] = Math.round(n);
        }
      }
      const stock: Record<string, string> = {};
      for (const [slug, ok] of Object.entries(stocks)) stock[slug] = ok ? "available" : "coming";

      const res = await fetch("/api/admin/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prices, stock, noteBn: note }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        toast.success("দাম হালনাগাদ হয়েছে — ওয়েবসাইটে এখনই দেখা যাবে");
        setSavedCount(json.changed ?? 0);
        onSaved();
      } else {
        toast.error(json.error || "সেভ করা যায়নি");
      }
    } catch {
      toast.error("সংযোগ সমস্যা — আবার চেষ্টা করুন");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    setAuthed(false);
    toast("লগআউট হয়েছে");
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-brand-deep/85 backdrop-blur-sm p-0 sm:p-5"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="মালিক প্যানেল"
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md max-h-[92vh] sm:max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-cream shadow-2xl"
          >
            {/* header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gold/25 bg-cream/95 backdrop-blur px-5 py-3.5">
              <div>
                <h2 className="font-bengali text-base font-bold text-brand">মালিক প্যানেল</h2>
                <p className="text-[11px] text-stone-warm">দাম পরিবর্তন করে সেভ করলেই সাইট আপডেট হবে</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-brand/10 text-stone-warm"
                aria-label="বন্ধ করুন"
              >
                <X size={18} />
              </button>
            </div>

            {checking ? (
              <div className="flex items-center justify-center py-16 text-stone-warm">
                <Loader2 className="animate-spin" size={22} />
              </div>
            ) : !authed ? (
              <form onSubmit={handleLogin} className="px-5 py-8 space-y-4">
                <p className="text-center font-bengali text-sm text-stone-warm">
                  শুধু মালিকের জন্য — পাসওয়ার্ড দিন
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="admin-pass" className="text-xs">
                    পাসওয়ার্ড
                  </Label>
                  <Input
                    id="admin-pass"
                    type="password"
                    inputMode="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 text-base"
                    autoFocus
                  />
                </div>
                {loginError && <p className="text-xs font-semibold text-brick text-center">{loginError}</p>}
                <Button
                  type="submit"
                  disabled={loggingIn || !password}
                  className="w-full h-12 bg-brand text-cream hover:bg-brand-soft font-bold"
                >
                  {loggingIn ? <Loader2 className="animate-spin" size={18} /> : "প্রবেশ করুন"}
                </Button>
              </form>
            ) : (
              <div className="px-5 py-5 space-y-5">
                {productsInGrid.map((p) => (
                  <div key={p.slug} className="rounded-2xl border border-gold/30 bg-linen p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="font-bengali text-sm font-bold text-brand">{p.nameBn}</h3>
                        <p className="text-[10px] text-stone-warm">{p.nameEn}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-[11px] font-bold",
                            stocks[p.slug] ? "text-brand" : "text-brick"
                          )}
                        >
                          {stocks[p.slug] ? "স্টকে আছে" : "শীঘ্রই আসছে"}
                        </span>
                        <Switch
                          checked={stocks[p.slug] ?? true}
                          onCheckedChange={(v) => setStocks((s) => ({ ...s, [p.slug]: v }))}
                          aria-label={`${p.nameBn} স্টক স্ট্যাটাস`}
                        />
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2.5">
                      {TIERS.map((t) => (
                        <div key={t.id} className="space-y-1">
                          <Label htmlFor={`${p.slug}-${t.id}`} className="text-[11px] text-stone-warm">
                            {t.labelBn}{" "}
                            <span className="text-gold-deep font-semibold">
                              ({t.max ? `${toBn(t.min)}–${toBn(t.max)}` : `${toBn(t.min)}+`})
                            </span>
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gold-deep">
                              ৳
                            </span>
                            <Input
                              id={`${p.slug}-${t.id}`}
                              inputMode="numeric"
                              value={grid[p.slug]?.[t.id] ?? ""}
                              onChange={(e) => {
                                const v = e.target.value.replace(/[^0-9]/g, "");
                                setGrid((g) => ({ ...g, [p.slug]: { ...g[p.slug], [t.id]: v } }));
                              }}
                              className="h-11 pl-7 text-sm font-semibold"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="space-y-1.5">
                  <Label htmlFor="admin-note" className="text-xs">
                    দ্রষ্টব্য — সাইটের দামের সেকশনে দেখাবে (ঐচ্ছিক)
                  </Label>
                  <Textarea
                    id="admin-note"
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="যেমন: নতুন চালান এসেছে — দাম হালনাগাদ"
                    className="text-sm"
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || productsInGrid.length === 0}
                  className="w-full h-12 bg-gold text-brand-deep hover:bg-gold-light font-bold text-base"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : "সেভ করুন"}
                </Button>

                {savedCount !== null && (
                  <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-brand">
                    <CheckCircle2 size={14} />
                    {toBn(savedCount)} টি দাম পরিবর্তন সংরক্ষিত হয়েছে
                  </p>
                )}

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 text-xs text-stone-warm transition hover:text-brick"
                  >
                    <LogOut size={13} />
                    লগআউট
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
