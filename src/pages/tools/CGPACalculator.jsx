import React, { useState, useEffect, useRef } from "react";
import { databases, account } from "@/lib/appwrite";
import { ID } from "appwrite";
import {
  Plus, Trash2, ChevronDown, ChevronUp, History,
  Upload, Sparkles, Save, CheckCircle2, RotateCcw,
  FileDown, ImageDown, Loader2, X,
} from "lucide-react";

// ─── Appwrite ─────────────────────────────────────────────────────────────────
const DATABASE_ID   = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = "cgpa_records";

// ─── Gemini API — free tier, no proxy needed (CORS allowed) ──────────────────
// Get free key at: aistudio.google.com → Get API key → paste as VITE_GEMINI_API_KEY
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

// ─── Grade map ────────────────────────────────────────────────────────────────
const GRADE_POINTS = { O: 10, "A+": 9, A: 8, "B+": 7, B: 6, C: 5, F: 0 };
const GRADE_LABELS = ["O", "A+", "A", "B+", "B", "C", "F"];

// ─── Core math ────────────────────────────────────────────────────────────────
function computeSGPA(subjects) {
  let earned = 0, total = 0;
  for (const s of subjects) {
    const cr = Number(s.credits) || 0;
    total  += cr;
    earned += (GRADE_POINTS[s.grade] ?? 0) * cr;
  }
  return total === 0 ? null : earned / total;
}
function computeCGPA(semesters) {
  const sgpas = semesters.map(s => computeSGPA(s.subjects)).filter(v => v !== null);
  if (!sgpas.length) return 0;
  return sgpas.reduce((a, b) => a + b, 0) / sgpas.length;
}
const toPercent  = (c) => (c * 9.5).toFixed(2);
const gradeLabel = (c) =>
  c >= 9 ? "Outstanding" : c >= 8 ? "Excellent" : c >= 7 ? "Very Good" :
  c >= 6 ? "Good" : c >= 5 ? "Average" : c > 0 ? "Needs Improvement" : "—";

// ─── Colour helpers ───────────────────────────────────────────────────────────
const scoreColor = (v) =>
  !v ? "text-muted-foreground"
  : v >= 8.5 ? "text-emerald-600 dark:text-emerald-400"
  : v >= 7   ? "text-blue-600 dark:text-blue-400"
  : v >= 5   ? "text-amber-600 dark:text-amber-400"
  : "text-red-600 dark:text-red-400";

const scoreDot = (v) =>
  !v ? "bg-muted-foreground/30"
  : v >= 8.5 ? "bg-emerald-500"
  : v >= 7   ? "bg-blue-500"
  : v >= 5   ? "bg-amber-500"
  : "bg-red-500";

const scoreHex = (v) =>
  !v ? "#94a3b8"
  : v >= 8.5 ? "#10b981" : v >= 7 ? "#3b82f6"
  : v >= 5   ? "#f59e0b" : "#ef4444";

// ─── Factories ────────────────────────────────────────────────────────────────
const uid         = () => crypto.randomUUID();
const newSubject  = () => ({ id: uid(), name: "", credits: "", grade: "O" });
const newSemester = (n) => ({ id: uid(), name: `Semester ${n}`, subjects: [newSubject()] });

