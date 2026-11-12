import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
export function Hero() {
  return (
    <>
      <SiteHeader />
      <section className="hero-panel" aria-labelledby="hero-heading">
        <span className="pill">Product leadership</span>
        <h1 id="hero-heading">
          <span className="hero-line">
            Building
            <br className="mobile-break" /> complex digital
          </span>{" "}
          <span className="hero-line">
            products, AI-
            <br className="mobile-break" />
            powered
          </span>{" "}
          <span className="hero-line">
            experiences,
            <br className="mobile-break" /> and connected
          </span>{" "}
          <span className="hero-line">systems.</span>
        </h1>
        <p>
          I work at the intersection of product strategy, technology, AI and
          user experience — turning complex business problems into products
          people can actually use.
        </p>
        <Link href="#selected-work" className="primary-button focus-ring">
          View selected work <span aria-hidden="true">↓</span>
        </Link>
      </section>
    </>
  );
}
