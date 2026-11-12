import { AskAdam } from "@/components/home/ask-adam";
import { Hero } from "@/components/home/hero";
import { SelectedWork } from "@/components/home/selected-work";

export const revalidate = 300;

export default function HomePage() {
  return (
    <main className="home-page page-shell">
      <Hero />
      <SelectedWork />
      <AskAdam />
    </main>
  );
}
