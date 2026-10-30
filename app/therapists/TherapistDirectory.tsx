"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { countryFlag } from "../countries";

export type TherapistProfile = {
  id: string;
  full_name: string;
  title: string;
  qualifications?: string;
  years_experience?: number;
  bio?: string;
  specialization?: string;
  languages?: string[];
  session_fee?: number;
  currency?: string;
  availability_status?: string;
  profile_image_url?: string;
  rating?: number;
  review_count?: number;
  country_of_origin?: string;
  country_code?: string;
};

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("");
}

function focusAreas(value?: string) {
  return (value ?? "")
    .split(/[,;/|]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1)
    .slice(0, 5);
}

function cleanLanguages(languages?: string[]) {
  return (languages ?? ["Urdu", "English"])
    .flatMap((l) => l.split(","))
    .map((l) => l.replace(/\s+proficiency:.*$/i, "").trim())
    .filter((l) => l.length > 1);
}

function feeLabel(t: TherapistProfile) {
  return t.session_fee
    ? `${t.currency ?? "PKR"} ${t.session_fee.toLocaleString("en-PK")}`
    : "Fee on request";
}

function StarRating({ rating, count }: { rating?: number; count?: number }) {
  if (!rating) return null;
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="dir-stars" aria-label={`Rating: ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= full ? "star-full" : half && i === full + 1 ? "star-half" : "star-empty"}>
          ★
        </span>
      ))}
      {count != null && count > 0 && <span className="dir-star-count">({count})</span>}
    </div>
  );
}

function ProfileImage({ therapist, large = false }: { therapist: TherapistProfile; large?: boolean }) {
  const size = large ? 120 : 100;
  return therapist.profile_image_url ? (
    <Image
      className={`dir-photo${large ? " is-large" : ""}`}
      src={therapist.profile_image_url}
      alt={`Portrait of ${therapist.full_name}`}
      width={size}
      height={size}
      unoptimized
    />
  ) : (
    <div className={`dir-avatar${large ? " is-large" : ""}`} aria-hidden="true">
      {initials(therapist.full_name)}
    </div>
  );
}

export default function TherapistDirectory({
  therapists,
  whatsappNumber,
}: {
  therapists: TherapistProfile[];
  whatsappNumber: string;
}) {
  const [query, setQuery]       = useState("");
  const [language, setLanguage] = useState("all");
  const [focus, setFocus]       = useState("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const modalRef = useRef<HTMLElement>(null);
  const lastFocusedEl = useRef<HTMLButtonElement | null>(null);

  const activeTherapist = therapists.find((t) => t.id === activeId) ?? null;

  const languageOptions = useMemo(
    () => Array.from(new Set(therapists.flatMap((t) => cleanLanguages(t.languages)))).sort(),
    [therapists],
  );
  const focusOptions = useMemo(
    () => Array.from(new Set(therapists.flatMap((t) => focusAreas(t.specialization)))).sort(),
    [therapists],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return therapists.filter((t) => {
      const langs = cleanLanguages(t.languages);
      const specs = focusAreas(t.specialization);
      const blob = [t.full_name, t.title, t.qualifications, t.bio, ...specs, ...langs]
        .filter(Boolean).join(" ").toLowerCase();
      return (
        (!q || blob.includes(q)) &&
        (language === "all" || langs.includes(language)) &&
        (focus === "all" || specs.includes(focus))
      );
    });
  }, [focus, language, query, therapists]);

  useEffect(() => {
    if (!activeTherapist) return;
    modalRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setActiveId(null); return; }
      if (e.key !== "Tab" || !modalRef.current) return;
      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; lastFocusedEl.current?.focus(); };
  }, [activeTherapist]);

  const waHref = (t?: TherapistProfile) => {
    const msg = t
      ? `Hello MindEase, I would like to inquire about ${t.full_name}.`
      : "Hello MindEase, I need help choosing a therapist.";
    const n = whatsappNumber.replace(/\D/g, "");
    return /^\d{8,15}$/.test(n) ? `https://wa.me/${n}?text=${encodeURIComponent(msg)}` : "/#contact";
  };

  const hasFilters = query || language !== "all" || focus !== "all";

  return (
    <section className="dir-workspace" id="browse" aria-labelledby="dir-title">

      {/* ── Filter bar ─────────────────────────────────────────── */}
      <div className="dir-filter-bar">
        <div className="dir-filter-inner">
          <div className="dir-filter-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, concern…"
              aria-label="Search therapists"
            />
          </div>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Filter by language">
            <option value="all">All Languages</option>
            {languageOptions.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={focus} onChange={(e) => setFocus(e.target.value)} aria-label="Filter by specialization">
            <option value="all">All Specializations</option>
            {focusOptions.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          {hasFilters && (
            <button className="dir-clear-btn" type="button" onClick={() => { setQuery(""); setLanguage("all"); setFocus("all"); }}>
              Clear
            </button>
          )}
        </div>
        <p className="dir-result-count" aria-live="polite">
          Showing <strong>{filtered.length}</strong> {filtered.length === 1 ? "specialist" : "specialists"}
        </p>
      </div>

      {/* ── Cards grid ─────────────────────────────────────────── */}
      {filtered.length ? (
        <div className="dir-grid">
          {filtered.map((t) => {
            const specs = focusAreas(t.specialization);
            const langs = cleanLanguages(t.languages);
            return (
              <article
                className="dir-card"
                key={t.id}
                data-animate="fade-up"
                data-tilt
              >
                {/* Photo */}
                <div className="dir-card-photo-wrap">
                  <ProfileImage therapist={t} />
                </div>

                {/* Name + title */}
                <div className="dir-card-info">
                  <h3 className="dir-card-name">{t.full_name}</h3>
                  <p className="dir-card-title">{t.title}</p>
                  {t.qualifications && <p className="dir-card-quals">{t.qualifications}</p>}
                  <StarRating rating={t.rating} count={t.review_count} />
                </div>

                {/* Spec tags */}
                {specs.length > 0 && (
                  <div className="dir-card-tags" aria-label="Specializations">
                    {specs.slice(0, 3).map((s) => <span key={s}>{s}</span>)}
                  </div>
                )}

                {/* Meta row */}
                <div className="dir-card-meta">
                  <span className="dir-country" title="Country of origin">{countryFlag(t.country_code)} {t.country_of_origin || "Pakistan"}</span>
                  {t.years_experience && (
                    <span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {t.years_experience}+ yrs
                    </span>
                  )}
                  {langs.length > 0 && (
                    <span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 8l6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>
                      {langs.slice(0, 2).join(", ")}
                    </span>
                  )}
                  {t.session_fee && (
                    <span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      {feeLabel(t)}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="dir-card-actions">
                  <a href={waHref(t)} target="_blank" rel="noreferrer" className="dir-book-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                    WhatsApp
                  </a>
                  <button
                    className="dir-profile-btn"
                    type="button"
                    onClick={(e) => { lastFocusedEl.current = e.currentTarget; setActiveId(t.id); }}
                  >
                    View Profile
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="dir-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <strong>No specialists found</strong>
          <p>Try adjusting your filters or ask our coordinator for help.</p>
          <a href={waHref()} target="_blank" rel="noreferrer" className="dir-book-btn">
            Ask on WhatsApp
          </a>
        </div>
      )}

      {/* ── Profile modal ───────────────────────────────────────── */}
      {activeTherapist && (
        <div
          className="profile-modal-backdrop"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setActiveId(null); }}
        >
          <section
            className="profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
            ref={modalRef}
            tabIndex={-1}
          >
            <button className="profile-modal-close" type="button" onClick={() => setActiveId(null)} aria-label="Close profile">×</button>

            <header className="profile-modal-header">
              <ProfileImage therapist={activeTherapist} large />
              <div>
                <span className="dir-verified-badge">✓ Verified MindEase Profile</span>
                <h2 id="profile-modal-title">{activeTherapist.full_name}</h2>
                <p>{activeTherapist.title}</p>
                {activeTherapist.qualifications && <small>{activeTherapist.qualifications}</small>}
                <StarRating rating={activeTherapist.rating} count={activeTherapist.review_count} />
              </div>
            </header>

            <div className="profile-modal-content">
              <div className="profile-modal-about">
                <span>About</span>
                <p>{activeTherapist.bio || "A reviewed MindEase therapist offering confidential online support."}</p>
                <div className="directory-pills">
                  {(focusAreas(activeTherapist.specialization).length
                    ? focusAreas(activeTherapist.specialization)
                    : ["Online therapy"]
                  ).map((item) => <span key={item}>{item}</span>)}
                </div>
              </div>
              <dl className="profile-modal-facts">
                <div><dt>Country of origin</dt><dd>{countryFlag(activeTherapist.country_code)} {activeTherapist.country_of_origin || "Pakistan"}</dd></div>
                <div><dt>Experience</dt><dd>{activeTherapist.years_experience ? `${activeTherapist.years_experience}+ years` : "Reviewed profile"}</dd></div>
                <div><dt>Languages</dt><dd>{cleanLanguages(activeTherapist.languages).join(", ") || "Confirm with coordinator"}</dd></div>
                <div><dt>Availability</dt><dd>{activeTherapist.availability_status || "Ask coordinator"}</dd></div>
                <div><dt>Session fee</dt><dd>{feeLabel(activeTherapist)}</dd></div>
              </dl>
            </div>

            <footer className="profile-modal-footer">
              <div>
                <strong>Think this could be a fit?</strong>
                <span>The coordinator will confirm timing before you book.</span>
              </div>
              <a href={waHref(activeTherapist)} target="_blank" rel="noreferrer">
                Ask about {activeTherapist.full_name.split(" ")[0]}
              </a>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}
