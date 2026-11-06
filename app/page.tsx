import { Hero } from "@/components/home/hero";

export const revalidate = 300;

export default function HomePage() {
  return (
    <main>
      <Hero />
    </main>
  );
}
