import FabricCanvas from "@/components/FabricCanvas";
import ProjectCard from "@/components/ProjectCard";
import { education, links, projects, roles, skills } from "@/lib/content";

export default function Home() {
  return (
    <div className="wrap">
      <nav className="nav" aria-label="Main">
        <a className="name" href="#top">Hemanth Pandiyaraj</a>
        <ul>
          <li><a href="#work">Work</a></li>
          <li><a href="#experience">Experience</a></li>
          <li><a href="#skills">Skills</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>

      <main id="top">
        <header className="hero">
          <h1>
            I build AI applications: retrieval systems, LLM tooling, and the back ends that keep them reliable.
          </h1>
          <p className="lede">
            I&apos;m Hemanth, a developer in Edmonton. Before this I spent two years at Deloitte building full-stack
            web applications for government and enterprise clients, and finished an MSc in Internetworking at the
            University of Alberta.
          </p>
          <p className="hero-links">
            <a href={links.resume} download>Resume</a>
            <a href={links.github}>GitHub</a>
            <a href={links.linkedin}>LinkedIn</a>
            <a href={`mailto:${links.email}`}>Email</a>
          </p>
          <figure className="fabric-frame">
            <FabricCanvas />
            <figcaption>
              My degree was in networking, so here is a spine-leaf fabric routing packets. Hover a switch.
            </figcaption>
          </figure>
        </header>

        <section id="work">
          <h2>Work</h2>
          {projects.map((project) => (
            <ProjectCard key={project.repo} project={project} />
          ))}
        </section>

        <section id="experience">
          <h2>Experience</h2>
          {roles.map((role) => (
            <article className="role" key={role.title}>
              <p className="when">{role.when}</p>
              <div>
                <h3>{role.title}</h3>
                <p className="org">{role.org}</p>
                <ul className="points">
                  {role.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
          <article className="role">
            <p className="when">Education</p>
            <div>
              {education.map(({ degree, school }) => (
                <div className="degree" key={degree}>
                  <h3>{degree}</h3>
                  <p className="org">{school}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section id="skills">
          <h2>Skills</h2>
          <dl className="skills">
            {skills.map(({ group, items }) => (
              <div key={group}>
                <dt>{group}</dt>
                <dd>{items.join(", ")}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="contact">
          <h2>Contact</h2>
          <p className="contact-line">
            I&apos;m looking for a developer role working on AI products or the systems behind them. The best way to
            reach me is <a href={`mailto:${links.email}`}>{links.email}</a>.
          </p>
        </section>
      </main>

      <footer className="footer">
        <span>Hemanth Pandiyaraj · Edmonton, AB</span>
        <span>
          <a href={links.github}>GitHub</a> · <a href={links.linkedin}>LinkedIn</a>
        </span>
      </footer>
    </div>
  );
}
