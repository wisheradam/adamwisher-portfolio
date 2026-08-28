import { HeroNavigation } from "@/components/home/hero-navigation";
import { HeroRobot } from "@/components/home/hero-robot";
import { AskAdam } from "@/components/home/ask-adam";

const EXPERTISE = [
  "Product Strategy",
  "AI & Automation",
  "B2B / Enterprise",
  "Product Analytics",
  "System Integration",
];

export function Hero() {
  return (
    <header className="mx-auto max-w-7xl px-6 pt-8 lg:px-12">
      <div className="hidden lg:block">
        <HeroNavigation />
      </div>

      <div className="grid grid-cols-1 gap-10 py-10 lg:grid-cols-[45%_55%] lg:items-center lg:gap-12 lg:pb-14 lg:pt-16">
        <div className="flex flex-col gap-7">
          <div className="order-1 flex flex-col gap-4">
            <div className="flex flex-col gap-1 font-mono text-xs uppercase tracking-wide text-muted-foreground">
              <span>Adam Wisher</span>
              <span>Product Manager</span>
            </div>
            <h1 className="font-display max-w-[22ch] text-4xl font-medium leading-[1.12] tracking-tight sm:max-w-[30ch] sm:text-5xl">
              Building complex digital products, AI-powered experiences, and
              connected systems.
            </h1>
          </div>

          <p className="order-2 max-w-[52ch] text-base leading-relaxed text-muted-foreground">
            I work at the intersection of product strategy, technology, AI
            and user experience — turning complex business problems into
            products people can actually use.
          </p>

          <ul className="order-3 flex flex-wrap gap-2" aria-label="Areas of expertise">
            {EXPERTISE.map((item) => (
              <li
                key={item}
                className="rounded-full border border-border px-3 py-1.5 font-mono text-xs text-muted-foreground"
              >
                {item}
              </li>
            ))}
          </ul>

          <div className="order-4">
            <AskAdam />
          </div>

          <div className="order-5 lg:hidden">
            <HeroNavigation />
          </div>
        </div>

        <div className="order-6 lg:order-none">
          <HeroRobot />
        </div>
      </div>
    </header>
  );
}
