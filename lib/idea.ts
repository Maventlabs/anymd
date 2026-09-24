export const stackOptions = {
  Frontend: [
    "Next.js",
    "React + Vite",
    "Vue/Nuxt",
    "SvelteKit",
    "Astro",
    "Remix",
    "Angular",
    "SolidStart",
    "Qwik",
    "HTMX",
    "Open",
    "Custom",
  ],
  Backend: [
    "Node.js/Express",
    "FastAPI",
    "NestJS",
    "Go (Fiber/Gin)",
    "Django",
    "Laravel",
    "Ruby on Rails",
    "Spring Boot",
    ".NET Minimal API",
    "Hono",
    "Open",
    "Custom",
  ],
  Database: [
    "Neon",
    "Supabase",
    "PlanetScale",
    "MongoDB Atlas",
    "Self-managed Postgres",
    "Turso",
    "CockroachDB",
    "Firebase Firestore",
    "DynamoDB",
    "SQLite",
    "Open",
    "Custom",
  ],
  Auth: [
    "Clerk",
    "Auth0",
    "Supabase Auth",
    "NextAuth/Auth.js",
    "Neon Auth",
    "Firebase Authentication",
    "WorkOS",
    "Amazon Cognito",
    "Keycloak",
    "Better Auth",
    "Open",
    "Custom",
  ],
  Payments: [
    "Stripe",
    "Xendit",
    "Paddle",
    "LemonSqueezy",
    "Adyen",
    "PayPal",
    "Midtrans",
    "Mercado Pago",
    "Braintree",
    "Polar",
    "Open",
    "Custom",
  ],
  Hosting: [
    "Vercel",
    "Netlify",
    "Railway",
    "Fly.io",
    "Render",
    "Cloudflare Workers",
    "AWS ECS",
    "Google Cloud Run",
    "Azure Container Apps",
    "Self-host/VPS",
    "Open",
    "Custom",
  ],
} as const;
export type Stack = Partial<Record<keyof typeof stackOptions, string>>;
export type StackCategory = keyof typeof stackOptions;
export const stackCategories = Object.keys(stackOptions) as StackCategory[];
export const OPEN_STACK_OPTION = "Open";
export const CUSTOM_STACK_OPTION = "Custom";
export const CUSTOM_STACK_NAME_MAX_LENGTH = 80;

export const stackOptionIcons: Record<StackCategory, Record<string, string>> = {
  Frontend: {
    "Next.js": "SiNextdotjs",
    "React + Vite": "SiReact",
    "Vue/Nuxt": "SiVuedotjs",
    SvelteKit: "SiSvelte",
    Astro: "SiAstro",
    Remix: "SiRemix",
    Angular: "SiAngular",
    SolidStart: "SiSolid",
    Qwik: "SiQwik",
    HTMX: "SiHtmx",
    Open: "open",
    Custom: "custom",
  },
  Backend: {
    "Node.js/Express": "SiNodedotjs",
    FastAPI: "SiFastapi",
    NestJS: "SiNestjs",
    "Go (Fiber/Gin)": "SiGo",
    Django: "SiDjango",
    Laravel: "SiLaravel",
    "Ruby on Rails": "SiRubyonrails",
    "Spring Boot": "SiSpringboot",
    ".NET Minimal API": "SiDotnet",
    Hono: "SiHono",
    Open: "open",
    Custom: "custom",
  },
  Database: {
    Neon: "SiNeon",
    Supabase: "SiSupabase",
    PlanetScale: "SiPlanetscale",
    "MongoDB Atlas": "SiMongodb",
    "Self-managed Postgres": "SiPostgresql",
    Turso: "SiTurso",
    CockroachDB: "SiCockroachlabs",
    "Firebase Firestore": "SiFirebase",
    DynamoDB: "category-database",
    SQLite: "SiSqlite",
    Open: "open",
    Custom: "custom",
  },
  Auth: {
    Clerk: "SiClerk",
    Auth0: "SiAuth0",
    "Supabase Auth": "SiSupabase",
    "NextAuth/Auth.js": "SiNextdotjs",
    "Neon Auth": "SiNeon",
    "Firebase Authentication": "SiFirebase",
    WorkOS: "category-auth",
    "Amazon Cognito": "category-auth",
    Keycloak: "SiKeycloak",
    "Better Auth": "SiBetterauth",
    Open: "open",
    Custom: "custom",
  },
  Payments: {
    Stripe: "SiStripe",
    Xendit: "SiXendit",
    Paddle: "SiPaddle",
    LemonSqueezy: "SiLemonsqueezy",
    Adyen: "SiAdyen",
    PayPal: "SiPaypal",
    Midtrans: "category-payments",
    "Mercado Pago": "SiMercadopago",
    Braintree: "SiBraintree",
    Polar: "category-payments",
    Open: "open",
    Custom: "custom",
  },
  Hosting: {
    Vercel: "SiVercel",
    Netlify: "SiNetlify",
    Railway: "SiRailway",
    "Fly.io": "SiFlydotio",
    Render: "SiRender",
    "Cloudflare Workers": "SiCloudflareworkers",
    "AWS ECS": "category-hosting",
    "Google Cloud Run": "SiGooglecloud",
    "Azure Container Apps": "category-hosting",
    "Self-host/VPS": "category-hosting",
    Open: "open",
    Custom: "custom",
  },
};

export function validateCustomStackName(value: string): string | null {
  const trimmed = value.trim();
  const length = Array.from(trimmed).length;
  if (length === 0) return "Enter a stack name.";
  if (length > CUSTOM_STACK_NAME_MAX_LENGTH)
    return `Keep the stack name to ${CUSTOM_STACK_NAME_MAX_LENGTH} characters or fewer.`;
  if (trimmed === OPEN_STACK_OPTION || trimmed === CUSTOM_STACK_OPTION)
    return "Choose a different name for a custom stack.";
  return null;
}

export function isPresetStackChoice(category: StackCategory, value: string): boolean {
  return value !== CUSTOM_STACK_OPTION &&
    (stackOptions[category] as readonly string[]).includes(value);
}

export function isCustomStackChoice(category: StackCategory, value: string): boolean {
  return !isPresetStackChoice(category, value) && !validateCustomStackName(value);
}

export type ProductType = "Website" | "Web App" | "Mobile App";
export type ProjectScale = "MVP" | "Production product" | "Complex platform";

export function getRecommendedStack(
  productType: ProductType,
  scale: ProjectScale,
): Stack {
  const mobile = productType === "Mobile App";
  const complex = scale === "Complex platform";
  const production = scale === "Production product";
  return {
    Frontend: mobile ? "React + Vite" : complex ? "Next.js" : "Next.js",
    Backend: mobile || complex ? "FastAPI" : "Node.js/Express",
    Database: complex ? "CockroachDB" : "Neon",
    Auth: production || complex ? "WorkOS" : "Clerk",
    Payments: complex ? "Stripe" : production ? "Paddle" : "Open",
    Hosting: mobile ? "Cloudflare Workers" : complex ? "AWS ECS" : "Vercel",
  };
}

export function isValidStackChoice(category: StackCategory, value: string): boolean {
  return isPresetStackChoice(category, value) || isCustomStackChoice(category, value);
}

export function hasCompleteStack(stack: Stack): boolean {
  return stackCategories.every((category) => {
    const value = stack[category];
    return typeof value === "string" && isValidStackChoice(category, value);
  });
}
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
