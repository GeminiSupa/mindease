"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

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
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

function focusAreas(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function cleanLanguages(languages?: string[]) {
  return (languages ?? ["Urdu", "English"])
    .flatMap((language) => language.split(","))
    .map((language) => language.replace(/\s+proficiency:.*$/i, "").trim())
    .filter((language) => language.length > 1);
}

function feeLabel(therapist: TherapistProfile) {
  return therapist.session_fee
    ? `${therapist.currency ?? "PKR"} ${therapist.session_fee.toLocaleString("en-PK")}`
    : "Confirm with coordinator";
}

function ProfileImage({ therapist, large = false }: { therapist: TherapistProfile; large?: boolean }) {
  return therapist.profile_image_url ? (
    <Image
      className={`directory-photo${large ? " is-large" : ""}`}
      src={therapist.profile_image_url}
      alt={`Portrait of ${therapist.full_name}`}
      width={124}
      height={124}
      unoptimized
    />
  ) : (
    <div className={`directory-avatar${large ? " is-large" : ""}`} aria-hidden="true">
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
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("all");
  const [focus, setFocus] = useState("all");
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeTherapist = therapists.find((therapist) => therapist.id === activeId) ?? null;

  const languageOptions = useMemo(
    () => Array.from(new Set(therapists.flatMap((therapist) => cleanLanguages(therapist.languages)))).sort(),
    [therapists],
  );
  const focusOptions = useMemo(
    () => Array.from(new Set(therapists.flatMap((therapist) => focusAreas(therapist.specialization)))).sort(),
    [therapists],
  );

  const filteredTherapists = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return therapists.filter((therapist) => {
      const languages = cleanLanguages(therapist.languages);
      const specialties = focusAreas(therapist.specialization);
      const searchable = [
        therapist.full_name,
        therapist.title,
        therapist.qualifications,
        therapist.bio,
        ...specialties,
        ...languages,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (language === "all" || languages.includes(language)) &&
        (focus === "all" || specialties.includes(focus))
      );
    });
  }, [focus, language, query, therapists]);

  useEffect(() => {
    if (!activeTherapist) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveId(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [activeTherapist]);

  const buildWhatsAppHref = (therapist?: TherapistProfile) => {
    const message = therapist
      ? `Hello MindEase, I would like to ask whether ${therapist.full_name} may be a good fit for me.`
      : "Hello MindEase, I would like help choosing a therapist.";
    return `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
  };

  const hasFilters = query || language !== "all" || focus !== "all";

  return (
    <section className="directory-workspace" id="browse" aria-labelledby="directory-title">
      <div className="directory-section-head">
        <div>
          <span className="eyebrow">Browse verified profiles</span>
          <h2 id="directory-title">Meet the therapists</h2>
          <p>Start with focus area, language, and approach. The coordinator will confirm current availability.</p>
        </div>
        <div className="directory-count" aria-live="polite">
          <strong>{filteredTherapists.length}</strong>
          <span>{filteredTherapists.length === 1 ? "profile" : "profiles"}</span>
        </div>
      </div>

      <div className="directory-toolbar" aria-label="Filter therapist profiles">
        <label className="directory-search">
          <span>Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, concern, or qualification"
          />
        </label>
        <label>
          <span>Language</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value="all">Any language</option>
            {languageOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Focus area</span>
          <select value={focus} onChange={(event) => setFocus(event.target.value)}>
            <option value="all">Any focus area</option>
            {focusOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <button
          className="directory-clear"
          type="button"
          disabled={!hasFilters}
          onClick={() => {
            setQuery("");
            setLanguage("all");
            setFocus("all");
          }}
        >
          Clear
        </button>
      </div>

      {filteredTherapists.length ? (
        <div className="directory-cards">
          {filteredTherapists.map((therapist) => {
            const specialties = focusAreas(therapist.specialization);
            const languages = cleanLanguages(therapist.languages);
            return (
              <article className="directory-profile" key={therapist.id}>
                <div className="directory-profile-head">
                  <ProfileImage therapist={therapist} />
                  <div className="directory-profile-title">
                    <div className="availability-dot">
                      <i aria-hidden="true" />
                      {therapist.availability_status || "Availability on request"}
                    </div>
                    <h3>{therapist.full_name}</h3>
                    <p>{therapist.title}</p>
                    {therapist.qualifications ? <small>{therapist.qualifications}</small> : null}
                  </div>
                </div>

                <p className="directory-summary">
                  {therapist.bio || "A reviewed MindEase therapist offering confidential online support."}
                </p>

                <div className="directory-pills" aria-label="Focus areas">
                  {(specialties.length ? specialties : ["Online therapy"]).slice(0, 3).map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>

                <dl className="directory-facts">
                  <div>
                    <dt>Experience</dt>
                    <dd>{therapist.years_experience ? `${therapist.years_experience}+ years` : "Reviewed profile"}</dd>
                  </div>
                  <div>
                    <dt>Languages</dt>
                    <dd>{languages.join(" · ") || "Confirm with coordinator"}</dd>
                  </div>
                </dl>

                <div className="directory-profile-actions">
                  <button type="button" onClick={() => setActiveId(therapist.id)}>
                    View full profile <span aria-hidden="true">↗</span>
                  </button>
                  <a href={buildWhatsAppHref(therapist)} target="_blank" rel="noreferrer">
                    Ask about fit
                  </a>
                </div>

                <div className="directory-fee">
                  <span>Online session</span>
                  <strong>{feeLabel(therapist)}</strong>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="directory-no-results">
          <strong>No exact matches yet</strong>
          <p>Clear one of the filters, or ask the coordinator for a personal recommendation.</p>
          <a href={buildWhatsAppHref()} target="_blank" rel="noreferrer">Ask for a match</a>
        </div>
      )}

      {activeTherapist ? (
        <div
          className="profile-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveId(null);
          }}
        >
          <section
            className="profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
          >
            <button className="profile-modal-close" type="button" onClick={() => setActiveId(null)} aria-label="Close profile">
              ×
            </button>
            <header className="profile-modal-header">
              <ProfileImage therapist={activeTherapist} large />
              <div>
                <span className="availability-dot"><i aria-hidden="true" /> Approved MindEase profile</span>
                <h2 id="profile-modal-title">{activeTherapist.full_name}</h2>
                <p>{activeTherapist.title}</p>
                {activeTherapist.qualifications ? <small>{activeTherapist.qualifications}</small> : null}
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
              <a href={buildWhatsAppHref(activeTherapist)} target="_blank" rel="noreferrer">
                Ask about {activeTherapist.full_name.split(" ")[0]}
              </a>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  );
}
