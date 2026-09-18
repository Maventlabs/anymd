export const stackOptions = {
  Frontend: ["Next.js", "Vue/Nuxt", "SvelteKit", "Astro"],
  Backend: ["Node.js/Express", "FastAPI", "Go (Fiber/Gin)", "NestJS"],
  Database: [
    "Neon",
    "Supabase",
    "PlanetScale",
    "MongoDB Atlas",
    "Self-managed Postgres",
  ],
  Auth: ["Clerk", "Auth0", "Supabase Auth", "NextAuth/Auth.js"],
  Payments: ["Stripe", "Xendit", "Paddle", "LemonSqueezy"],
  Hosting: ["Vercel", "Railway", "Fly.io", "Self-host/VPS"],
} as const;
export type Stack = Partial<Record<keyof typeof stackOptions, string>>;
export type Draft = {
  idea: string;
  stack: Stack;
  selectedSkillIds: string[];
  step: "idea" | "clarification";
};

export function validateIdea(idea: string): string | null {
  const length = Array.from(idea.trim()).length;
  if (length < 20)
    return "Give your idea a little more detail. Add at least 20 characters.";
  if (length > 5000) return "Keep your idea to 5,000 characters or fewer.";
  return null;
}
export function continueDraft(draft: Draft): Draft {
  return validateIdea(draft.idea)
    ? draft
    : { ...draft, idea: draft.idea.trim(), step: "clarification" };
}
export const starters = [
  {
    title: "A calmer freelance workflow",
    category: "Client portal",
    idea: "A client portal for freelance designers to share project milestones, collect feedback, and track approvals without losing decisions in email threads.",
  },
  {
    title: "Good habits, shared",
    category: "Mobile app",
    idea: "A mobile habit tracker for small groups of friends. Set a weekly goal, check in each day, and encourage each other without leaderboards or streak pressure.",
  },
  {
    title: "The neighborhood, on a plate",
    category: "Local marketplace",
    idea: "A marketplace connecting home cooks with nearby customers for weekly meal preorders, with clear pickup windows, dietary labels, and simple payments.",
  },
  {
    title: "Less admin. More teaching.",
    category: "Internal tool",
    idea: "An internal tool for independent tutors to manage student bookings, lesson notes, and invoices in one place, with a simple calendar and reminder system.",
  },
];
