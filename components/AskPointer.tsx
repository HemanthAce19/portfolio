import { corpusSize } from "@/lib/search";

// The RAG project's demo is the question box in the hero. This panel says so,
// and is straight about what the page version leaves out.

const ROWS = [
  { step: "Chunks", page: `${corpusSize} passages, each with its heading`, project: "Markdown split at headings" },
  { step: "Ranking", page: "BM25 on shared words", project: "Embeddings, cosine similarity" },
  { step: "Answer", page: "Quoted passages", project: "LLM, cited by number" },
  { step: "No match", page: "Says it doesn't know", project: "Says it doesn't know" },
];

export default function AskPointer() {
  return (
    <section className="console pointer" aria-label="How the page demo compares to the project">
      <header className="console-bar">
        <span className="console-title">
          <span className="dot" aria-hidden="true" />
          live demo
        </span>
        <span className="console-meta">you may have used it already</span>
      </header>

      <div className="pointer-body">
        <p>
          The question box at the top of this page follows the same retrieve, cite, or refuse pattern as this project.
        </p>
        <table>
          <thead>
            <tr>
              <td />
              <th scope="col">This page</th>
              <th scope="col">The project</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(({ step, page, project }) => (
              <tr key={step}>
                <th scope="row">{step}</th>
                <td>{page}</td>
                <td>{project}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <a className="btn btn-accent" href="#ask">
          Ask this page <span aria-hidden="true">↑</span>
        </a>
      </div>
    </section>
  );
}
