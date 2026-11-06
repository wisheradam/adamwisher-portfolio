import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About — Adam Wisher",
  description: "Adam Wisher's background in technology, mathematics, business leadership, product management, and digital transformation.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-8 lg:px-12 lg:py-12">
      <header className="flex items-center justify-between border-b border-border pb-6">
        <Link href="/" className="focus-ring rounded-sm font-display text-sm font-medium">Adam Wisher</Link>
        <Link href="/" className="focus-ring rounded-sm font-mono text-xs uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground">← Home</Link>
      </header>

      <section className="py-16 lg:py-24" aria-labelledby="about-heading">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)] lg:gap-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">About me</p>
            <h1 id="about-heading" className="mt-4 max-w-4xl font-display text-4xl font-medium tracking-tight sm:text-6xl">Technical thinking.<br />Business perspective.<br />Product leadership.</h1>
            <p className="mt-8 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">I’m Adam Wisher, a product leader who brings together technical thinking, a business perspective, and team management. At INNOVA, I lead Product Management and develop digital products, AI solutions, and integrations across enterprise systems.</p>
          </div>
          <div className="relative aspect-[4/5] w-full max-w-md lg:justify-self-end">
            <Image
              src="/adam-wisher-portrait.webp"
              alt="Black-and-white portrait of Adam Wisher"
              fill
              priority
              sizes="(min-width: 1024px) 420px, (min-width: 640px) 448px, calc(100vw - 48px)"
              className="object-cover object-[30%_center]"
              style={{
                maskImage: "radial-gradient(ellipse 70% 65% at 50% 42%, black 55%, transparent 100%)",
                WebkitMaskImage: "radial-gradient(ellipse 70% 65% at 50% 42%, black 55%, transparent 100%)",
              }}
            />
          </div>
        </div>

        <div className="mt-14 max-w-3xl">
          <div className="space-y-10">
            <section aria-labelledby="technical-heading">
              <h2 id="technical-heading" className="font-display text-2xl font-medium tracking-tight">A technical foundation, from the start.</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">My foundation is in mathematics and physics, paired with an early interest in IT. I began programming in BASIC and Pascal while still at school. Some of my first jobs involved assembling computers, configuring software environments, building computer networks, and developing websites with HTML and PHP. Later, I studied Python and completed a programming fundamentals course at Letpy. That experience helps me understand solution architecture, discuss technical constraints with engineers, and see how complex systems fit together.</p>
            </section>

            <section aria-labelledby="leadership-heading">
              <h2 id="leadership-heading" className="font-display text-2xl font-medium tracking-tight">Management across industries and scales.</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">My management experience spans different industries and organizational scales. I worked in retail network development at Belarus’s largest food retailer, an organization with around 60,000 employees. I served as CEO of a business unit within a large international agricultural holding, responsible for strategy, operations, and process automation. In the automotive sector, I worked as a Director of Business Development across Volkswagen, Toyota, and Lexus businesses, focusing on digital transformation, dealer network development, and new sales channels.</p>
            </section>

            <section aria-labelledby="education-heading">
              <h2 id="education-heading" className="font-display text-2xl font-medium tracking-tight">Mathematics, economics, and product management.</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">I completed my secondary education at a mathematics and physics lyceum, graduating after 11 school grades. I then earned a higher education qualification in Economics and Enterprise Management as an Economist-Manager, followed by a 12-month professional retraining program in Product Management at Yandex Practicum. My mathematical background shaped my analytical approach, while my economics education sharpened my focus on business models, resources, and results.</p>
            </section>

            <section aria-labelledby="negotiation-heading">
              <h2 id="negotiation-heading" className="font-display text-2xl font-medium tracking-tight">Leading teams. Finding common ground.</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">Management and negotiation are central to my work: leading cross-functional teams, aligning priorities, working with partners, and finding solutions that balance the needs of the business, users, and engineering. I have complemented hands-on experience with training in negotiation, sales, public speaking, management, analytics, and AI.</p>
            </section>

            <p className="border-l-2 border-accent pl-6 font-display text-xl leading-relaxed sm:text-2xl">I’m drawn to challenges that call for understanding a complex system, testing hypotheses with data, bringing people together, and organizing the work to turn an idea into a useful product.</p>
          </div>

        </div>
      </section>
    </main>
  );
}
