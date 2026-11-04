export const ASSESSMENTS = {
  "PHQ-9": {
    title: "Mood Health Check (PHQ-9)",
    period: "Over the last 2 weeks, how often have you been bothered by any of the following?",
    questions: [
      "Little interest or pleasure in doing things", "Feeling down, depressed, or hopeless", "Trouble falling or staying asleep, or sleeping too much",
      "Feeling tired or having little energy", "Poor appetite or overeating", "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
      "Trouble concentrating on things", "Moving or speaking unusually slowly, or being unusually restless", "Thoughts that you would be better off dead or of hurting yourself",
    ],
    severity(score: number) { return score < 5 ? "minimal" : score < 10 ? "mild" : score < 15 ? "moderate" : score < 20 ? "moderately severe" : "severe"; },
    riskIndex: 8,
  },
  "GAD-7": {
    title: "Anxiety Health Check (GAD-7)",
    period: "Over the last 2 weeks, how often have you been bothered by any of the following?",
    questions: [
      "Feeling nervous, anxious, or on edge", "Not being able to stop or control worrying", "Worrying too much about different things",
      "Trouble relaxing", "Being so restless that it is hard to sit still", "Becoming easily annoyed or irritable", "Feeling afraid as if something awful might happen",
    ],
    severity(score: number) { return score < 5 ? "minimal" : score < 10 ? "mild" : score < 15 ? "moderate" : "severe"; },
    riskIndex: -1,
  },
} as const;

export const RESPONSE_OPTIONS = ["Not at all", "Several days", "More than half the days", "Nearly every day"];
