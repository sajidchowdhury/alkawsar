"use client";

import { useCallback, useEffect, useState } from "react";
import { withBasePath } from "@/lib/base-path";
import type { PublicData } from "@/lib/api-types";
import Hero from "./Hero";
import Ticker from "./Ticker";
import PriceSection from "./PriceSection";
import TrustSection from "./TrustSection";
import StorySection from "./StorySection";
import OrderSection from "./OrderSection";
import Footer from "./Footer";
import StickyBar from "./StickyBar";
import AdminPanel from "./AdminPanel";

export default function Landing() {
  const [data, setData] = useState<PublicData | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(withBasePath("/api/prices"), { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as PublicData;
      setData(json);
    } catch {
      // silent — next poll will retry
    }
  }, []);

  useEffect(() => {
    let alive = true;
    const kickoff = setTimeout(() => {
      if (alive) load();
    }, 0);
    const timer = setInterval(load, 45000);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      clearTimeout(kickoff);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  return (
    <div className="min-h-screen flex flex-col bg-cream text-ink">
      <Hero />
      <Ticker />
      <PriceSection data={data} />
      <TrustSection />
      <StorySection />
      <OrderSection />
      <Footer onOwner={() => setAdminOpen(true)} />
      <StickyBar />
      <AdminPanel open={adminOpen} onClose={() => setAdminOpen(false)} onSaved={load} data={data} />
    </div>
  );
}
