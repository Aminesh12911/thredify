import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/site";
import { AuthProvider } from "@/lib/auth/AuthProvider";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "THREADIFY", url: SITE_URL, slogan: "Wear Your Point of View.", description: "Academic demo custom T-shirt store (sample business, not a registered company)." }} />
      <AnnouncementBar />
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
    </AuthProvider>
  );
}