// ─── File → base64 ───────────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ════════════════════════════════════════════════════════════════════════════
// ─── PDF EXPORT (pure JS, no lib needed) ────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════
function buildExportHTML(semesters, cgpa, percentage) {
  const scoreC = (v) =>
    !v ? "#64748b"
    : v >= 8.5 ? "#10b981" : v >= 7 ? "#3b82f6"
    : v >= 5   ? "#f59e0b" : "#ef4444";

  const semRows = semesters.map((sem, i) => {
    const sgpa = computeSGPA(sem.subjects);
    const subRows = sem.subjects.map(s => `
      <tr>
        <td style="padding:5px 8px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#334155">${s.name || "—"}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:12px;color:#334155">${s.credits || "—"}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:12px;font-weight:600;color:${scoreC(GRADE_POINTS[s.grade])}">${s.grade}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:12px;color:#64748b">${GRADE_POINTS[s.grade]}</td>
      </tr>`).join("");

    return `
      <div style="margin-bottom:20px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
        <div style="background:#f8fafc;padding:10px 14px;display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:8px;height:8px;border-radius:50%;background:${scoreC(sgpa)}"></div>
            <span style="font-size:13px;font-weight:600;color:#1e293b">${sem.name}</span>
            <span style="font-size:11px;color:#94a3b8">${sem.subjects.reduce((a,s)=>a+(Number(s.credits)||0),0)} credits</span>
          </div>
          <div style="text-align:right">
            <div style="font-size:16px;font-weight:700;color:${scoreC(sgpa)}">${sgpa ? sgpa.toFixed(3) : "—"}</div>
            <div style="font-size:10px;color:#94a3b8">SGPA</div>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f1f5f9">
              <th style="padding:6px 8px;text-align:left;font-size:10px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Subject</th>
              <th style="padding:6px 8px;text-align:center;font-size:10px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Cr.</th>
              <th style="padding:6px 8px;text-align:center;font-size:10px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Grade</th>
              <th style="padding:6px 8px;text-align:center;font-size:10px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Pts</th>
            </tr>
          </thead>
          <tbody>${subRows}</tbody>
        </table>
      </div>`;
  }).join("");

  const sgpaChips = semesters.map((sem, i) => {
    const sgpa = computeSGPA(sem.subjects);
    return sgpa ? `<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;border:1px solid #e2e8f0;background:#f8fafc;font-size:11px;margin-right:6px">
      <span style="color:#64748b">S${i+1}</span>
      <span style="font-weight:700;color:${scoreC(sgpa)}">${sgpa.toFixed(3)}</span>
    </span>` : "";
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>CGPA Report — Unizuya</title>
  <style>
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 32px; background: #fff; color: #1e293b; }
  </style>
  </head><body>
  <div style="max-width:680px;margin:0 auto">
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #e2e8f0">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px">🎓</div>
        <div>
          <div style="font-size:18px;font-weight:700;color:#1e293b">CGPA Report</div>
          <div style="font-size:11px;color:#94a3b8">Unizuya · JC Bose / 10-point grading</div>
        </div>
      </div>
      <div style="font-size:11px;color:#94a3b8">${new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</div>
    </div>

    <!-- Summary -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px">
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;text-align:center">
        <div style="font-size:28px;font-weight:700;color:${scoreC(cgpa)}">${cgpa > 0 ? cgpa.toFixed(2) : "—"}</div>
        <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-top:2px">CGPA</div>
        <div style="font-size:11px;color:#64748b;margin-top:4px">${gradeLabel(cgpa)}</div>
      </div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;text-align:center">
        <div style="font-size:28px;font-weight:700;color:#6366f1">${percentage}<span style="font-size:14px">%</span></div>
        <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-top:2px">Percentage</div>
        <div style="font-size:11px;color:#64748b;margin-top:4px">CGPA × 9.5</div>
      </div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;text-align:center">
        <div style="font-size:28px;font-weight:700;color:#f59e0b">${semesters.length}</div>
        <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-top:2px">Semesters</div>
        <div style="font-size:11px;color:#64748b;margin-top:4px">${semesters.reduce((s,sem)=>s+sem.subjects.reduce((a,sub)=>a+(Number(sub.credits)||0),0),0)} total credits</div>
      </div>
    </div>

    <!-- SGPA strip -->
    <div style="margin-bottom:20px;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px">
      <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">SGPA per Semester</div>
      <div>${sgpaChips}</div>
    </div>

    <!-- Semester breakdown -->
    ${semRows}

    <!-- Footer -->
    <div style="margin-top:24px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center">
      Generated by Unizuya CGPA Calculator · ${new Date().toISOString()}
    </div>
  </div>
  </body></html>`;
}

function exportAsPDF(semesters, cgpa, percentage) {
  const html    = buildExportHTML(semesters, cgpa, percentage);
  const blob    = new Blob([html], { type: "text/html" });
  const url     = URL.createObjectURL(blob);
  const win     = window.open(url, "_blank");
  if (win) {
    win.onload = () => { win.print(); URL.revokeObjectURL(url); };
  }
}

async function exportAsImage(semesters, cgpa, percentage) {
  // render to hidden iframe → canvas via html2canvas CDN
  const html     = buildExportHTML(semesters, cgpa, percentage);
  const iframe   = document.createElement("iframe");
  iframe.style   = "position:fixed;top:-9999px;left:-9999px;width:720px;height:1px;border:0";
  document.body.appendChild(iframe);
  iframe.contentDocument.open();
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();

  await new Promise(r => setTimeout(r, 600)); // let iframe render

  // load html2canvas dynamically
  await new Promise((res, rej) => {
    if (window.html2canvas) { res(); return; }
    const s   = document.createElement("script");
    s.src     = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    s.onload  = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });

  const canvas = await window.html2canvas(iframe.contentDocument.body, {
    scale: 2, useCORS: true, backgroundColor: "#ffffff",
    width: 720, windowWidth: 720,
  });
  document.body.removeChild(iframe);

  const a    = document.createElement("a");
  a.href     = canvas.toDataURL("image/png");
  a.download = `cgpa-report-${new Date().toISOString().slice(0,10)}.png`;
  a.click();
}

// ─── GradeRing ─────────────────────────────────────────────────────────────────
function GradeRing({ value, size = 100, stroke = 8 }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const pct = value ? Math.min(value / 10, 1) : 0;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="currentColor" strokeWidth={stroke} className="text-border/30" />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={scoreHex(value)} strokeWidth={stroke}
        strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray .7s cubic-bezier(.4,0,.2,1), stroke .4s" }} />
    </svg>
  );
}

// ─── SubjectRow ────────────────────────────────────────────────────────────────
function SubjectRow({ sub, onChange, onRemove, canRemove }) {
  return (
    <div className="grid items-center gap-2 mb-1.5"
      style={{ gridTemplateColumns: "1fr 70px 100px 32px", minWidth: 340 }}>
      <input placeholder="Subject name" value={sub.name}
        onChange={e => onChange({ ...sub, name: e.target.value })}
        className="h-8 px-2.5 text-sm rounded-md border border-input bg-background
                   text-foreground placeholder:text-muted-foreground/50
                   focus:outline-none focus:ring-1 focus:ring-ring transition-colors" />
      <input type="number" placeholder="Cr." min="0" max="10" step="0.5"
        value={sub.credits}
        onChange={e => onChange({ ...sub, credits: e.target.value })}
        className="h-8 px-2 text-sm text-center rounded-md border border-input bg-background
                   text-foreground placeholder:text-muted-foreground/50
                   focus:outline-none focus:ring-1 focus:ring-ring transition-colors" />
      <select value={sub.grade}
        onChange={e => onChange({ ...sub, grade: e.target.value })}
        className="h-8 px-2 text-sm rounded-md border border-input bg-background
                   text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer transition-colors">
        {GRADE_LABELS.map(g => <option key={g} value={g}>{g}  ({GRADE_POINTS[g]})</option>)}
      </select>
      <button onClick={onRemove} disabled={!canRemove}
        className={`flex items-center justify-center h-8 w-8 rounded-md transition-colors
          ${canRemove ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      : "text-muted-foreground/20 cursor-not-allowed"}`}>
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ─── SemesterCard ──────────────────────────────────────────────────────────────
function SemesterCard({ sem, onUpdate, onRemove, canRemove, isOpen, onToggle }) {
  const sgpa    = computeSGPA(sem.subjects);
  const credits = sem.subjects.reduce((s, sub) => s + (Number(sub.credits) || 0), 0);

  const updateSubject = (idx, u) => {
    const subs = [...sem.subjects]; subs[idx] = u; onUpdate({ ...sem, subjects: subs });
  };
  const removeSubject = (idx) => onUpdate({ ...sem, subjects: sem.subjects.filter((_, i) => i !== idx) });
  const addSubject    = ()    => onUpdate({ ...sem, subjects: [...sem.subjects, newSubject()] });

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden mb-3 transition-shadow hover:shadow-sm">
      <button onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3
                   hover:bg-muted/40 transition-colors text-left">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full shrink-0 ${scoreDot(sgpa)}`} />
          <span className="text-sm font-semibold text-foreground">{sem.name}</span>
          <span className="text-xs text-muted-foreground">{credits} cr</span>
        </div>
        <div className="flex items-center gap-3">
          {sgpa !== null ? (
            <div className="text-right">
              <div className={`text-sm font-bold tabular-nums ${scoreColor(sgpa)}`}>{sgpa.toFixed(3)}</div>
              <div className="text-[10px] text-muted-foreground leading-none">SGPA</div>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/50">No credits yet</span>
          )}
          {canRemove && (
            <button onClick={e => { e.stopPropagation(); onRemove(); }}
              className="p-1 rounded text-muted-foreground hover:text-destructive
                         hover:bg-destructive/10 transition-colors">
              <Trash2 size={13} />
            </button>
          )}
          {isOpen ? <ChevronUp size={15} className="text-muted-foreground/50" />
                  : <ChevronDown size={15} className="text-muted-foreground/50" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-border/50">
          <div className="overflow-x-auto -mx-4 px-4">
          <div className="grid gap-2 mb-2 px-0.5" style={{ gridTemplateColumns: "1fr 70px 100px 32px", minWidth: 340 }}>
            {["Subject", "Credits", "Grade", ""].map(h => (
              <div key={h} className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">{h}</div>
            ))}
          </div>
          {sem.subjects.map((sub, i) => (
            <SubjectRow key={sub.id} sub={sub}
              onChange={u => updateSubject(i, u)}
              onRemove={() => removeSubject(i)}
              canRemove={sem.subjects.length > 1} />
          ))}
          <button onClick={addSubject}
            className="mt-2 w-full flex items-center justify-center gap-1.5 h-8 text-xs
                       text-muted-foreground border border-dashed border-border/60 rounded-md
                       hover:border-border hover:text-foreground hover:bg-muted/30 transition-colors">
            <Plus size={12} /> Add Subject
          </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SGPAProgressionBar ────────────────────────────────────────────────────────
function SGPAProgressionBar({ semesters }) {
  if (semesters.length < 2) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4 mb-4">
      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60 mb-4">
        Semester Progression
      </p>
      <div className="flex items-end gap-3" style={{ height: 96 }}>
        {semesters.map((sem, i) => {
          const sgpa = computeSGPA(sem.subjects);
          const h    = sgpa ? Math.max(14, (sgpa / 10) * 56) : 14;
          return (
            <div key={sem.id} className="flex flex-col flex-1 items-center" style={{ gap: 8 }}>
              <span className="text-xs font-semibold tabular-nums"
                style={{ color: scoreHex(sgpa), lineHeight: 1 }}>
                {sgpa ? sgpa.toFixed(2) : "—"}
              </span>
              <div className="w-full rounded transition-all duration-500"
                style={{ height: h, background: scoreHex(sgpa), opacity: 0.85 }} />
              <span className="text-[11px] text-muted-foreground/60 font-medium" style={{ lineHeight: 1 }}>S{i + 1}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SavedRecord ───────────────────────────────────────────────────────────────
function SavedRecord({ record, onLoad, onDelete }) {
  const date = new Date(record.savedAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });
  const sems = JSON.parse(record.semesters);
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-border
                    bg-card mb-2.5 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`text-base font-bold tabular-nums ${scoreColor(record.cgpa)}`}>
          {record.cgpa.toFixed(3)}
        </div>
        <div>
          <div className="text-xs text-foreground/70 font-medium">
            {record.percentage}% · {sems.length} semester{sems.length > 1 ? "s" : ""}
          </div>
          <div className="text-[11px] text-muted-foreground">{date}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onLoad(record)}
          className="text-[11px] px-3 py-1 rounded-lg border border-primary/30
                     text-primary hover:bg-primary/10 font-medium transition-colors">Load</button>
        <button onClick={() => onDelete(record.$id)}
          className="text-[11px] px-3 py-1 rounded-lg border border-destructive/30
                     text-destructive hover:bg-destructive/10 font-medium transition-colors">Delete</button>
      </div>
    </div>
  );
}

// ─── AIScanModal ───────────────────────────────────────────────────────────────
function AIScanModal({ onClose, onApply, semesterName }) {
  const [file,    setFile]    = useState(null);
  const [preview, setPreview] = useState(null);
  const [status,  setStatus]  = useState("idle"); // idle | scanning | review | error
  const [parsed,  setParsed]  = useState([]);
  const [errMsg,  setErrMsg]  = useState("");
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null); // PDF
    }
  };

  const handleScan = async () => {
    if (!file) return;
    setStatus("scanning"); setErrMsg("");
    try {
      const base64 = await fileToBase64(file);
      const isImage = file.type.startsWith("image/");
      const mediaType = isImage ? file.type : "application/pdf";

      // Gemini request format
      const prompt = `This is a university marksheet/report card. Extract ALL subjects and return ONLY a valid JSON array. No explanation, no markdown, no code fences — just the raw JSON array.

Format: [{"name":"Subject Name","credits":3,"grade":"A"}]

Rules:
- grade must be one of: O, A+, A, B+, B, C, F
- credits can be decimal like 1.5
- skip any row that is not a subject (e.g. totals, headers)
- if grade is missing or unclear, use "B" as default`;

      const body = {
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: mediaType,
                data: base64,
              },
            },
            { text: prompt },
          ],
        }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 2048,
        },
      };

      const res = await fetch(GEMINI_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || `API error ${res.status}`);
      }

      const data  = await res.json();
      const text  = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim() ?? "";
      const clean = text.replace(/```json|```/g, "").trim();
      const subjects = JSON.parse(clean);

      if (!Array.isArray(subjects) || subjects.length === 0)
        throw new Error("No subjects found in the result.");

      // Normalise
      const normalised = subjects.map(s => ({
        id:      uid(),
        name:    String(s.name || "").trim(),
        credits: String(s.credits || ""),
        grade:   GRADE_LABELS.includes(s.grade) ? s.grade : "B",
      }));

      setParsed(normalised);
      setStatus("review");
    } catch (err) {
      setErrMsg(err.message || "Scan failed. Try a clearer image.");
      setStatus("error");
    }
  };

  const updateParsed = (idx, field, value) => {
    setParsed(p => p.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };
  const removeParsed = (idx) => setParsed(p => p.filter((_, i) => i !== idx));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4
                    bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-background border border-border rounded-2xl
                      shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles size={14} className="text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">AI Scan Result</div>
              <div className="text-[11px] text-muted-foreground">
                {semesterName} · Upload your marksheet
              </div>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground
                       hover:bg-muted transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {/* Upload area */}
          {status !== "review" && (
            <div
              onClick={() => fileRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-3 p-8
                          rounded-xl border-2 border-dashed cursor-pointer transition-colors mb-4
                          ${file ? "border-primary/50 bg-primary/[0.03]" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}>
              <input ref={fileRef} type="file" accept="image/*,.pdf"
                className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
              {preview ? (
                <img src={preview} alt="preview"
                  className="max-h-32 rounded-lg object-contain border border-border" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Upload size={18} className="text-muted-foreground" />
                </div>
              )}
              <div className="text-center">
                <div className="text-sm font-medium text-foreground">
                  {file ? file.name : "Click to upload marksheet"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  PNG, JPG or PDF · Your Sem result card
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
              <p className="text-xs text-destructive">{errMsg}</p>
            </div>
          )}

          {/* Review parsed subjects */}
          {status === "review" && (
            <div>
              <p className="text-xs text-muted-foreground mb-3">
                Review and edit the extracted subjects before applying.
              </p>
              <div className="grid gap-2 mb-2 px-0.5"
                style={{ gridTemplateColumns: "1fr 60px 90px 28px" }}>
                {["Subject", "Cr.", "Grade", ""].map(h => (
                  <div key={h} className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">{h}</div>
                ))}
              </div>
              {parsed.map((sub, i) => (
                <div key={sub.id} className="grid items-center gap-2 mb-1.5"
                  style={{ gridTemplateColumns: "1fr 60px 90px 28px" }}>
                  <input value={sub.name}
                    onChange={e => updateParsed(i, "name", e.target.value)}
                    className="h-8 px-2.5 text-sm rounded-md border border-input bg-background
                               text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                  <input type="number" value={sub.credits} min="0" max="10" step="0.5"
                    onChange={e => updateParsed(i, "credits", e.target.value)}
                    className="h-8 px-2 text-sm text-center rounded-md border border-input
                               bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                  <select value={sub.grade}
                    onChange={e => updateParsed(i, "grade", e.target.value)}
                    className="h-8 px-2 text-sm rounded-md border border-input bg-background
                               text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer">
                    {GRADE_LABELS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <button onClick={() => removeParsed(i)}
                    className="flex items-center justify-center h-8 w-7 rounded-md
                               text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button onClick={() => setParsed(p => [...p, newSubject()])}
                className="mt-2 w-full flex items-center justify-center gap-1.5 h-8 text-xs
                           text-muted-foreground border border-dashed border-border/60 rounded-md
                           hover:border-border hover:text-foreground transition-colors">
                <Plus size={12} /> Add row
              </button>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="px-5 py-4 border-t border-border shrink-0 flex gap-2.5">
          {status !== "review" ? (
            <>
              <button onClick={onClose}
                className="flex-1 text-sm font-medium px-4 py-2.5 rounded-xl border border-border
                           text-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={handleScan} disabled={!file || status === "scanning"}
                className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium
                            px-4 py-2.5 rounded-xl bg-primary text-primary-foreground
                            hover:bg-primary/90 transition-colors
                            ${(!file || status === "scanning") ? "opacity-50 cursor-not-allowed" : ""}`}>
                {status === "scanning"
                  ? <><Loader2 size={14} className="animate-spin" /> Scanning…</>
                  : <><Sparkles size={14} /> Scan with AI</>}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setStatus("idle"); setParsed([]); }}
                className="flex-1 text-sm font-medium px-4 py-2.5 rounded-xl border border-border
                           text-foreground hover:bg-muted transition-colors">
                Re-scan
              </button>
              <button onClick={() => { onApply(parsed); onClose(); }}
                disabled={parsed.length === 0}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-medium
                           px-4 py-2.5 rounded-xl bg-primary text-primary-foreground
                           hover:bg-primary/90 transition-colors">
                <CheckCircle2 size={14} /> Apply to Semester
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ─── MAIN ────────────────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════
export default function CGPACalculator() {
  const [semesters,  setSemesters]  = useState([newSemester(1)]);
  const [openSems,   setOpenSems]   = useState({ 0: true });
  const [view,       setView]       = useState("calc");
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [saveError,  setSaveError]  = useState("");
  const [records,    setRecords]    = useState([]);
  const [loadingRec, setLoadingRec] = useState(true);
  const [userId,     setUserId]     = useState(null);
  const [exporting,  setExporting]  = useState(false);

  // AI scan modal — tracks which semester index triggered it
  const [scanModal,  setScanModal]  = useState(null); // null | semIndex

  const cgpa       = computeCGPA(semesters);
  const percentage = cgpa > 0 ? toPercent(cgpa) : "0.00";
  const totalCr    = semesters.reduce((s, sem) =>
    s + sem.subjects.reduce((a, sub) => a + (Number(sub.credits) || 0), 0), 0);
  const validSgpas = semesters.map(s => computeSGPA(s.subjects)).filter(v => v !== null);

  useEffect(() => {
    (async () => {
      try {
        const user = await account.get();
        setUserId(user.$id);
        const res  = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
        setRecords(res.documents
          .filter(d => d.userId === user.$id)
          .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt)));
      } catch (_) {}
      finally { setLoadingRec(false); }
    })();
  }, []);

  const addSemester = () => {
    const idx = semesters.length;
    setSemesters(p => [...p, newSemester(idx + 1)]);
    setOpenSems(p => ({ ...p, [idx]: true }));
  };
  const updateSemester = (idx, u) => setSemesters(p => p.map((s, i) => i === idx ? u : s));
  const removeSemester = (idx) => {
    setSemesters(p => p.filter((_, i) => i !== idx));
    setOpenSems(p => {
      const n = {};
      Object.keys(p).forEach(k => {
        if (Number(k) !== idx) n[Number(k) > idx ? Number(k) - 1 : k] = p[k];
      });
      return n;
    });
  };
  const toggleSem = (idx) => setOpenSems(p => ({ ...p, [idx]: !p[idx] }));
  const resetAll  = () => { setSemesters([newSemester(1)]); setOpenSems({ 0: true }); };

  // Apply AI-scanned subjects to a semester
  const applyAIScan = (semIdx, subjects) => {
    updateSemester(semIdx, { ...semesters[semIdx], subjects });
    setOpenSems(p => ({ ...p, [semIdx]: true }));
  };

  const handleSave = async () => {
    if (!userId) { setSaveError("You must be logged in to save."); return; }
    if (cgpa === 0) { setSaveError("Add some grades first."); return; }
    setSaving(true); setSaveError("");
    try {
      const doc = await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
        userId,
        cgpa:       parseFloat(cgpa.toFixed(4)),
        percentage: parseFloat(percentage),
        semesters:  JSON.stringify(semesters),
        savedAt:    new Date().toISOString(),
      });
      setRecords(p => [doc, ...p]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError("Save failed — check Appwrite collection permissions.");
      console.error(err);
    } finally { setSaving(false); }
  };

  const handleLoad = (record) => {
    const loaded = JSON.parse(record.semesters);
    setSemesters(loaded);
    setOpenSems(Object.fromEntries(loaded.map((_, i) => [i, i === 0])));
    setView("calc");
  };
  const handleDelete = async (id) => {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, id);
      setRecords(p => p.filter(r => r.$id !== id));
    } catch (err) { console.error(err); }
  };

  const handleExportImage = async () => {
    setExporting(true);
    try { await exportAsImage(semesters, cgpa, percentage); }
    catch (e) { console.error(e); }
    finally { setExporting(false); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      {/* AI Scan Modal */}
      {scanModal !== null && (
        <AIScanModal
          semesterName={semesters[scanModal]?.name ?? ""}
          onClose={() => setScanModal(null)}
          onApply={(subjects) => applyAIScan(scanModal, subjects)}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-20">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">CGPA Calculator</h1>
            <p className="text-sm text-muted-foreground">10-point · JC Bose / Indian university standard</p>
          </div>
          <button onClick={() => setView(v => v === "history" ? "calc" : "history")}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg
                        border transition-colors
                        ${view === "history"
                          ? "border-primary/40 text-primary bg-primary/5"
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
            <History size={13} />
            History {records.length > 0 && `(${records.length})`}
          </button>
        </div>

        {/* ── HISTORY ── */}
        {view === "history" && (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              {loadingRec ? "Loading…"
               : records.length === 0 ? "No saved snapshots yet."
               : "Your saved snapshots — load any to restore."}
            </p>
            {records.map(r => (
              <SavedRecord key={r.$id} record={r} onLoad={handleLoad} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {/* ── CALCULATOR ── */}
        {view === "calc" && (
          <>
            {/* Info banner */}
            <div className="rounded-xl bg-muted/50 border border-border/50 px-4 py-3 mb-6 flex items-start gap-3">
              <div className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">i</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="text-foreground font-medium">How CGPA is calculated: </span>
                Enter subjects + credits + grade for each semester → SGPA computed per semester →
                CGPA = average of all SGPAs (matches JC Bose marksheet formula).
              </p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="col-span-1 rounded-xl border border-border bg-card flex flex-col items-center justify-center py-5 px-3 gap-2">
                <div className="relative flex items-center justify-center">
                  <GradeRing value={cgpa} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-xl font-bold tabular-nums ${scoreColor(cgpa)}`}>
                      {cgpa > 0 ? cgpa.toFixed(2) : "—"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">CGPA</span>
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground text-center">{gradeLabel(cgpa)}</span>
              </div>
              <div className="col-span-2 grid grid-rows-2 gap-3">
                <div className="rounded-xl border border-border bg-card px-4 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-0.5">Percentage</div>
                    <div className="text-2xl font-bold text-primary tabular-nums">
                      {percentage}<span className="text-sm font-normal text-primary/60">%</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground/50">CGPA × 9.5</div>
                </div>
                <div className="rounded-xl border border-border bg-card px-4 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-0.5">Semesters</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-amber-500 dark:text-amber-400 tabular-nums">{validSgpas.length}</span>
                      <span className="text-xs text-muted-foreground">/ {totalCr} cr total</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground/50">avg of SGPAs</div>
                </div>
              </div>
            </div>

            {/* SGPA strip */}
            {validSgpas.length > 0 && (
              <div className="rounded-xl border border-border bg-card px-4 py-3 mb-4">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60 mb-2.5">SGPA per Semester</p>
                <div className="flex flex-wrap gap-2">
                  {semesters.map((sem, i) => {
                    const sgpa = computeSGPA(sem.subjects);
                    if (!sgpa) return null;
                    return (
                      <div key={sem.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-muted/40 text-xs">
                        <span className="text-muted-foreground">S{i + 1}</span>
                        <span className={`font-bold tabular-nums ${scoreColor(sgpa)}`}>{sgpa.toFixed(3)}</span>
                      </div>
                    );
                  })}
                  {validSgpas.length > 1 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-primary/30 bg-primary/5 text-xs ml-auto">
                      <span className="text-muted-foreground">CGPA</span>
                      <span className={`font-bold tabular-nums ${scoreColor(cgpa)}`}>{cgpa.toFixed(3)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <SGPAProgressionBar semesters={semesters} />

            {/* Grade reference */}
            <div className="rounded-xl border border-border/50 bg-muted/30 px-4 py-2.5 mb-5 flex flex-wrap gap-x-4 gap-y-1">
              {GRADE_LABELS.map(g => (
                <div key={g} className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-foreground">{g}</span>
                  <span className="text-muted-foreground">= {GRADE_POINTS[g]}</span>
                </div>
              ))}
            </div>

            {/* Semester cards — each has its own AI Scan button */}
            <div className="mb-4">
              {semesters.map((sem, i) => (
                <div key={sem.id} id={`sem-${i}`}>
                  {/* AI scan trigger per semester */}
                  <div className="flex items-center justify-between mb-1.5 px-0.5">
                    <span className="text-[11px] text-muted-foreground/50 font-medium">
                      Semester {i + 1}
                    </span>
                    <button
                      onClick={() => setScanModal(i)}
                      className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1
                                 rounded-lg border border-primary/30 text-primary
                                 hover:bg-primary/10 transition-colors">
                      <Sparkles size={11} /> AI Scan
                    </button>
                  </div>
                  <SemesterCard
                    sem={sem}
                    onUpdate={u => updateSemester(i, u)}
                    onRemove={() => removeSemester(i)}
                    canRemove={semesters.length > 1}
                    isOpen={!!openSems[i]}
                    onToggle={() => toggleSem(i)}
                  />
                </div>
              ))}
            </div>

            {/* Action bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button onClick={addSemester}
                className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl
                           border border-border text-foreground hover:bg-muted transition-colors">
                <Plus size={15} /> Add Semester
              </button>

              <button onClick={handleSave} disabled={saving || cgpa === 0}
                className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl
                            border transition-colors
                            ${saved
                              ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                              : "border-primary/40 text-primary bg-primary/5 hover:bg-primary/10"}
                            ${(saving || cgpa === 0) ? "opacity-50 cursor-not-allowed" : ""}`}>
                {saved ? <><CheckCircle2 size={15} /> Saved!</>
                  : saving ? <><Save size={15} /> Saving…</>
                  : <><Save size={15} /> Save Snapshot</>}
              </button>

              {/* Export buttons */}
              <button onClick={() => exportAsPDF(semesters, cgpa, percentage)}
                disabled={cgpa === 0}
                className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl
                            border border-border text-foreground hover:bg-muted transition-colors
                            ${cgpa === 0 ? "opacity-40 cursor-not-allowed" : ""}`}>
                <FileDown size={15} /> PDF
              </button>

              <button onClick={handleExportImage} disabled={cgpa === 0 || exporting}
                className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl
                            border border-border text-foreground hover:bg-muted transition-colors
                            ${(cgpa === 0 || exporting) ? "opacity-40 cursor-not-allowed" : ""}`}>
                {exporting
                  ? <><Loader2 size={15} className="animate-spin" /> Exporting…</>
                  : <><ImageDown size={15} /> Image</>}
              </button>

              <button onClick={resetAll}
                className="flex items-center gap-2 text-sm text-muted-foreground px-3 py-2.5
                           rounded-xl hover:text-foreground hover:bg-muted transition-colors ml-auto">
                <RotateCcw size={13} /> Reset
              </button>

              {saveError && <p className="w-full text-xs text-destructive mt-1">{saveError}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}