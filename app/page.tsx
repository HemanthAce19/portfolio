import FabricCanvas from "./FabricCanvas";

const GITHUB = "https://github.com/HemanthAce19";
const LINKEDIN = "https://www.linkedin.com/in/hemanthpandiyaraj";
const EMAIL = "hemanthpandiyaraj@gmail.com";
const RESUME = "/Hemanth_Pandiyaraj_Resume.pdf";

const projects = [
  {
    title: "Rate-Limited API Gateway",
    repo: "api-gateway",
    summary:
      "A reverse proxy that verifies a caller's JWT, applies a per-plan rate limit and forwards allowed requests upstream.",
    flow: ["client", "JWT check", "token bucket in Redis", "upstream API"],
    points: [
      "Token-bucket limiter runs as one atomic Lua script in Redis, so concurrent requests cannot race past the limit.",
      "Strips client-supplied identity headers and replaces them with values from the verified token.",
      "Fails open or closed, by configuration, when Redis is down.",
    ],
    tags: ["Python", "FastAPI", "asyncio", "Redis", "JWT", "Docker", "GitHub Actions"],
    proof: [
      ["10 / 200", "simultaneous requests allowed for a 10-per-minute user. Exactly the limit, every run."],
      ["47", "tests, including Redis outages"],
    ],
  },
  {
    title: "Real-Time Market Data Pipeline",
    repo: "market-pipeline",
    summary:
      "Streams live trades from Coinbase, computes rolling metrics in background workers and pushes both to clients over WebSocket.",
    flow: ["Coinbase feed", "asyncio ingestor", "Redis Streams", "Celery + pandas", "WebSocket API"],
    points: [
      "Ingestion, computation and delivery run as separate processes, so a slow calculation never delays incoming data.",
      "Reconnects with backoff, detects silent feeds and skips replayed trades.",
      "Slow WebSocket clients get bounded queues instead of stalling everyone else.",
    ],
    tags: ["Python", "asyncio", "Redis Streams", "Celery", "pandas", "WebSocket", "Docker"],
    proof: [
      ["1 s", "metric refresh over a 5-minute rolling window"],
      ["72", "tests, none needing the live exchange"],
    ],
  },
  {
    title: "RAG Knowledge Assistant",
    repo: "rag-knowledge-assistant",
    summary:
      "Answers questions about a folder of documents with numbered citations, and says \"I don't know\" when the documents don't cover it.",
    flow: ["documents", "chunks", "embeddings", "top-k search", "LLM", "cited answer"],
    points: [
      "Also runs as an MCP server, so AI clients like Claude Desktop can search the same knowledge base as a tool.",
      "Chunks follow document headings, so unrelated rules are never blended into one vector.",
      "The index records which embedding model built it, which prevents silently wrong results from a model mismatch.",
    ],
    tags: ["Python", "Embeddings", "Vector search", "LLM API", "MCP", "pytest"],
    proof: [
      ["2", "ways in: a command line and an MCP server, sharing one retrieval core"],
      ["16", "tests, including an end-to-end MCP client call"],
    ],
  },
];

const skills = [
  ["Languages", "Python, JavaScript, TypeScript, C#, Java, SQL"],
  ["Back end", "FastAPI, ASP.NET Core, Node.js, Express, REST APIs, WebSockets, Celery"],
  ["Front end", "Angular, React, Next.js, HTML and CSS"],
  ["Data", "PostgreSQL, SQL Server, MySQL, MongoDB, Redis"],
  ["AI", "LLM APIs, retrieval-augmented generation, embeddings, MCP servers"],
  ["Delivery", "Docker, GitHub Actions, Azure DevOps, Azure, pytest, Git"],
  ["Security", "OWASP Top 10, JWT and token auth, RBAC"],
];

