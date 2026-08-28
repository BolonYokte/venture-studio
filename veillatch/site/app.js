import { redactText, rehydrateText } from "/src/redactor.mjs";
import { createUsageReceipt } from "/src/usage-receipt.mjs";

let mapping = [];
const source = document.querySelector("#source");
const terms = document.querySelector("#terms");
const safe = document.querySelector("#safe");
const response = document.querySelector("#response");
const restored = document.querySelector("#restored");
const summary = document.querySelector("#summary");

document.querySelector("#redact").addEventListener("click", () => {
  try {
    const result = redactText(source.value, terms.value.split(","));
    mapping = result.mapping;
    safe.value = result.safeText;
    summary.textContent = `${mapping.length} replacements · ${Object.entries(result.summary).map(([key, value]) => `${key}:${value}`).join(" · ") || "no supported identifiers detected"}`;
    response.value = result.safeText;
  } catch (error) {
    summary.textContent = error.message;
  }
});

document.querySelector("#restore").addEventListener("click", () => {
  restored.value = rehydrateText(response.value, mapping);
});

document.querySelector("#receipt").addEventListener("click", async () => {
  const output = document.querySelector("#receipt-output");
  try {
    const receipt = await createUsageReceipt({
      sourceText: source.value,
      safeText: safe.value,
      responseText: response.value,
      restoredText: restored.value,
      mapping,
      tool: document.querySelector("#tool-name").value,
      purpose: document.querySelector("#purpose").value,
      humanReviewed: document.querySelector("#human-reviewed").checked,
    });
    output.textContent = JSON.stringify(receipt, null, 2);
    output.hidden = false;
  } catch (error) {
    output.textContent = error.message;
    output.hidden = false;
  }
});
