// backend/src/challenge/prompts.js
import fs from "fs";
import path from "path";

const TEMPLATES_DIR = path.join(process.cwd(), "src/challenge/prompt-templates");
const templateCache = {};

function loadTemplate(filename) {
  if (!templateCache[filename]) {
    templateCache[filename] = fs.readFileSync(path.join(TEMPLATES_DIR, filename), "utf8");
  }
  return templateCache[filename];
}

function render(template, values) {
  return template.replace(/{{(\w+)}}/g, (_, key) => (values[key] ?? ""));
}

// Type-aware template lookup (doc/AI_CODE_REVIEW_GYM.md §4.1). Unknown type
// throws — routes whitelist `type` first, so this is a programmer-error guard.
const TEMPLATES = {
  solve:  { challenge: "challenge.txt", feedback: "feedback.txt" },
  review: { challenge: "review.txt",    feedback: "review-feedback.txt" }
};

function templatesFor(type) {
  const templates = TEMPLATES[type];
  if (!templates) throw new Error(`Unknown challenge type: ${type}`);
  return templates;
}

export function getChallengePrompt(user, level, type = "solve", extra = {}) {
  return render(loadTemplate(templatesFor(type).challenge), {
    userName: user.name,
    userEmail: user.email,
    level,
    ...extra
  });
}

export function getFeedbackPrompt(challenge, solution, user, type = "solve") {
  return render(loadTemplate(templatesFor(type).feedback), {
    challenge,
    solution,
    userName: user.name
  });
}

export function getClarificationPrompt(challenge, question, user) {
  return render(loadTemplate("clarify.txt"), {
    challenge,
    question,
    userName: user.name
  });
}