export default function Home() {
  return (
    <div className="wrap">
      <nav aria-label="Main">
        <span className="id">hemanth.pandiyaraj</span>
        <span className="links">
          <a href="#work">work</a>
          <a href="#experience">experience</a>
          <a href="#skills">skills</a>
          <a href="#contact">contact</a>
        </span>
      </nav>

      <header className="hero">
        <div>
          <p className="eyebrow">Full-stack developer · Edmonton, Alberta</p>
          <h1>I build APIs and web apps, then try to break them before users do.</h1>
          <p className="lede">
            I&apos;m Hemanth. I spent <strong>two years at Deloitte</strong> building web applications for government
            and enterprise clients, then completed an <strong>MSc in Internetworking</strong> at the University of
            Alberta. I like back-end problems where correctness matters: concurrency, auth, data pipelines and AI
            tooling.
          </p>
          <div className="cta">
            <a className="btn primary" href="#work">See my work</a>
            <a className="btn" href={RESUME} download>Download resume</a>
            <a className="btn" href={GITHUB}>GitHub</a>
          </div>
        </div>
        <figure className="fabric-frame">
          <FabricCanvas />
          <figcaption>A spine-leaf network fabric, a nod to my networking MSc. Hover a switch.</figcaption>
        </figure>
      </header>

      <section id="work">
        <h2>01 / Selected work</h2>
        {projects.map((p) => (
          <article className="project" key={p.repo}>
            <div>
              <h3>{p.title}</h3>
              <p>{p.summary}</p>
              <ol className="flow" aria-label="How it works">
                {p.flow.map((step) => <li key={step}>{step}</li>)}
              </ol>
              <ul>
                {p.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
              <div className="tags">
                {p.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
              <a href={`${GITHUB}/${p.repo}`}>View code on GitHub →</a>
            </div>
            <div className="proof">
              {p.proof.map(([num, label]) => (
                <div key={num}>
                  <div className="num">{num}</div>
                  <div className="label">{label}</div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section id="experience">
        <h2>02 / Experience</h2>

        <div className="role">
          <div className="when">2022 to 2024</div>
          <div>
            <h3>Analyst, Full Stack Developer</h3>
            <p className="org">Deloitte</p>
            <ul>
              <li>Built Angular front-end modules for the State of Oregon&apos;s ONE eligibility platform, serving more than 1,000 concurrent users.</li>
              <li>Designed REST APIs and back-end services in C# and ASP.NET Core across 10+ services on Azure, with token-based auth and role-based access.</li>
              <li>Built an internal resource-management tool in Node.js that cut cross-team planning effort by 40% and earned a Best Performer Spot Award.</li>
              <li>Automated CI/CD pipelines in Azure DevOps and GitHub Actions with test, code-quality and security gates.</li>
            </ul>
          </div>
        </div>

        <div className="role">
          <div className="when">2026</div>
          <div>
            <h3>Graduate Teaching Assistant, Computer Networks</h3>
            <p className="org">University of Alberta</p>
            <ul>
              <li>Wrote Python autograding scripts and starter code for socket programming labs used by 90 students.</li>
              <li>Debugged student Python and C code live, and ran weekly labs on protocol design and packet analysis.</li>
            </ul>
          </div>
        </div>

        <div className="role">
          <div className="when">Education</div>
          <div>
            <h3>MSc, Internetworking</h3>
            <p className="org">University of Alberta, 2024 to 2026</p>
            <h3>Bachelor of Computer Applications</h3>
            <p className="org last">Sri Krishna College of Technology, 2019 to 2022</p>
          </div>
        </div>
      </section>

      <section id="skills">
        <h2>03 / Skills</h2>
        <dl className="skills">
          {skills.map(([group, items]) => (
            <div key={group}>
              <dt>{group}</dt>
              <dd>{items}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer id="contact">
        <h2>04 / Contact</h2>
        <p className="big">I&apos;m looking for a full-stack or back-end developer role. Let&apos;s talk.</p>
        <div className="cta">
          <a className="btn primary" href={`mailto:${EMAIL}`}>{EMAIL}</a>
          <a className="btn" href={LINKEDIN}>LinkedIn</a>
          <a className="btn" href={GITHUB}>GitHub</a>
          <a className="btn" href={RESUME} download>Resume (PDF)</a>
        </div>
        <p className="small">Hemanth Pandiyaraj · Edmonton, AB · Built with Next.js and plain CSS.</p>
      </footer>
    </div>
  );
}
