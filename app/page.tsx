import { Hero } from "@/components/home/hero";
import { SelectedWork } from "@/components/home/selected-work";

export const revalidate = 300;

export default function HomePage() {
  return (
    <main>
      <Hero />
      <SelectedWork />
    </main>
  );
}
