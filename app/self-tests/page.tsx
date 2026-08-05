"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Assessment = {
  id: string;
  category: string;
  title: string;
  concept: string;
  description: string;
  low: string;
  medium: string;
  high: string;
  questions: string[];
};

const assessments: Assessment[] = [
  {
    id: "anxiety-patterns",
    category: "Anxiety & panic",
    title: "Anxiety Pattern Check",
    concept: "Worry, panic, avoidance, and recovery",
    description: "A brief reflection on how manageable anxiety-related experiences have felt during the past two weeks.",
    low: "Your answers suggest anxiety patterns may be disrupting daily life. A therapist can help you understand triggers and build a practical support plan.",
    medium: "Your answers suggest some anxiety pressure alongside useful coping capacity. Notice which situations feel hardest to recover from.",
    high: "Your answers suggest anxiety-related experiences have felt relatively manageable recently. Keep using the routines and support that help.",
    questions: [
      "I can settle my body after a rush of fear or panic.",
      "Worry rarely stops me from doing important everyday activities.",
      "I can notice an anxious thought without automatically treating it as a fact.",
      "I have at least one reliable way to calm myself when tension rises.",
      "My current fears feel manageable enough to discuss or work through.",
    ],
  },
  {
    id: "low-mood-functioning",
    category: "Depression",
    title: "Mood & Daily Function Check",
    concept: "Energy, interest, routine, and connection",
    description: "A non-diagnostic snapshot of how supported and manageable daily life has felt during the past two weeks.",
    low: "Your answers suggest low mood or reduced energy may be affecting daily functioning. Consider sharing these patterns with a qualified professional.",
    medium: "Your answers suggest a mixed period, with some functioning intact and some areas under strain.",
    high: "Your answers suggest several protective routines and sources of connection are present right now.",
    questions: [
      "I can begin essential tasks even when motivation is low.",
      "I still experience interest or pleasure in at least some activities.",
      "My sleep and energy allow me to manage basic responsibilities.",
      "I feel connected to at least one person I can be honest with.",
      "I can imagine one realistic thing that may improve the coming week.",
    ],
  },
  {
    id: "relationship-adjustment",
    category: "Relationship issues",
    title: "Relationship Adjustment Check",
    concept: "Inspired by DAS-style relationship adjustment concepts",
    description: "Looks at satisfaction, agreement, closeness, and repair after conflict.",
    low: "Your answers suggest several relationship stress points worth discussing with a couples or individual therapist.",
    medium: "Your answers suggest mixed relationship adjustment. Focused communication support may help.",
    high: "Your answers suggest relatively steady relationship adjustment, with room to strengthen specific patterns.",
    questions: [
      "We can discuss disagreements without feeling unsafe or shut down.",
      "We make important decisions with a sense of teamwork.",
      "I feel emotionally close to my partner most weeks.",
      "After conflict, repair usually happens within a reasonable time.",
      "Our relationship currently supports my wellbeing.",
    ],
  },
  {
    id: "personality-style",
    category: "Personal insight",
    title: "Personality Style Reflection",
    concept: "Interest-building preference quiz",
    description: "Reflects on energy, structure, emotional processing, and communication preferences.",
    low: "Your pattern leans toward reflective, flexible, and internally processing preferences.",
    medium: "Your pattern looks balanced across social energy, structure, and emotional expression.",
    high: "Your pattern leans toward active, structured, and externally processing preferences.",
    questions: [
      "I usually process stress better by talking it through.",
      "I prefer clear plans and defined next steps.",
      "I recover energy by being around supportive people.",
      "I notice and name feelings quickly when they arise.",
      "I like practical tools more than open-ended reflection.",
    ],
  },
  {
    id: "quality-of-life",
    category: "General wellbeing",
    title: "Quality of Life Snapshot",
    concept: "Wellbeing and daily-function check",
    description: "Reviews life satisfaction across routine, relationships, work/study, and meaning.",
    low: "Your answers suggest quality-of-life strain. Support may help identify the most workable next change.",
    medium: "Your answers suggest some stable areas and some pressure points to track.",
    high: "Your answers suggest many supportive routines and resources are currently present.",
    questions: [
      "My daily routine feels manageable.",
      "I have enough connection with people I trust.",
      "My work, study, or home responsibilities feel sustainable.",
      "I can enjoy small activities during a normal week.",
      "I feel some sense of meaning or direction right now.",
    ],
  },
  {
    id: "sleep-quality",
    category: "Sleep & recovery",
    title: "Sleep Quality Check",
    concept: "Sleep habits and restoration",
    description: "Looks at falling asleep, staying asleep, restfulness, and daytime effects.",
    low: "Your answers suggest sleep is not feeling restorative. Consider discussing sleep, stress, and routine with a clinician.",
    medium: "Your answers suggest inconsistent sleep quality. Small routine changes and stress support may help.",
    high: "Your answers suggest sleep is mostly restorative right now.",
    questions: [
      "I fall asleep within a reasonable time most nights.",
      "I usually stay asleep or return to sleep without much distress.",
      "I wake feeling at least somewhat rested.",
      "My sleep schedule is fairly consistent.",
      "Daytime tiredness rarely disrupts my responsibilities.",
    ],
  },
  {
    id: "stress-load",
    category: "Stress & burnout",
    title: "Stress Load Check",
    concept: "Burnout and overload signals",
    description: "Reviews tension, recovery, irritability, and sense of control.",
    low: "Your answers suggest current stress load may be high. A support plan could help reduce overload.",
    medium: "Your answers suggest moderate stress load. Watch recovery time and boundaries.",
    high: "Your answers suggest stress is currently being managed with some protective factors.",
    questions: [
      "I can recover after a demanding day.",
      "I feel able to pause before reacting under pressure.",
      "My body feels calm enough during ordinary tasks.",
      "I can set boundaries around responsibilities.",
      "I still have energy for something restorative each week.",
    ],
  },
  {
    id: "grounding-recovery",
    category: "Trauma & grief",
    title: "Grounding & Recovery Check",
    concept: "Safety, support, and recovery after difficult experiences",
    description: "A gentle check of current grounding and support. It does not ask you to revisit or describe what happened.",
    low: "Your answers suggest grounding and recovery may feel difficult right now. Trauma-informed professional support can help you work at a safe pace.",
    medium: "Your answers suggest some sources of steadiness are present, with other areas needing more support.",
    high: "Your answers suggest you currently have several grounding resources. Continue protecting the people, routines, and boundaries that help.",
    questions: [
      "I can usually notice when I am in the present rather than pulled into a difficult memory.",
      "I have a place, routine, or person that helps me feel safer.",
      "I can take a break when a conversation or situation feels overwhelming.",
      "My sleep and daily routine offer at least some predictability.",
      "I feel able to seek support without having to explain everything at once.",
    ],
  },
  {
    id: "family-support",
    category: "Child & family",
    title: "Family Support Reflection",
    concept: "Adult caregiver reflection on communication and support",
    description: "For parents and adult caregivers to reflect on family communication, routine, and access to support. It is not a child assessment.",
    low: "Your answers suggest family routines or communication may be under strain. Parent guidance or family therapy could offer practical next steps.",
    medium: "Your answers suggest a mix of supportive patterns and pressure points within the family.",
    high: "Your answers suggest several supportive family patterns are currently present.",
    questions: [
      "Family members can raise a concern without being mocked or dismissed.",
      "Daily routines are predictable enough for the children or young people in our care.",
      "Adults try to respond consistently when rules or expectations are tested.",
      "We make time to notice effort, progress, and positive connection.",
      "I have support when caregiving or family responsibilities feel too heavy.",
    ],
  },
];

