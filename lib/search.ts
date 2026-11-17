// A small BM25 search engine over this site's own content. It powers the
// "ask this page" console in the hero.
//
// It mirrors the shape of the RAG Knowledge Assistant project: content is
// split into chunks that carry their heading, a question is scored against
// every chunk, the top few come back as numbered sources, and the engine
// refuses when nothing on the page covers the question. The difference is that
// ranking here is lexical (BM25) and there is no LLM, so it runs entirely in
// the browser with no server and no API key.

import { about, education, links, lookingFor, projects, roles, skillAnchor, skills } from "./content";

export type Chunk = {
  id: string;
  /** Where the passage lives, shown as the citation label. */
  source: string;
  /** DOM id to jump to. */
  anchor: string;
  /** The passage shown to the reader. */
  text: string;
  /** Extra words indexed with the chunk but never shown (heading context and likely phrasings). */
  context: string;
};

export type Hit = { chunk: Chunk; score: number };

export type SearchResult =
  | { kind: "empty" }
  | { kind: "refusal"; terms: string[]; total: number }
  | { kind: "answer"; terms: string[]; missing: string[]; hits: Hit[]; matched: number; total: number };

// ---------- Corpus ----------

function buildChunks(): Chunk[] {
  const chunks: Chunk[] = [
    {
      id: "about",
      source: "About",
      anchor: "top",
      text: about,
      context: "who about background bio introduction location based live city where",
    },
    {
      id: "contact",
      source: "Contact",
      anchor: "contact",
      text: `${lookingFor} The best way to reach me is ${links.email}.`,
      context: "contact hire hiring reach email mail available availability open job position opportunity linkedin github resume cv",
    },
  ];

  for (const project of projects) {
    const anchor = `project-${project.repo}`;
    const source = `Work · ${project.title}`;
    const heading = `${project.title} project`;
    chunks.push({
      id: `${project.repo}-summary`,
      source,
      anchor,
      text: project.summary,
      context: `${heading} ${project.flow.join(" ")} what is how does it work`,
    });
    project.points.forEach((point, i) => {
      chunks.push({ id: `${project.repo}-point-${i}`, source, anchor, text: point, context: heading });
    });
    chunks.push({
      id: `${project.repo}-stack`,
      source,
      anchor,
      text: `Built with ${project.tags.join(", ")}.`,
      context: `${heading} stack technology technologies tools language framework`,
    });
    chunks.push({
      id: `${project.repo}-tests`,
      source,
      anchor,
      text: project.proof.map(({ value, label }) => `${value} ${label}`).join(". ") + ".",
      context: `${heading} tests tested testing proof numbers coverage`,
    });
  }

  for (const role of roles) {
    role.points.forEach((point, i) => {
      chunks.push({
        id: `${role.id}-point-${i}`,
        source: `Experience · ${role.org}`,
        anchor: `role-${role.id}`,
        text: point,
        context: `${role.org} ${role.title} ${role.when} experience job work worked company employer career`,
      });
    });
  }

  for (const [i, { degree, school, when }] of education.entries()) {
    chunks.push({
      id: `education-${i}`,
      source: "Education",
      anchor: "education",
      text: `${degree}, ${school}, ${when}.`,
      context: "education degree university college school study studied graduate graduated masters master bachelor qualification",
    });
  }

  for (const { group, items } of skills) {
    chunks.push({
      id: skillAnchor(group),
      source: `Skills · ${group}`,
      anchor: skillAnchor(group),
      text: `${group}: ${items.join(", ")}.`,
      context: "skills skill experience familiar proficient knowledge",
    });
  }

  return chunks;
}

// ---------- Text processing ----------

const STOPWORDS = new Set(
  (
    "a an and are as at be been but by can could did do does doing for from had has have having he her him his how i if in into is it its " +
    "me my of on or our she so than that the their them then there these they this to was we were what when where which who whom why will " +
    "with would you your yours hemanth pandiyaraj know knows knew tell say about any some ever get got use used using also just really " +
    "please thing things much many lot kind kinds sort am s t re ve ll d"
  ).split(" "),
);

const IRREGULAR: Record<string, string> = {
  built: "build",
  wrote: "write",
  written: "write",
  ran: "run",
  taught: "teach",
  spent: "spend",
  made: "make",
  led: "lead",
};

