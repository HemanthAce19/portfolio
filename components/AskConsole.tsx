"use client";

import { useEffect, useRef, useState } from "react";
import { corpusSize, highlight, search, type SearchResult } from "@/lib/search";

// The hero demo: a question box that searches this page's own content and
// answers with numbered, linked sources, or refuses when nothing covers the
// question. See lib/search.ts for the engine.

const STARTER = "What did you do at Deloitte?";

const SUGGESTIONS = [
  STARTER,
  "How does the rate limiter work?",
  "Do you know React?",
  "What's your favourite pizza?",
];

type Run = { question: string; result: SearchResult; ms: number | null };

export default function AskConsole() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  // The starter answer is computed during render, so it is in the static HTML.
  const [run, setRun] = useState<Run>(() => ({ question: STARTER, result: search(STARTER), ms: null }));

  const ask = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed) return;
    const start = performance.now();
    const result = search(trimmed);
    setRun({ question: trimmed, result, ms: performance.now() - start });
  };

  // "/" focuses the box from anywhere, unless the visitor is already typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { question, result, ms } = run;

  return (
    <section className="console ask" id="ask" aria-label="Ask this page">
      <header className="console-bar">
        <span className="console-title">
          <span className="dot" aria-hidden="true" />
          ask this page
        </span>
        <span className="console-meta">BM25 · {corpusSize} chunks · in your browser</span>
      </header>

      <form
        className="ask-form"
        onSubmit={(e) => {
          e.preventDefault();
          ask(draft);
        }}
      >
        <label className="sr-only" htmlFor="ask-input">
          Ask a question about Hemanth&apos;s work
        </label>
        <span className="ask-prompt" aria-hidden="true">›</span>
        <input
          id="ask-input"
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask about my work, skills or experience"
          autoComplete="off"
          spellCheck={false}
          maxLength={160}
        />
        <kbd className="ask-key" aria-hidden="true">/</kbd>
        <button type="submit">Ask</button>
      </form>

      <ul className="ask-chips" aria-label="Example questions">
        {SUGGESTIONS.map((suggestion) => (
          <li key={suggestion}>
            <button
              type="button"
              aria-pressed={suggestion === question}
              onClick={() => {
                setDraft("");
                ask(suggestion);
              }}
            >
              {suggestion}
            </button>
          </li>
        ))}
      </ul>

      <div className="ask-output" aria-live="polite">
        <p className="ask-question">
          <span aria-hidden="true">Q</span>
          {question}
        </p>

        {result.kind === "empty" && (
          <p className="ask-refusal">That question has no searchable words in it. Try naming a project, a skill or a company.</p>
        )}

        {result.kind === "refusal" && (
          <>
            <p className="ask-refusal">
              <strong>I don&apos;t know.</strong> Nothing on this page covers that, and I would rather say so than guess.
            </p>
            <p className="ask-trace">
              searched {result.total} chunks for {result.terms.map((term) => `"${term}"`).join(", ")} · 0 matched
              {ms !== null && ` · ${formatMs(ms)}`}
            </p>
          </>
        )}

        {result.kind === "answer" && (
          <>
            <ol className="ask-hits">
              {result.hits.map(({ chunk, score }, i) => (
                // key includes the question so the entry animation replays on every new answer
                <li key={`${question}-${chunk.id}`} style={{ animationDelay: `${i * 70}ms` }}>
                  <p>
                    {highlight(chunk.text, result.terms).map((segment, j) =>
                      segment.hit ? <mark key={j}>{segment.text}</mark> : <span key={j}>{segment.text}</span>,
                    )}{" "}
                    <a className="cite" href={`#${chunk.anchor}`} aria-label={`Source ${i + 1}: ${chunk.source}`}>
                      [{i + 1}]
                    </a>
                  </p>
                  <a className="ask-source" href={`#${chunk.anchor}`}>
                    <span className="ask-source-n">[{i + 1}]</span>
                    <span className="ask-source-name">{chunk.source}</span>
                    <span className="ask-score" aria-hidden="true">
                      <span style={{ width: `${Math.round((score / result.hits[0].score) * 100)}%` }} />
                    </span>
                    <span className="ask-score-n">score {score.toFixed(2)}</span>
                  </a>
                </li>
              ))}
            </ol>
            {result.missing.length > 0 && (
              <p className="ask-trace">no match on this page for {result.missing.map((term) => `"${term}"`).join(", ")}</p>
            )}
            <p className="ask-trace">
              scored {result.total} chunks · {result.matched} matched · kept top {result.hits.length}
              {ms !== null && ` · ${formatMs(ms)}`}
            </p>
          </>
        )}
      </div>

      <p className="console-note">
        Retrieval only: passages are quoted, not generated. The full version, with embeddings and an LLM, is the{" "}
        <a href="#project-rag-knowledge-assistant">RAG Knowledge Assistant</a>.
      </p>
    </section>
  );
}

function formatMs(ms: number) {
  return ms < 1 ? "under 1 ms" : `${ms.toFixed(1)} ms`;
}
