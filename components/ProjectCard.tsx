import AskPointer from "@/components/AskPointer";
import LiveFeedDemo from "@/components/LiveFeedDemo";
import TokenBucketDemo from "@/components/TokenBucketDemo";
import { links, type Project } from "@/lib/content";

const demos = {
  ask: AskPointer,
  bucket: TokenBucketDemo,
  feed: LiveFeedDemo,
} as const;

export default function ProjectCard({ project, index }: { project: Project; index: number }) {
  const Demo = demos[project.demo];
  const repoUrl = `${links.github}/${project.repo}`;

  return (
    <article className="project reveal" id={`project-${project.repo}`}>
      <div className="project-copy">
        <p className="project-index" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </p>
        <h3>
          <a href={repoUrl}>{project.title}</a>
        </h3>
        <p className="summary">{project.summary}</p>

        <ol className="flow" aria-label="How data flows through it">
          {project.flow.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <ul className="points">
          {project.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>

        <dl className="proof">
          {project.proof.map(({ value, label }) => (
            <div key={value}>
              <dt>{value}</dt>
              <dd>{label}</dd>
            </div>
          ))}
        </dl>

        <ul className="tags" aria-label="Built with">
          {project.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>

        <a className="repo-link" href={repoUrl}>
          Read the code on GitHub <span aria-hidden="true">↗</span>
        </a>
      </div>

      <div className="project-demo">
        <Demo />
      </div>
    </article>
  );
}
