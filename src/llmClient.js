// backend/src/llmClient.js
// Shared chat-completion client, routed through Portkey's Bedrock integration.
import { getPortkeyApiKey, PORTKEY_BASE_URL, PORTKEY_MODEL } from "./config";

export async function chatCompletion(prompt, { model = PORTKEY_MODEL } = {}) {
  const response = await fetch(`${PORTKEY_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-portkey-api-key": getPortkeyApiKey()
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    throw new Error(`Portkey request failed (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}
