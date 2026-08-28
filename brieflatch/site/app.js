import { parseFieldBrief } from "/src/parser.mjs";

const transcript = document.querySelector("#transcript");
const brief = document.querySelector("#brief");
let currentBrief = null;

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

async function hashPayload(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
document.querySelector("#sample").addEventListener("click", () => {
  transcript.value = "Cliente Comunidad Sol. Urgente: hay que reparar la fuga hoy en Calle Luna 14. El fontanero debe llamar al 612 345 678 antes de entrar. Han hablado de unos 180 euros.";
});
document.querySelector("#process").addEventListener("click", () => {
  try {
    const result = parseFieldBrief(transcript.value);
    currentBrief = result;
    const questions = result.questions.length ? `<div class="questions"><b>DESPACHO BLOQUEADO</b><ul>${result.questions.map((question) => `<li>${escapeHtml(question)}</li>`).join("")}</ul></div>` : `<div class="confirm-box"><p>El parte contiene el contexto mínimo. Una persona debe confirmarlo antes del despacho.</p><button id="confirm-brief" type="button">Confirmar operational handshake</button></div>`;
    brief.innerHTML = `<div class="brief-top"><b>PARTE GENERADO</b><strong>${result.readyToConfirm ? "espera confirmación" : "bloqueado"}</strong></div><div class="brief-score"><span>ACCIONABILIDAD</span><b>${result.actionabilityScore}/100</b></div><div class="brief-grid"><p><span>CLIENTE</span>${escapeHtml(result.client || "No indicado")}</p><p><span>PRIORIDAD</span>${escapeHtml(result.priority)}</p><p><span>UBICACIÓN</span>${escapeHtml(result.location || "No indicada")}</p><p><span>FECHA</span>${escapeHtml(result.dueHint || "No indicada")}</p><p><span>ACCIÓN</span>${escapeHtml(result.actions[0] || "No definida")}</p><p><span>IMPORTE MENCIONADO</span>${result.amountMentioned ? `${result.amountMentioned} €` : "Ninguno"}</p></div>${questions}`;
    brief.hidden = false;
  } catch (error) {
    brief.innerHTML = `<div class="questions">${error.message}</div>`;
    brief.hidden = false;
  }
});

brief.addEventListener("click", async (event) => {
  if (event.target.id !== "confirm-brief" || !currentBrief?.readyToConfirm) return;
  const confirmedAt = new Date().toISOString();
  const receiptHash = await hashPayload({
    sourceTranscript: currentBrief.sourceTranscript,
    client: currentBrief.client,
    location: currentBrief.location,
    actions: currentBrief.actions,
    dueHint: currentBrief.dueHint,
    priority: currentBrief.priority,
  });
  event.target.closest(".confirm-box").outerHTML = `<div class="handshake-receipt"><span>OPERATIONAL HANDSHAKE CONFIRMED</span><strong>Listo para despacho</strong><p>${escapeHtml(confirmedAt)}</p><code>SHA-256 ${receiptHash}</code></div>`;
});
