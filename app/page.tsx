import AskConsole from "@/components/AskConsole";
import CopyEmail from "@/components/CopyEmail";
import Nav from "@/components/Nav";
import ProjectCard from "@/components/ProjectCard";
import { about, education, links, lookingFor, projects, roles, site, skillAnchor, skills, totalTests } from "@/lib/content";

const stats = [
  { value: "2 yrs", label: "at Deloitte, building for government and enterprise clients" },
  { value: String(totalTests), label: "automated tests across the three projects below" },
  { value: "1,000+", label: "concurrent users on a platform I built front-end modules for" },
];

export default function Home() {
  return (
    <>
      <a className="skip" href="#work">
        Skip to work
      </a>
      <Nav />

      <main id="top">
        <header className="hero">
          <div className="wrap">
            <p className="status rise" style={{ animationDelay: "0ms" }}>
              <span className="dot dot-live" aria-hidden="true" />
              Open to AI and full-stack roles
              <span className="status-where">· {site.location}</span>
            </p>
            <h1 className="rise" style={{ animationDelay: "60ms" }}>
              I build AI applications and the back ends that keep them <em>reliable.</em>
            </h1>

            <div className="hero-grid">
              <div className="hero-copy rise" style={{ animationDelay: "140ms" }}>
                <p className="lede">{about}</p>
                <p className="hero-actions">
                  <a className="btn btn-lg btn-accent" href={links.resume} download>
                    Download resume
                  </a>
                  <a className="btn btn-lg" href={links.github}>
                    GitHub
                  </a>
                  <a className="btn btn-lg" href={links.linkedin}>
                    LinkedIn
                  </a>
                  <a className="btn btn-lg" href={`mailto:${links.email}`}>
                    Email
                  </a>
                </p>
                <dl className="stats">
                  {stats.map(({ value, label }) => (
                    <div key={value}>
                      <dt>{value}</dt>
                      <dd>{label}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="hero-demo rise" style={{ animationDelay: "220ms" }}>
                <AskConsole />
              </div>
            </div>
          </div>
        </header>

        <section id="work" className="wrap">
          <header className="section-head reveal">
            <p className="eyebrow">01 · Work</p>
            <h2>Three projects, each with a piece you can run from here.</h2>
          </header>
          {projects.map((project, index) => (
            <ProjectCard key={project.repo} project={project} index={index} />
          ))}
        </section>

        <section id="experience" className="wrap">
          <header className="section-head reveal">
            <p className="eyebrow">02 · Experience</p>
            <h2>Where I have shipped software.</h2>
          </header>
          {roles.map((role) => (
            <article className="role reveal" key={role.id} id={`role-${role.id}`}>
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
          <article className="role reveal" id="education">
            <p className="when">Education</p>
            <div className="degrees">
              {education.map(({ degree, school, when }) => (
                <div key={degree}>
                  <h3>{degree}</h3>
                  <p className="org">
                    {school} · {when}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section id="skills" className="wrap">
          <header className="section-head reveal">
            <p className="eyebrow">03 · Skills</p>
            <h2>What I work with.</h2>
          </header>
          <dl className="skills reveal">
            {skills.map(({ group, items }) => (
              <div key={group} id={skillAnchor(group)}>
                <dt>{group}</dt>
                <dd>
                  <ul>
                    {items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="contact" className="wrap">
          <div className="contact reveal">
            <p className="eyebrow">04 · Contact</p>
            <h2>{lookingFor}</h2>
            <p className="contact-mail">
              <a href={`mailto:${links.email}`}>{links.email}</a>
            </p>
            <p className="hero-actions">
              <a className="btn btn-lg btn-accent" href={`mailto:${links.email}`}>
                Email me
              </a>
              <CopyEmail />
              <a className="btn btn-lg" href={links.linkedin}>
                LinkedIn
              </a>
              <a className="btn btn-lg" href={links.resume} download>
                Resume
              </a>
            </p>
          </div>
        </section>
      </main>

      <footer className="wrap footer">
        <span>
          {site.name} · {site.location}
        </span>
        <span>
          Next.js, TypeScript and plain CSS. No UI libraries. <a href={links.source}>Source</a>
        </span>
      </footer>
    </>
  );
}
