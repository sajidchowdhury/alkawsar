"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ImagePlus, Loader2, LogOut, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, TIERS } from "@/lib/tiers";
import { withBasePath } from "@/lib/base-path";
import { fileToCompressedDataUrl, handleImgError, productImageSrc } from "@/lib/images";
import { toBn } from "@/lib/bn";
import { cn } from "@/lib/utils";
import type { PublicData } from "@/lib/api-types";

type PriceGrid = Record<string, Record<string, string>>;

function gridFromData(data: PublicData | null): PriceGrid {
  const grid: PriceGrid = {};
  for (const p of data?.products ?? []) {
    const row: Record<string, string> = {};
    for (const t of TIERS) {
      // Unset prices (0) show as empty inputs — cleaner for brand-new products.
      row[t.id] = p.prices[t.id]?.price ? String(p.prices[t.id].price) : "";
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
  const [stocks, setStocks] = useState<Record<string, boolean>>({});
  const [packSizes, setPackSizes] = useState<Record<string, string>>({});
  const [uploadingSlug, setUploadingSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  // Product management
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [addNameBn, setAddNameBn] = useState("");
  const [addNameEn, setAddNameEn] = useState("");
  const [addCategory, setAddCategory] = useState("dates");
  const [addGradeBn, setAddGradeBn] = useState("");
  const [addDescBn, setAddDescBn] = useState("");
  const [addPackSize, setAddPackSize] = useState("");

  // Latest data via ref — lets us sync the form on open without clobbering edits.
  const dataRef = useRef<PublicData | null>(null);
  dataRef.current = data;

  function syncFormFromData() {
    const d = dataRef.current;
    if (!d) return;
    setGrid(gridFromData(d));
    setNote(d.meta.noteBn ?? "");
    const s: Record<string, boolean> = {};
    const pk: Record<string, string> = {};
    d.products.forEach((p) => {
      s[p.slug] = p.stock === "available";
      pk[p.slug] = p.packSizeBn ?? "৩ কেজি";
    });
    setStocks(s);
    setPackSizes(pk);
  }

  // Initialize the form each time the panel opens.
  useEffect(() => {
    if (open) syncFormFromData();
  }, [open]);

  // Restore session when opened.
  useEffect(() => {
    if (!open) return;
    setChecking(true);
    fetch(withBasePath("/api/admin/session"), { cache: "no-store" })
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
      const res = await fetch(withBasePath("/api/admin/login"), {
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
      const packSizesOut: Record<string, string> = {};
      for (const [slug, v] of Object.entries(packSizes)) packSizesOut[slug] = v;

      const res = await fetch(withBasePath("/api/admin/prices"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prices, stock, packSizes: packSizesOut, noteBn: note }),
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
    await fetch(withBasePath("/api/admin/logout"), { method: "POST" }).catch(() => undefined);
    setAuthed(false);
    toast("লগআউট হয়েছে");
  }

  async function handleUploadImage(slug: string, file: File) {
    setUploadingSlug(slug);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      const res = await fetch(withBasePath("/api/admin/product-image"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, dataUrl }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        toast.success("ছবি আপলোড হয়েছে — সাইটে দেখা যাবে");
        onSaved();
      } else {
        toast.error(json.error || "আপলোড হয়নি");
      }
    } catch {
      toast.error("ছবি প্রসেস করা যায়নি — আবার চেষ্টা করুন");
    } finally {
      setUploadingSlug(null);
    }
  }

  async function handleRemoveImage(slug: string) {
    setUploadingSlug(slug);
    try {
      const res = await fetch(withBasePath(`/api/admin/product-image?slug=${encodeURIComponent(slug)}`), {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        toast.success("ছবি মুছে ফেলা হয়েছে");
        onSaved();
      } else {
        toast.error(json.error || "মুছে ফেলা যায়নি");
      }
    } catch {
      toast.error("সংযোগ সমস্যা — আবার চেষ্টা করুন");
    } finally {
      setUploadingSlug(null);
    }
  }

  function resetAddForm() {
    setAddNameBn("");
    setAddNameEn("");
    setAddCategory("dates");
    setAddGradeBn("");
    setAddDescBn("");
    setAddPackSize("");
    setShowAdd(false);
  }

  async function handleAddProduct(e?: React.FormEvent) {
    e?.preventDefault();
    if (!addNameBn.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(withBasePath("/api/admin/products"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameBn: addNameBn,
          nameEn: addNameEn,
          category: addCategory,
          gradeBn: addGradeBn,
          descBn: addDescBn,
          packSizeBn: addPackSize,
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        toast.success(`"${addNameBn}" যোগ হয়েছে — এখন দাম বসিয়ে সেভ করুন`);
        resetAddForm();
        onSaved();
      } else {
        toast.error(json.error || "যোগ করা যায়নি");
      }
    } catch {
      toast.error("সংযোগ সমস্যা — আবার চেষ্টা করুন");
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteProduct(slug: string, nameBn: string) {
    if (!window.confirm(`"${nameBn}" পণ্যটি মুছে ফেলবেন? এর দাম-ইতিহাসও মুছে যাবে।`)) return;
    setDeletingSlug(slug);
    try {
      const res = await fetch(withBasePath(`/api/admin/products?slug=${encodeURIComponent(slug)}`), {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        toast.success(`"${nameBn}" মুছে ফেলা হয়েছে`);
        onSaved();
      } else {
        toast.error(json.error || "মুছে ফেলা যায়নি");
      }
    } catch {
      toast.error("সংযোগ সমস্যা — আবার চেষ্টা করুন");
    } finally {
      setDeletingSlug(null);
    }
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
                        <h3 className="font-bengali text-sm font-bold text-brand">
                          {p.nameBn}
                          <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand/80">
                            {p.category === "dates" ? "খেজুর" : "অন্যান্য"}
                          </span>
                        </h3>
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
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.slug, p.nameBn)}
                          disabled={deletingSlug !== null}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-brick/70 transition hover:bg-brick/10 hover:text-brick disabled:opacity-40"
                          aria-label={`${p.nameBn} মুছে ফেলুন`}
                          title="পণ্য মুছে ফেলুন"
                        >
                          {deletingSlug === p.slug ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      </div>
                    </div>
                    {/* image + packet size row */}
                    <div className="mt-3 flex items-start gap-3 rounded-xl border border-gold/20 bg-cream/60 p-3">
                      <label
                        htmlFor={`img-${p.slug}`}
                        className="relative block h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl bg-white ring-1 ring-gold/40 transition hover:ring-gold"
                        title="ছবি আপলোড করুন"
                      >
                        <img
                          src={productImageSrc(p)}
                          onError={handleImgError}
                          alt={`${p.nameBn} ছবি`}
                          className="h-full w-full object-cover"
                        />
                        {uploadingSlug === p.slug && (
                          <span className="absolute inset-0 flex items-center justify-center bg-brand-deep/60">
                            <Loader2 size={18} className="animate-spin text-cream" />
                          </span>
                        )}
                      </label>
                      <div className="min-w-0 flex-1 space-y-2">
                        <input
                          id={`img-${p.slug}`}
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadImage(p.slug, f);
                            e.target.value = "";
                          }}
                        />
                        <div className="flex flex-wrap items-center gap-1.5">
                          <label
                            htmlFor={`img-${p.slug}`}
                            className={cn(
                              "inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-lg border border-brand/30 px-2.5 text-[11px] font-bold text-brand transition hover:bg-brand/10 active:scale-95",
                              uploadingSlug === p.slug && "pointer-events-none opacity-50"
                            )}
                          >
                            <ImagePlus size={13} />
                            {p.hasImage ? "ছবি বদলান" : "ছবি আপলোড"}
                          </label>
                          {p.hasImage && (
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(p.slug)}
                              disabled={uploadingSlug !== null}
                              className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-brick/30 px-2.5 text-[11px] font-bold text-brick transition hover:bg-brick/10 active:scale-95 disabled:opacity-50"
                            >
                              <Trash2 size={12} />
                              মুছুন
                            </button>
                          )}
                          <span className="inline-flex items-center gap-1 text-[10px] text-stone-warm">
                            <Upload size={10} />
                            সাইটে দেখাবে
                          </span>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`pack-${p.slug}`} className="text-[11px] text-stone-warm">
                            প্যাকেট মাপ (প্রতি বাক্স)
                          </Label>
                          <Input
                            id={`pack-${p.slug}`}
                            value={packSizes[p.slug] ?? ""}
                            onChange={(e) =>
                              setPackSizes((s) => ({ ...s, [p.slug]: e.target.value.slice(0, 30) }))
                            }
                            placeholder="যেমন: ৩ কেজি"
                            className="h-9 font-bengali text-sm"
                          />
                        </div>
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

                {/* ── product management ─────────────────────────────────── */}
                <div className="rounded-2xl border border-brand/25 bg-white/60 p-4">
                  {!showAdd ? (
                    <button
                      type="button"
                      onClick={() => setShowAdd(true)}
                      className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-brand/30 font-bengali text-sm font-bold text-brand transition hover:bg-brand/10 active:scale-[0.99]"
                    >
                      <Plus size={16} />
                      নতুন পণ্য যোগ করুন
                    </button>
                  ) : (
                    <form onSubmit={handleAddProduct} className="space-y-3">
                      <p className="font-bengali text-sm font-bold text-brand">নতুন পণ্য</p>
                      <div className="space-y-1.5">
                        <Label htmlFor="add-name-bn" className="text-xs">
                          বাংলা নাম <span className="text-brick">*</span>
                        </Label>
                        <Input
                          id="add-name-bn"
                          value={addNameBn}
                          onChange={(e) => setAddNameBn(e.target.value)}
                          placeholder="যেমন: আজওয়া"
                          className="h-11 font-bengali"
                          autoFocus
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1.5">
                          <Label htmlFor="add-name-en" className="text-xs">
                            English নাম
                          </Label>
                          <Input
                            id="add-name-en"
                            value={addNameEn}
                            onChange={(e) => setAddNameEn(e.target.value)}
                            placeholder="Ajwa"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="add-grade" className="text-xs">
                            গ্রেড / ধরন
                          </Label>
                          <Input
                            id="add-grade"
                            value={addGradeBn}
                            onChange={(e) => setAddGradeBn(e.target.value)}
                            placeholder="প্রিমিয়াম"
                            className="h-11 font-bengali"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">ক্যাটাগরি</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {CATEGORIES.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setAddCategory(c.id)}
                              className={cn(
                                "min-h-10 rounded-xl border font-bengali text-xs font-bold transition active:scale-[0.98]",
                                addCategory === c.id
                                  ? "border-brand bg-brand text-cream"
                                  : "border-brand/30 text-brand hover:bg-brand/10"
                              )}
                            >
                              {c.labelBn}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="add-desc" className="text-xs">
                          ছোট বর্ণনা (ঐচ্ছিক)
                        </Label>
                        <Input
                          id="add-desc"
                          value={addDescBn}
                          onChange={(e) => setAddDescBn(e.target.value)}
                          placeholder="যেমন: গাঢ় কালো, নরম ও তিল-তেল দানা"
                          className="h-11 font-bengali"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="add-pack" className="text-xs">
                          প্যাকেট মাপ (ঐচ্ছিক — ডিফল্ট ৩ কেজি)
                        </Label>
                        <Input
                          id="add-pack"
                          value={addPackSize}
                          onChange={(e) => setAddPackSize(e.target.value.slice(0, 30))}
                          placeholder="৩ কেজি"
                          className="h-11 font-bengali"
                        />
                      </div>
                      <div className="flex gap-2 pt-0.5">
                        <Button
                          type="submit"
                          disabled={adding || !addNameBn.trim()}
                          className="h-11 flex-1 bg-brand text-cream hover:bg-brand-soft font-bold"
                        >
                          {adding ? <Loader2 className="animate-spin" size={17} /> : "যোগ করুন"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={resetAddForm}
                          disabled={adding}
                          className="h-11 font-bengali"
                        >
                          বাতিল
                        </Button>
                      </div>
                    </form>
                  )}
                </div>

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
