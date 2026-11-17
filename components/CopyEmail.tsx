"use client";

import { useState } from "react";
import { links } from "@/lib/content";

export default function CopyEmail() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(links.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be blocked; the address is still a visible mailto link beside this button.
    }
  };

  return (
    <button type="button" className="btn btn-lg" onClick={copy}>
      <span aria-live="polite">{copied ? "Copied" : "Copy address"}</span>
    </button>
  );
}
