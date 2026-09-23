import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { Portfolio } from "@/components/portfolio/Portfolio";
import { SplashCursor } from "@/components/portfolio/SplashCursor";

const StoreOverlay = lazy(() =>
  import("@/components/store/StoreOverlay").then((m) => ({ default: m.StoreOverlay })),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Abhyanshu Raj — Frontend Developer" },
      { name: "description", content: "Portfolio and premium digital store by Abhyanshu Raj — React, Next.js templates, apps, free resources, and services." },
      { property: "og:title", content: "Abhyanshu Raj — Frontend Developer" },
      { property: "og:description", content: "Portfolio and premium digital store — templates, apps, resources, and services." },
    ],
  }),
  component: Index,
});

function Index() {
  const [storeOpen, setStoreOpen] = useState(false);
  return (
    <>
      <SplashCursor
        DENSITY_DISSIPATION={3.5}
        VELOCITY_DISSIPATION={2}
        PRESSURE={0.1}
        CURL={3}
        SPLAT_RADIUS={0.2}
        SPLAT_FORCE={6000}
        COLOR_UPDATE_SPEED={10}
        SHADING
        RAINBOW_MODE={false}
        COLOR="#ed7520"
      />
      <div className={`portfolio-under${storeOpen ? " blurred" : ""}`} aria-hidden={storeOpen}>

        <Portfolio onOpenStore={() => setStoreOpen(true)} />
      </div>
      <Suspense fallback={null}>
        {/* Render once mounted; StoreOverlay handles its own open/close transitions */}
        <StoreOverlay open={storeOpen} onClose={() => setStoreOpen(false)} />
      </Suspense>
    </>
  );
}
