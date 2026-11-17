// All site content lives here, typed, so the components stay presentational.
// The "ask this page" search index in lib/search.ts is built from this file too.

export const site = {
  name: "Hemanth Pandiyaraj",
  role: "AI and Full-Stack Developer",
  location: "Edmonton, AB",
  url: "https://portfolio-hemanth-pandiyaraj.vercel.app",
} as const;

export const links = {
  github: "https://github.com/HemanthAce19",
  linkedin: "https://www.linkedin.com/in/hemanthpandiyaraj",
  email: "hemanthpandiyaraj@gmail.com",
  resume: "/Hemanth_Pandiyaraj_Resume.pdf",
  source: "https://github.com/HemanthAce19/portfolio",
} as const;

export const about =
  "I'm Hemanth, a developer in Edmonton. I spent two years at Deloitte building full-stack web applications for government and enterprise clients, then completed an MSc at the University of Alberta. Now I build retrieval systems, LLM tooling and the services behind them.";

export const lookingFor =
  "I'm looking for a developer role working on AI products or the systems behind them.";

export type Demo = "ask" | "bucket" | "feed";

export type Project = {
  title: string;
  repo: string;
  summary: string;
  flow: string[];
  points: string[];
  tags: string[];
  tests: number;
  proof: { value: string; label: string }[];
  demo: Demo;
};

export const projects: Project[] = [
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
    tests: 16,
    proof: [
      { value: "2", label: "ways in: a command line and an MCP server, sharing one retrieval core" },
      { value: "16", label: "tests, including an end-to-end MCP client call" },
    ],
    demo: "ask",
  },
  {
    title: "Rate-Limited API Gateway",
    repo: "api-gateway",
    summary:
      "A reverse proxy that verifies a caller's JWT, applies a per-plan rate limit and forwards allowed requests upstream.",
    flow: ["client", "JWT check", "token bucket in Redis", "upstream API"],
    points: [
      "The token-bucket limiter runs as one atomic Lua script in Redis, so concurrent requests cannot race past the limit.",
      "Client-supplied identity headers are stripped and replaced with values from the verified token.",
      "Fails open or closed, by configuration, when Redis is down.",
    ],
    tags: ["Python", "FastAPI", "asyncio", "Redis", "JWT", "Docker", "GitHub Actions"],
    tests: 47,
    proof: [
      { value: "10 / 200", label: "simultaneous requests let through for a 10-per-minute user. Exactly the limit, every run." },
      { value: "47", label: "tests, including Redis outages" },
    ],
    demo: "bucket",
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
    tests: 72,
    proof: [
      { value: "1 s", label: "metric refresh over a 5-minute rolling window" },
      { value: "72", label: "tests, none needing the live exchange" },
    ],
    demo: "feed",
  },
];

export const totalTests = projects.reduce((sum, project) => sum + project.tests, 0);

export type Role = { id: string; when: string; title: string; org: string; points: string[] };

export const roles: Role[] = [
  {
    id: "deloitte",
    when: "2022 to 2024",
    title: "Analyst, Full Stack Developer",
    org: "Deloitte",
    points: [
      "Built Angular front-end modules for the State of Oregon's ONE eligibility platform, serving more than 1,000 concurrent users.",
      "Designed REST APIs and back-end services in C# and ASP.NET Core across 10+ services on Azure, with token-based auth and role-based access.",
      "Built an internal resource-management tool in Node.js that cut cross-team planning effort by 40% and earned a Best Performer Spot Award.",
      "Automated CI/CD pipelines in Azure DevOps and GitHub Actions with test, code-quality and security gates.",
    ],
  },
  {
    id: "teaching",
    when: "2026",
    title: "Graduate Teaching Assistant",
    org: "University of Alberta",
    points: [
      "Wrote Python autograding scripts and starter code for programming labs used by 90 students.",
      "Debugged student Python and C code live across Windows, macOS and Linux, and ran weekly labs and office hours.",
    ],
  },
];

export const education: { degree: string; school: string; when: string }[] = [
  { degree: "Master of Science (MSc)", school: "University of Alberta", when: "2024 to 2026" },
  { degree: "Bachelor of Computer Applications", school: "Sri Krishna College of Technology", when: "2019 to 2022" },
];

export const skills: { group: string; items: string[] }[] = [
  { group: "AI", items: ["LLM APIs", "Retrieval-augmented generation", "Embeddings", "Vector search", "MCP servers"] },
  { group: "Languages", items: ["Python", "TypeScript", "JavaScript", "C#", "Java", "SQL"] },
  { group: "Back end", items: ["FastAPI", "ASP.NET Core", "Node.js", "Express", "REST APIs", "WebSockets", "Celery"] },
  { group: "Front end", items: ["React", "Next.js", "Angular", "HTML", "CSS"] },
  { group: "Data", items: ["PostgreSQL", "SQL Server", "MySQL", "MongoDB", "Redis"] },
  { group: "Delivery", items: ["Docker", "GitHub Actions", "Azure DevOps", "Azure", "pytest", "Git"] },
  { group: "Security", items: ["OWASP Top 10", "JWT auth", "RBAC"] },
];

/** Stable DOM id for a skills row, shared by the page and the search index. */
export const skillAnchor = (group: string) => `skills-${group.toLowerCase().replace(/\s+/g, "-")}`;
