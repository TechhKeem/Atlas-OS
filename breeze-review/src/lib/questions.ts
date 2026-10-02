import type { Answers, Depth, Path } from "./types";

export interface Question {
  id: keyof Answers;
  type: "currency" | "integer" | "text" | "choice";
  eyebrow: string;
  title: string;
  help?: string;
  micro?: string;
  placeholder?: string;
  optional?: boolean;
  options?: { value: string | boolean | number; label: string; sub?: string }[];
  showIf?: (a: Answers) => boolean;
}

const yesNo = [
  { value: true, label: "Yes" },
  { value: false, label: "No" },
];

export const QUESTIONS: Record<string, Question> = {
  income: {
    id: "income", type: "currency", eyebrow: "Income", title: "What's your yearly income before taxes?",
    placeholder: "75,000",
    micro: "A common rule of thumb is about 10x your annual income, but families with young children or a mortgage often need more.",
  },
  yearsReplace: {
    id: "yearsReplace", type: "choice", eyebrow: "Income", title: "If you were gone, how many years of your income should your family have?",
    micro: "There's no single right answer. More years gives a surviving family more room to adjust without financial pressure.",
    options: [
      { value: 5, label: "5 years" }, { value: 10, label: "10 years", sub: "A common starting point" },
      { value: 15, label: "15 years" }, { value: 20, label: "20 years" },
    ],
  },
  spouse: {
    id: "spouse", type: "choice", eyebrow: "Family", title: "Do you have a spouse or partner who relies on your income?",
    micro: "On average, a surviving spouse takes about 7 years to recover after losing a partner.",
    options: yesNo,
  },
  ownsHome: { id: "ownsHome", type: "choice", eyebrow: "Mortgage", title: "Do you own your home?", options: yesNo },
  mortgage: {
    id: "mortgage", type: "currency", eyebrow: "Mortgage", title: "About how much is left on your mortgage?",
    placeholder: "250,000", showIf: (a) => a.ownsHome === true,
    help: "An estimate is fine. Check a recent statement if you have one.",
    micro: "Many families want the mortgage covered so the house can stay in the family.",
  },
  debt: {
    id: "debt", type: "currency", eyebrow: "Debt", title: "Besides your mortgage, how much debt do you have?",
    placeholder: "15,000", optional: true,
    help: "Think car loans, credit cards, student loans. Skip it if you're not sure.",
  },
  kids: {
    id: "kids", type: "integer", eyebrow: "Family", title: "How many children do you have?",
    placeholder: "0",
    micro: "Children are a big reason families look at life insurance, since their needs last many years.",
  },
  kidAges: {
    id: "kidAges", type: "text", eyebrow: "Education", title: "How old are they?",
    placeholder: "e.g. 3, 6", optional: true, showIf: (a) => (a.kids ?? 0) > 0,
    help: "Separate ages with commas. This helps us estimate how many still have education ahead of them.",
  },
  eduGoal: {
    id: "eduGoal", type: "choice", eyebrow: "Education", title: "What would you like to be able to fund for each child's education?",
    showIf: (a) => (a.kids ?? 0) > 0,
    micro: "These are rough national averages and vary a lot by school and state.",
    options: [
      { value: "none", label: "Nothing specific" },
      { value: "trade", label: "Trade school or 2-year degree" },
      { value: "public", label: "In-state public university", sub: "A common goal" },
      { value: "private", label: "Private university" },
    ],
  },
  existingCoverage: {
    id: "existingCoverage", type: "currency", eyebrow: "Existing coverage", title: "Do you have any life insurance already? If so, how much?",
    placeholder: "0", optional: true,
    help: "Include coverage through work. Leave blank if none or unsure.",
  },
  preference: {
    id: "preference", type: "choice", eyebrow: "Your preference", title: "Which matters more right now?",
    help: "This just helps your agent understand what you care about. We won't recommend a product.",
    options: [
      { value: "cost", label: "Keeping the cost low" },
      { value: "lifetime", label: "Having coverage that lasts my whole life" },
    ],
  },
};

const ORDER: Record<string, string[]> = {
  "B:general": ["income", "ownsHome", "mortgage", "kids", "preference"],
  "B:detailed": ["income", "yearsReplace", "spouse", "ownsHome", "mortgage", "debt", "kids", "kidAges", "eduGoal", "existingCoverage", "preference"],
  "A:general": [],
  "A:detailed": ["income", "spouse", "kids", "ownsHome", "mortgage"],
};

/** Questions that apply for this path/depth given the answers so far. */
export function questionsFor(path: Path, depth: Depth, answers: Answers): Question[] {
  return ORDER[`${path}:${depth}`].map((id) => QUESTIONS[id]).filter((q) => !q.showIf || q.showIf(answers));
}
