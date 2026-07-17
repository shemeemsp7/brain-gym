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

export function getChallengePrompt(user, level) {
  return render(loadTemplate("challenge.txt"), {
    userName: user.name,
    userEmail: user.email,
    level
  });
}

export function getFeedbackPrompt(challenge, solution, user) {
  return render(loadTemplate("feedback.txt"), {
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
