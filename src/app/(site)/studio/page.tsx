import type { Metadata } from "next";
import { StudioClient } from "@/components/studio/StudioClient";

export const metadata: Metadata = {
  title: "Custom T-shirt Studio",
  description:
    "Design your own T-shirt: choose colour and fit, upload artwork, add text, drag it into place and preview it live before ordering.",
};

export default function StudioPage() {
  return (
    <main className="container-page page-enter py-8 sm:py-12">
      <p className="eyebrow">Custom Studio</p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">Design your own</h1>
      <p className="mt-3 max-w-xl text-charcoal/70">
        Pick a shirt, add your art or words, and drag them into place. What you see is what we print.
      </p>
      <div className="mt-8">
        <StudioClient />
      </div>
    </main>
  );
}
