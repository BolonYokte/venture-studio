import { calculateQuote } from "/src/quote-engine.mjs";

const form = document.querySelector("#quote-form");
const filesInputs = [...document.querySelectorAll("[data-photo-kind]")];
const count = document.querySelector("#photo-count");
const result = document.querySelector("#result");

function selectedEvidence() {
  return filesInputs.flatMap((input) => input.files?.[0] ? [{ kind: input.dataset.photoKind, file: input.files[0] }] : []);
}

for (const input of filesInputs) input.addEventListener("change", () => {
  count.textContent = `${selectedEvidence().length}/4 capturadas`;
  input.closest("label").classList.toggle("complete", Boolean(input.files?.length));
});

async function hashFile(file) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function hashText(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const evidence = selectedEvidence();
  const quote = calculateQuote({
    units: data.get("units"), pipeMeters: data.get("pipeMeters"), access: data.get("access"),
    electricalReady: data.has("electricalReady"), measurementsConfirmed: data.has("measurementsConfirmed"),
    reinforcedWall: data.has("reinforcedWall"), removeOldUnit: data.has("removeOldUnit"),
    photoCount: evidence.length, evidenceKinds: evidence.map(({ kind }) => kind),
  });
  const hashes = await Promise.all(evidence.map(async ({ kind, file }) => ({ kind, name: file.name, sha256: await hashFile(file) })));
  const fingerprint = await hashText(JSON.stringify({ quote, evidence: hashes.map(({ kind, sha256 }) => ({ kind, sha256 })) }));
  const money = new Intl.NumberFormat("es-ES", { style: "currency", currency: quote.currency, maximumFractionDigits: 0 });
  const decisionCopy = quote.decision.status === "ready_for_professional_confirmation"
    ? "Alcance listo para confirmación profesional."
    : quote.decision.status === "more_evidence_required"
      ? "Falta evidencia antes de confirmar el alcance."
      : "Revisión profesional obligatoria por las condiciones del caso.";
  result.innerHTML = `<div class="passport-label"><span>SCOPE PASSPORT</span><b>${quote.evidence.coverage}% cobertura</b></div><div class="result-head"><div><span class="confidence">Confianza ${quote.confidence}</span><h3>${money.format(quote.range.low)}–${money.format(quote.range.high)}</h3></div><button class="cta" type="button" onclick="window.print()">Imprimir dossier</button></div><div class="line-items">${quote.items.map((item) => `<p><span>${escapeHtml(item.label)}</span><strong>${money.format(item.amount)}</strong></p>`).join("")}</div><div class="decision"><strong>${decisionCopy}</strong>${quote.evidence.missing.length ? `<p>Falta: ${quote.evidence.missing.map(escapeHtml).join(" · ")}</p>` : ""}</div><div class="passport-meta"><span>Tarifa ${escapeHtml(quote.rateCardVersion)}</span><span>Protocolo ${escapeHtml(quote.evidence.protocolVersion)}</span></div><div class="manifest">${hashes.length ? hashes.map((item) => `${escapeHtml(item.kind)} / ${escapeHtml(item.name)}: ${item.sha256}`).join("<br>") : "Sin fotos adjuntas. El rango incorpora mayor incertidumbre."}<br><strong>CASE SHA-256: ${fingerprint}</strong></div>`;
  result.hidden = false;
  result.scrollIntoView({ behavior: "smooth", block: "center" });
});
