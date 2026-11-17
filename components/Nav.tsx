"use client";

import { useEffect, useState } from "react";
import { links, site } from "@/lib/content";

const SECTIONS = [
  { id: "work", label: "Work" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
] as const;

export default function Nav() {
  const [active, setActive] = useState<string | null>(null);

  // A section is "current" while it crosses the middle band of the viewport.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const { id } of SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <header className="nav">
      <nav className="wrap nav-inner" aria-label="Main">
        <a className="brand" href="#top">
          <span className="brand-mark" aria-hidden="true">HP</span>
          <span className="brand-name">{site.name}</span>
        </a>
        <ul>
          {SECTIONS.map(({ id, label }) => (
            <li key={id}>
              <a href={`#${id}`} aria-current={active === id ? "true" : undefined}>
                {label}
              </a>
            </li>
          ))}
        </ul>
        <a className="btn nav-resume" href={links.resume} download>
          Resume
        </a>
      </nav>
    </header>
  );
}