const scale = ["Rarely", "Sometimes", "Often", "Very often"];

export default function SelfTestsPage() {
  const [activeId, setActiveId] = useState(assessments[0].id);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const panelRef = useRef<HTMLElement>(null);
  const active = assessments.find((assessment) => assessment.id === activeId) ?? assessments[0];
  const activeAnswers = answers[active.id] ?? Array(active.questions.length).fill(-1);
  const completed = activeAnswers.filter((answer) => answer >= 0).length;

  useEffect(() => {
    const requestedId = window.location.hash.slice(1);
    if (assessments.some((assessment) => assessment.id === requestedId)) {
      const frame = window.requestAnimationFrame(() => {
        setActiveId(requestedId);
        if (window.matchMedia("(max-width: 820px)").matches) {
          window.setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
        }
      });
      return () => window.cancelAnimationFrame(frame);
    }
  }, []);

  const result = useMemo(() => {
    if (activeAnswers.some((answer) => answer < 0)) return null;
    const score = activeAnswers.reduce((sum, answer) => sum + answer, 0);
    const max = (active.questions.length * (scale.length - 1)) || 1;
    const percent = Math.round((score / max) * 100);
    const label = percent < 42 ? "Needs attention" : percent < 72 ? "Mixed pattern" : "Currently stronger";
    const text = percent < 42 ? active.low : percent < 72 ? active.medium : active.high;
    return { percent, label, text };
  }, [active, activeAnswers]);

  function setAnswer(index: number, value: number) {
    setAnswers((current) => {
      const next = current[active.id] ? [...current[active.id]] : Array(active.questions.length).fill(-1);
      next[index] = value;
      return { ...current, [active.id]: next };
    });
  }

  function resetActive() {
    setAnswers((current) => ({ ...current, [active.id]: Array(active.questions.length).fill(-1) }));
  }

  function chooseAssessment(id: string) {
    setActiveId(id);
    window.history.replaceState(null, "", `#${id}`);
    if (window.matchMedia("(max-width: 820px)").matches) {
      window.setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }

  return (
    <main>
      <section className="test-hero">
        <nav className="site-nav" aria-label="Self-check navigation">
          <Link className="brand" href="/">
            <Image src="/brand/mindease-app-icon.png" alt="" width={42} height={42} className="brand-icon" />
            <span>
              <strong>MindEase</strong>
              <small>Self-checks</small>
            </span>
          </Link>
          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/therapists">Therapists</Link>
            <Link href="/#contact">Contact</Link>
          </div>
        </nav>
        <div className="test-hero-layout">
          <div className="directory-copy">
            <span className="eyebrow">Private, informational self-checks</span>
            <h1>Pause, notice a pattern, and find a useful next step.</h1>
            <p>
              Choose a quick check, answer five plain-language questions, and see your score immediately.
              Nothing is saved or sent to MindEase.
            </p>
            <div className="test-trust-row" aria-label="Self-check details">
              <span>About 2 minutes</span>
              <span>Results stay on this device</span>
              <span>Not a diagnosis</span>
            </div>
          </div>
          <div className="test-hero-media">
            <img
              src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=85&w=900&h=700"
              alt="A person taking a quiet reflective pause"
            />
            <div><strong>{assessments.length} guided checks</strong><span>Choose the one that fits today.</span></div>
          </div>
        </div>
      </section>

      <section className="section test-layout">
        <aside className="test-picker-wrap" aria-label="Choose a self-check">
          <div className="test-picker-heading">
            <span>Choose a focus</span>
            <strong>What would you like to check?</strong>
          </div>
          <div className="test-picker">
          {assessments.map((assessment) => (
            <button
              className={assessment.id === active.id ? "active" : ""}
              key={assessment.id}
              onClick={() => chooseAssessment(assessment.id)}
              type="button"
            >
              <span className="picker-category">{assessment.category}</span>
              <strong>{assessment.title}</strong>
              <span className="picker-concept">{assessment.concept}</span>
            </button>
          ))}
          </div>
        </aside>

        <article className="test-panel" ref={panelRef}>
          <div className="admin-panel-head">
            <div>
              <span>{active.category} / {active.concept}</span>
              <h2>{active.title}</h2>
            </div>
            <button onClick={resetActive} type="button">Reset</button>
          </div>
          <p>{active.description}</p>

          <div className="test-progress" aria-label={`${completed} of ${active.questions.length} answered`}>
            <div><span>Progress</span><strong>{completed} of {active.questions.length} answered</strong></div>
            <progress value={completed} max={active.questions.length} />
          </div>

          <div className="question-list">
            {active.questions.map((question, index) => (
              <div className="question-card" key={question}>
                <div className="question-copy"><span>{String(index + 1).padStart(2, "0")}</span><strong>{question}</strong></div>
                <div className="answer-row">
                  {scale.map((label, value) => (
                    <button
                      className={activeAnswers[index] === value ? "selected" : ""}
                      key={label}
                      onClick={() => setAnswer(index, value)}
                      type="button"
                      aria-pressed={activeAnswers[index] === value}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className={`result-box ${result ? "complete" : ""}`} aria-live="polite">
            {result ? (
              <>
                <span>{result.label}</span>
                <div className="score-lockup"><strong>{result.percent}</strong><small>/ 100</small></div>
                <p>{result.text}</p>
                <div className="result-actions">
                  <Link href="/#contact">Discuss with a coordinator</Link>
                  <button onClick={resetActive} type="button">Retake this check</button>
                </div>
              </>
            ) : (
              <>
                <span>Incomplete</span>
                <strong>Answer every item to see a result.</strong>
                <p>Use this as a conversation starter, then reset or try another self-check.</p>
              </>
            )}
          </div>
          <p className="test-disclaimer">
            These checks are conversation starters, not validated diagnostic screenings. MindEase is not an emergency service.
            If you or someone else may be in immediate danger, contact local emergency services or the nearest hospital emergency department.
          </p>
        </article>
      </section>
    </main>
  );
}
