import { links, type Project } from "@/lib/content";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="project">
      <div>
        <h3>
          <a href={`${links.github}/${project.repo}`}>{project.title}</a>
        </h3>
        <p className="summary">{project.summary}</p>
        <p className="flow">{project.flow.join("  →  ")}</p>
        <ul className="points">
          {project.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <p className="stack">{project.tags.join(" · ")}</p>
      </div>
      <dl className="proof">
        {project.proof.map(({ value, label }) => (
          <div key={value}>
            <dt>{value}</dt>
            <dd>{label}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
