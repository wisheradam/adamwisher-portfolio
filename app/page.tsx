import { metadataForPath } from "@/lib/seo/public-pages";
import { AskAdam } from "@/components/home/ask-adam";
import { Hero } from "@/components/home/hero";
import { SelectedWork } from "@/components/home/selected-work";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="home-page page-shell">
      <Hero />
      <SelectedWork />
      <AskAdam />
    </main>
  );
}

export async function generateMetadata(){return metadataForPath("/");}
