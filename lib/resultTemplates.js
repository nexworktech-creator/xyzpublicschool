// The 10 report-card designs Admin can choose between from
// Admin → Result Template Selection. Each entry is pure style data — colors,
// fonts, header/table layout variant — consumed by both:
//   - the PDFKit renderer in app/api/results/export/pdf/route.js (real PDF)
//   - the ResultTemplateGallery preview cards (HTML/Tailwind approximation)
// so picking a template changes what every printed/downloaded result card
// actually looks like, not just a name.
//
// `headerStyle` and `tableStyle` are layout variants understood by the
// shared drawing helpers in app/api/results/export/pdf/route.js — see the
// HEADER_DRAWERS / TABLE_DRAWERS maps there.

export const RESULT_TEMPLATES = [
  {
    id: "classic-navy",
    name: "Classic Navy",
    description: "Bordered navy header, brass tagline — the traditional prospectus look.",
    accent: "#1b2a4a",
    accentSoft: "#8a6d3b",
    font: "Helvetica",
    headerStyle: "bordered",
    tableStyle: "ruled",
  },
  {
    id: "minimal-clean",
    name: "Minimal Clean",
    description: "No borders, thin rules, plenty of white space — a modern minimalist sheet.",
    accent: "#111827",
    accentSoft: "#6b7280",
    font: "Helvetica",
    headerStyle: "plain",
    tableStyle: "minimal",
  },
  {
    id: "modern-band",
    name: "Modern Band",
    description: "Full-width colour banner across the top with the school name reversed out.",
    accent: "#0f766e",
    accentSoft: "#134e4a",
    font: "Helvetica",
    headerStyle: "band",
    tableStyle: "striped",
  },
  {
    id: "maroon-traditional",
    name: "Maroon Traditional",
    description: "Double-rule border, serif type — a formal certificate-style card.",
    accent: "#7f1d1d",
    accentSoft: "#92400e",
    font: "Times-Roman",
    headerStyle: "double-border",
    tableStyle: "ruled",
  },
  {
    id: "bold-banner",
    name: "Bold Banner",
    description: "Large bold banner header with big type — easy to read at a glance.",
    accent: "#1d4ed8",
    accentSoft: "#1e293b",
    font: "Helvetica-Bold",
    headerStyle: "band",
    tableStyle: "ruled",
  },
  {
    id: "info-panel",
    name: "Info Panel",
    description: "Student details in a boxed side panel, marks table alongside.",
    accent: "#312e81",
    accentSoft: "#4338ca",
    font: "Helvetica",
    headerStyle: "bordered",
    tableStyle: "panel",
  },
  {
    id: "grid-cards",
    name: "Grid Cards",
    description: "Each subject in its own boxed grid cell — good for fewer, bigger subjects.",
    accent: "#065f46",
    accentSoft: "#047857",
    font: "Helvetica",
    headerStyle: "plain",
    tableStyle: "grid",
  },
  {
    id: "ribbon-rank",
    name: "Ribbon Rank",
    description: "A corner ribbon badge calls out the student's rank and overall grade.",
    accent: "#b45309",
    accentSoft: "#78350f",
    font: "Helvetica",
    headerStyle: "bordered",
    tableStyle: "ruled",
    showRibbon: true,
  },
  {
    id: "formal-board",
    name: "Formal Board",
    description: "Courier-set, official-looking layout with a signature/stamp box — CBSE-style.",
    accent: "#1f2937",
    accentSoft: "#374151",
    font: "Courier",
    headerStyle: "double-border",
    tableStyle: "minimal",
    showSignatureBox: true,
  },
  {
    id: "compact-sheet",
    name: "Compact Mark-sheet",
    description: "Dense tabular sheet, smaller type — fits many subjects on one page.",
    accent: "#334155",
    accentSoft: "#475569",
    font: "Helvetica",
    headerStyle: "plain",
    tableStyle: "compact",
  },
  {
    id: "official-marksheet",
    name: "Official Marksheet",
    description:
      "Traditional CBSE-style Statement of Marks: contact/affiliation line, SCHOLASTIC AREA table with a column per exam component, overall marks strip, three-way signature line and a grading-scale legend footer.",
    accent: "#000000",
    accentSoft: "#333333",
    font: "Times-Roman",
    // Built by a dedicated full-page drawer (drawOfficialMarksheet in
    // app/api/results/export/pdf/route.js) instead of the generic
    // HEADER_DRAWERS / TABLE_DRAWERS pieces used by the templates above —
    // headerStyle/tableStyle are left unset since they aren't consulted.
    layout: "marksheet",
  },
];

export const TEMPLATE_IDS = RESULT_TEMPLATES.map((t) => t.id);

export function getTemplate(id) {
  return RESULT_TEMPLATES.find((t) => t.id === id) || RESULT_TEMPLATES[0];
}
