import type { GenerateDocumentsRequest } from "../lib/generator";

export const validGenerateRequest: GenerateDocumentsRequest = {
  idea: "A calm client portal for freelance designers and their customers.",
  stack: {
    Frontend: "Next.js",
    Backend: "Node.js/Express",
    Database: "Neon",
    Auth: "NextAuth/Auth.js",
    Hosting: "Vercel",
  },
  answers: {
    "product-type": "Web App",
    scale: "Production product",
    "stack-mode": "Manual selection",
    problem:
      "Project decisions, approvals, and feedback are scattered across email threads.",
    audience:
      "Independent designers and their clients who need one shared project record.",
    platform: "Web",
    browsers: "Current Chrome, Safari, Firefox, and keyboard-only navigation.",
    "core-flow":
      "A designer creates a project, shares a milestone, and the client approves it.",
    scope:
      "Project setup; milestone sharing; threaded feedback; approval history.",
    "out-of-scope":
      "Automated invoicing, public portfolios, and native mobile applications.",
    privacy:
      "Private project files and client feedback are visible only to project members.",
    auth: "Multiple roles",
    roles:
      "Designers manage projects; clients review assigned projects and submit approvals.",
    "output-language": "English",
    theme: "precision-blue",
    constraints:
      "The first release must be responsive and deploy cleanly on Vercel.",
  },
  selectedSkillIds: ["api-and-interface-design", "frontend-design"],
  includeClaudeBridge: false,
};