function stem(word: string): string {
  if (IRREGULAR[word]) return IRREGULAR[word];
  let w = word;
  if (w.length > 4 && w.endsWith("ies")) w = w.slice(0, -3) + "y";
  else if (w.length > 4 && /(sses|xes|ches|shes)$/.test(w)) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith("s") && !/(ss|us|is)$/.test(w)) w = w.slice(0, -1);

  const before = w;
  if (w.length > 5 && w.endsWith("ing")) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith("ed")) w = w.slice(0, -2);
  // "running" -> "runn" -> "run", but leave "call", "pass" alone
  if (w !== before && w.length > 2 && w.at(-1) === w.at(-2) && !"lsz".includes(w.at(-1)!)) w = w.slice(0, -1);

  if (w.length > 4 && w.endsWith("e")) w = w.slice(0, -1);
  return w;
}

/** Split text into stemmed terms. Returns pairs so callers can map a stem back to the word as written. */
function analyse(text: string): { raw: string; term: string }[] {
  const normalised = text
    .toLowerCase()
    .replace(/c#/g, " csharp ")
    .replace(/asp\.net/g, " aspnet dotnet ")
    .replace(/\.net\b/g, " dotnet ")
    .replace(/ci\/cd/g, " cicd ci cd ")
    .replace(/(\w+)\.js\b/g, " $1js $1 ")
    .replace(/[’']s\b/g, "");
  const out: { raw: string; term: string }[] = [];
  for (const raw of normalised.match(/[a-z0-9]+/g) ?? []) {
    if (STOPWORDS.has(raw)) continue;
    out.push({ raw, term: stem(raw) });
  }
  return out;
}

export function termsOf(text: string): string[] {
  return analyse(text).map(({ term }) => term);
}

// ---------- Index ----------

type Indexed = { chunk: Chunk; counts: Map<string, number>; length: number };

const K1 = 1.4;
const B = 0.6;
const TOP_K = 3;
/** Drop results that score far below the best one. */
const RELATIVE_FLOOR = 0.4;
/** Refuse when fewer than this share of the question's words appear anywhere on the page. */
const MIN_COVERAGE = 0.34;

const index: Indexed[] = buildChunks().map((chunk) => {
  const counts = new Map<string, number>();
  const terms = termsOf(`${chunk.text} ${chunk.context}`);
  for (const term of terms) counts.set(term, (counts.get(term) ?? 0) + 1);
  return { chunk, counts, length: terms.length };
});

const documentFrequency = new Map<string, number>();
for (const { counts } of index) {
  for (const term of counts.keys()) documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
}

const averageLength = index.reduce((sum, doc) => sum + doc.length, 0) / index.length;

const idf = (term: string) => {
  const df = documentFrequency.get(term) ?? 0;
  return Math.log(1 + (index.length - df + 0.5) / (df + 0.5));
};

export const corpusSize = index.length;

export function search(question: string): SearchResult {
  const analysed = analyse(question);
  const rawByTerm = new Map<string, string>();
  for (const { raw, term } of analysed) if (!rawByTerm.has(term)) rawByTerm.set(term, raw);
  const terms = [...rawByTerm.keys()];
  if (terms.length === 0) return { kind: "empty" };

  const scored: Hit[] = [];
  for (const doc of index) {
    let score = 0;
    for (const term of terms) {
      const tf = doc.counts.get(term);
      if (!tf) continue;
      score += (idf(term) * tf * (K1 + 1)) / (tf + K1 * (1 - B + (B * doc.length) / averageLength));
    }
    if (score > 0) scored.push({ chunk: doc.chunk, score });
  }
  scored.sort((a, b) => b.score - a.score);

  const known = terms.filter((term) => documentFrequency.has(term));
  const missing = terms.filter((term) => !documentFrequency.has(term)).map((term) => rawByTerm.get(term)!);
  const coverage = known.length / terms.length;

  if (scored.length === 0 || coverage < MIN_COVERAGE) {
    return { kind: "refusal", terms: terms.map((term) => rawByTerm.get(term)!), total: index.length };
  }

  const floor = scored[0].score * RELATIVE_FLOOR;
  return {
    kind: "answer",
    terms,
    missing,
    hits: scored.filter((hit) => hit.score >= floor).slice(0, TOP_K),
    matched: scored.length,
    total: index.length,
  };
}

/** Split a passage into segments, flagging the words that matched the question. */
export function highlight(text: string, terms: string[]): { text: string; hit: boolean }[] {
  const wanted = new Set(terms);
  const segments: { text: string; hit: boolean }[] = [];
  // Keep "Next.js", "CI/CD" and "C#" whole, but leave sentence punctuation outside the word.
  for (const part of text.split(/([A-Za-z0-9#]+(?:[./][A-Za-z0-9#]+)*)/)) {
    if (!part) continue;
    const hit = termsOf(part).some((term) => wanted.has(term));
    const last = segments.at(-1);
    if (last && last.hit === hit) last.text += part;
    else segments.push({ text: part, hit });
  }
  return segments;
}
