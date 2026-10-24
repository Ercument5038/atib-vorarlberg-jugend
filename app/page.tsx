"use client";

import Image from "next/image";
import { Fragment } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Users as Facebook,
  AtSign as Instagram,
  Mail,
  Music2,
} from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { Header } from "@/components/Header";
import { MosqueOverview } from "@/components/MosqueOverview";
import { Reveal } from "@/components/Reveal";
import { useSiteSettings } from "@/components/SiteSettings";
import { activities, team } from "@/lib/content";
import { translations } from "@/lib/translations";

export default function Home() {
  const { language } = useSiteSettings();
  const copy = translations[language];

  return (
    <>
      <Header />
      <main id="top">
        <MosqueOverview />

        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-grid container">
            <div className="hero-copy">
              <p className="eyebrow hero-eyebrow"><span /> {copy.hero.eyebrow}</p>
              <h1 id="hero-title">
                {copy.hero.line1}
                <span>{copy.hero.line2}</span>
                {copy.hero.line3}
              </h1>
              <div className="hero-intro">
                <p>{copy.hero.intro}</p>
                <div className="hero-actions">
                  <a className="button button-primary" href="#aktivitaeten">
                    {copy.hero.primaryAction} <ArrowDown size={18} />
                  </a>
                  <a className="text-link" href="#team">
                    {copy.hero.secondaryAction} <ArrowUpRight size={18} />
                  </a>
                </div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-image-wrap">
                <Image src="/images/hero.jpg" alt={copy.hero.imageAlt} fill priority sizes="(max-width: 900px) 100vw, 54vw" />
              </div>
              <div className="hero-image-label">
                <span>{copy.hero.imageLabel1}</span>
                <span>{copy.hero.imageLabel2}</span>
              </div>
              <div className="hero-stamp" aria-hidden="true"><span>ATIB</span><small>Vorarlberg</small></div>
            </div>
          </div>
          <div className="hero-stats container">
            <div className="stats-intro">
              <span>{copy.hero.season}</span>
              <p>{copy.hero.seasonText[0]}<br />{copy.hero.seasonText[1]}</p>
            </div>
            <div className="stat">
              <strong>200<span>+</span></strong>
              <p>{copy.hero.stats[0][0]}<br />{copy.hero.stats[0][1]}</p>
            </div>
            <div className="stat">
              <strong>21<span>.</span></strong>
              <p>{copy.hero.stats[1][0]}<br />{copy.hero.stats[1][1]}</p>
            </div>
            <div className="stat">
              <strong>100<span>+</span></strong>
              <p>{copy.hero.stats[2][0]}<br />{copy.hero.stats[2][1]}</p>
            </div>
          </div>
        </section>

        <div className="values-band" aria-label={copy.hero.valuesLabel}>
          <div>
            {copy.hero.values.map((value, index) => (
              <Fragment key={value}><span>{value}</span>{index < copy.hero.values.length - 1 && <i />}</Fragment>
            ))}
          </div>
        </div>

        <section className="section foreword" id="vorwort" aria-labelledby="foreword-title">
          <div className="container">
            <div className="section-kicker"><span>{copy.foreword.kicker}</span><span>{copy.foreword.aside}</span></div>
            <div className="foreword-grid">
              <Reveal className="foreword-portrait">
                <div className="portrait-frame">
                  <Image src="/images/yusuf-kaplan.jpg" alt={copy.foreword.portraitAlt} fill sizes="(max-width: 800px) 90vw, 34vw" />
                </div>
                <div className="portrait-caption"><strong>Yusuf Kaplan</strong><span>{copy.foreword.role}</span></div>
              </Reveal>
              <Reveal className="foreword-content">
                <p className="eyebrow"><span /> {copy.foreword.goal}</p>
                <h2 id="foreword-title">{copy.foreword.title1} <em>{copy.foreword.title2}</em></h2>
                <div className="foreword-text">
                  {copy.foreword.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
                <blockquote>{copy.foreword.quote}</blockquote>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="section activities" id="aktivitaeten" aria-labelledby="activities-title">
          <div className="container">
            <div className="section-kicker section-kicker-light"><span>{copy.activities.kicker}</span><span>{copy.activities.aside}</span></div>
            <div className="activities-heading">
              <h2 id="activities-title">{copy.activities.title1}<br /><em>{copy.activities.title2}</em></h2>
              <p>{copy.activities.intro}</p>
            </div>
            <div className="activity-list">
              {activities[language].map((activity) => (
                <Reveal key={activity.number} className="activity-reveal">
                  <article className="activity-card">
                    <div className="activity-number">{activity.number}</div>
                    <div className="activity-image">
                      <Image src={activity.image} alt={activity.alt} fill sizes="(max-width: 760px) 100vw, 42vw" />
                      {"stat" in activity && (
                        <div className="activity-stat"><strong>{activity.stat}</strong><span>{activity.statLabel}</span></div>
                      )}
                    </div>
                    <div className="activity-copy">
                      <div className="activity-meta"><span>{activity.category}</span><time>{activity.month}</time></div>
                      <h3>{activity.title}</h3>
                      <p>{activity.description}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section connections" aria-labelledby="connections-title">
          <div className="container">
            <div className="section-kicker"><span>{copy.connections.kicker}</span><span>{copy.connections.aside}</span></div>
            <div className="connections-grid">
              <Reveal className="connections-copy">
                <h2 id="connections-title">{copy.connections.title1}<br /><em>{copy.connections.title2}</em></h2>
                <p>{copy.connections.intro}</p>
                <div className="connection-tags">{copy.connections.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              </Reveal>
              <div className="connections-gallery">
                <Reveal className="connection-photo connection-photo-large">
                  <Image src="/images/kulturzentrum.jpg" alt={copy.connections.imageAlts[0]} fill sizes="(max-width: 800px) 65vw, 30vw" />
                  <span>{copy.connections.imageLabels[0]}</span>
                </Reveal>
                <Reveal className="connection-photo">
                  <Image src="/images/messe.jpg" alt={copy.connections.imageAlts[1]} fill sizes="(max-width: 800px) 35vw, 18vw" />
                  <span>{copy.connections.imageLabels[1]}</span>
                </Reveal>
                <Reveal className="connection-photo">
                  <Image src="/images/sportverein.jpg" alt={copy.connections.imageAlts[2]} fill sizes="(max-width: 800px) 35vw, 18vw" />
                  <span>{copy.connections.imageLabels[2]}</span>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        <section className="section team-section" id="team" aria-labelledby="team-title">
          <div className="container">
            <div className="section-kicker"><span>{copy.team.kicker}</span><span>{copy.team.aside}</span></div>
            <div className="team-heading">
              <h2 id="team-title">{copy.team.title1}<br /><em>{copy.team.title2}</em></h2>
              <p>{copy.team.intro}</p>
            </div>
            <div className="team-grid">
              {team[language].map((member, index) => (
                <Reveal key={member.name} className="team-card-reveal">
                  <article className="team-card">
                    <div className={`team-photo${"initials" in member ? " team-initials" : ""}`}>
                      {"image" in member ? (
                        <Image src={member.image} alt={`${member.name}, ${member.role}`} fill sizes="(max-width: 560px) 85vw, (max-width: 1000px) 45vw, 24vw" />
                      ) : (
                        <span aria-label={`${copy.team.initialsLabel} ${member.name}`}>{member.initials}</span>
                      )}
                      <small>0{index + 1}</small>
                    </div>
                    <h3>{member.name}</h3>
                    <p>{member.role}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="contact-section" id="kontakt" aria-labelledby="contact-title">
          <div className="container">
            <div className="section-kicker section-kicker-light"><span>{copy.contact.kicker}</span><span>{copy.contact.aside}</span></div>
            <div className="contact-grid">
              <div className="contact-copy">
                <h2 id="contact-title">{copy.contact.title1}<br /><em>{copy.contact.title2}</em></h2>
                <p>{copy.contact.intro}</p>
                <div className="contact-links">
                  <a href="mailto:vlbg.jugend@atib.at">
                    <Mail size={21} /><span><small>{copy.contact.email}</small>vlbg.jugend@atib.at</span><ArrowUpRight size={20} />
                  </a>
                  <a href="https://www.instagram.com/atibvorarlberg.eg/" target="_blank" rel="noreferrer">
                    <Instagram size={21} /><span><small>Instagram</small>@atibvorarlberg.eg</span><ArrowUpRight size={20} />
                  </a>
                  <a href="https://www.tiktok.com/@atibvorarlberg.eg" target="_blank" rel="noreferrer">
                    <Music2 size={21} /><span><small>TikTok</small>@atibvorarlberg.eg</span><ArrowUpRight size={20} />
                  </a>
                  <div className="contact-channel">
                    <Facebook size={21} /><span><small>Facebook</small>{copy.contact.facebookName}</span>
                  </div>
                </div>
              </div>
              <ContactForm key={language} />
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-main">
          <div className="footer-brand">
            <Image src="/images/logo.png" alt={copy.footer.logoAlt} width={76} height={76} />
            <p>{copy.statement}</p>
          </div>
          <a className="footer-top" href="#top" aria-label={copy.footer.topLabel}>{copy.footer.top} <ArrowRight size={20} /></a>
        </div>
        <div className="container footer-bottom"><span>{copy.footer.copyright}</span><span>{copy.footer.board}</span></div>
      </footer>
    </>
  );
}
