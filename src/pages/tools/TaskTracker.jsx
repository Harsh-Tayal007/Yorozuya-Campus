/**
 * TaskTracker.jsx — src/pages/tools/TaskTracker.jsx
 * Requires: src/stores/useTaskStore.js  |  npm install jspdf
 */

import { useState, useRef, useEffect, memo } from "react";
import { createPortal } from "react-dom";
import { useTaskStore } from "@/stores/useTaskStore";

// ── Constants ─────────────────────────────────────────────────────────────────
const PRIORITY_ORDER = { low: 0, medium: 1, high: 2, urgent: 3 };
const PRIORITY_META = {
  low:    { label:"Low",    dot:"#10b981", bg:"bg-emerald-100 dark:bg-emerald-900/30", text:"text-emerald-700 dark:text-emerald-400", border:"border-emerald-300 dark:border-emerald-700/50", accent:"#10b981" },
  medium: { label:"Medium", dot:"#f59e0b", bg:"bg-amber-100 dark:bg-amber-900/30",    text:"text-amber-700 dark:text-amber-400",    border:"border-amber-300 dark:border-amber-700/50",    accent:"#f59e0b" },
  high:   { label:"High",   dot:"#f97316", bg:"bg-orange-100 dark:bg-orange-900/30",  text:"text-orange-700 dark:text-orange-400",  border:"border-orange-300 dark:border-orange-700/50",  accent:"#f97316" },
  urgent: { label:"Urgent", dot:"#f43f5e", bg:"bg-rose-100 dark:bg-rose-900/30",      text:"text-rose-700 dark:text-rose-400",      border:"border-rose-300 dark:border-rose-700/50",      accent:"#f43f5e" },
};
const PRIORITY_OPTIONS = Object.entries(PRIORITY_META).map(([k,v]) => ({ value:k, label:v.label, dot:v.dot }));

const TIPS = [
  { icon:"✦", title:"Create a task",         desc:'Hit "+ New Task" to add anything — an assignment, exam prep, or personal goal.' },
  { icon:"⚡", title:"Set priority",           desc:"Mark tasks Low to Urgent so the most critical ones float to the top." },
  { icon:"#", title:"Due dates & reminders",  desc:"Add a due date for a live countdown. Set a reminder and your browser will notify you." },
  { icon:"✓", title:"Steps (subtasks)",       desc:"Break a big task into smaller steps. Each tick fills a progress bar on the card." },
  { icon:"@", title:"Subject / tag",          desc:"Type any subject name — no fixed list. The filter builds itself from what you've used." },
];
const LS_SEEN = "unizuya_tasks_seen";

const formatDate = iso => iso ? new Date(iso).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "";
const daysLeft   = iso => iso ? Math.ceil((new Date(iso) - new Date()) / 86400000) : null;
const requestNotif = () => { if ("Notification" in window && Notification.permission === "default") Notification.requestPermission(); };

// ── Reminder system ───────────────────────────────────────────────────────────
// Polls every 30s — works on localhost (http) where SW push is blocked.
// Fired reminders stored in localStorage to prevent duplicate notifications.
const FIRED_KEY = "unizuya_fired_reminders";
const getFired  = () => { try { return new Set(JSON.parse(localStorage.getItem(FIRED_KEY)||"[]")); } catch { return new Set(); } };
const markFired = (id) => { const s = getFired(); s.add(id); localStorage.setItem(FIRED_KEY, JSON.stringify([...s])); };

function scheduleReminders(tasks) {
  if (Notification.permission !== "granted") return;
  const fired = getFired();
  const now   = Date.now();
  tasks.forEach(task => {
    if (!task.reminder || task.done || fired.has(task.id)) return;
    const at = new Date(task.reminder).getTime();
    if (at <= now) {
      markFired(task.id);
      new Notification("Unizuya Reminder", {
        body: task.title,
        icon: "/favicon.ico",
        tag:  task.id,
      });
    }
  });
}

function useReminderPoller(tasks) {
  useEffect(() => {
    if (!("Notification" in window)) return;
    scheduleReminders(tasks);
    const id = setInterval(() => scheduleReminders(tasks), 30_000);
    return () => clearInterval(id);
  }, [tasks]);
}

// ── PDF Export (NO emojis — jsPDF built-in fonts can't render them) ────────────
async function exportTasksPDF(tasks) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
  const W = 210, pad = 14;
  const now = new Date();

  // Color palette
  const C = {
    bg:[248,248,251], white:[255,255,255],
    accent:[109,40,217], accentLight:[237,233,254],
    text:[15,15,25], muted:[100,110,125], faint:[220,220,230],
    urgent:[239,68,68], high:[249,115,22], medium:[245,158,11], low:[16,185,129],
    done:[180,185,195],
  };
  const priorityColor = p => ({ urgent:C.urgent, high:C.high, medium:C.medium, low:C.low }[p] || C.muted);
  const priorityLabel = p => PRIORITY_META[p]?.label?.toUpperCase() || p.toUpperCase();

  // ── Page background ──
  const drawPageBg = () => {
    doc.setFillColor(...C.bg);
    doc.rect(0, 0, W, 297, "F");
  };
  drawPageBg();

  // ── Header ──
  doc.setFillColor(...C.accent);
  doc.rect(0, 0, W, 32, "F");

  // Logo circle
  doc.setFillColor(255,255,255, 0.15);
  doc.setFillColor(140, 80, 240);
  doc.circle(pad + 5, 16, 6, "F");
  doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
  doc.text("U", pad + 3.2, 18.5);

  doc.setFontSize(15); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
  doc.text("Task Tracker Report", pad + 14, 13);
  doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(220, 210, 255);
  doc.text("Unizuya  —  Academic Todo Export", pad + 14, 20);

  // Date/time top-right
  doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(220,210,255);
  doc.text(now.toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" }), W - pad, 13, { align:"right" });
  doc.text(now.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" }), W - pad, 20, { align:"right" });

  // ── Stats row ──
  const pending = tasks.filter(t => !t.done).length;
  const done    = tasks.filter(t => t.done).length;
  const overdue = tasks.filter(t => !t.done && t.dueDate && daysLeft(t.dueDate) < 0).length;
  const stats   = [
    { label:"TOTAL",   value:tasks.length, color:C.accent },
    { label:"PENDING", value:pending,       color:C.high   },
    { label:"DONE",    value:done,          color:C.low    },
    { label:"OVERDUE", value:overdue,       color:C.urgent },
  ];
  const statW = (W - pad*2 - 9) / 4;
  stats.forEach((s, i) => {
    const x = pad + i * (statW + 3);
    doc.setFillColor(...C.white);
    doc.roundedRect(x, 37, statW, 18, 2, 2, "F");
    doc.setDrawColor(...C.faint);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, 37, statW, 18, 2, 2, "S");

    doc.setFontSize(13); doc.setFont("helvetica","bold"); doc.setTextColor(...s.color);
    doc.text(String(s.value), x + statW/2, 47, { align:"center" });
    doc.setFontSize(6.5); doc.setFont("helvetica","bold"); doc.setTextColor(...C.muted);
    doc.text(s.label, x + statW/2, 51.5, { align:"center" });
  });

  // ── Task list ──
  let y = 64;

  const addPage = () => {
    doc.addPage();
    drawPageBg();
    // Slim repeat header
    doc.setFillColor(...C.accent);
    doc.rect(0, 0, W, 11, "F");
    doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
    doc.text("Unizuya  |  Task Tracker Report (continued)", pad, 7.5);
    y = 18;
  };

  const sectionHeader = (label, count) => {
    if (y > 270) addPage();
    doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(...C.muted);
    const fullLabel = `${label.toUpperCase()}   (${count})`;
    doc.text(fullLabel, pad, y);
    const textW = doc.getTextWidth(fullLabel);
    doc.setDrawColor(...C.faint); doc.setLineWidth(0.4);
    doc.line(pad + textW + 4, y - 0.5, W - pad, y - 0.5);
    y += 6;
  };

  // Sorted: pending (by priority) then done
  const sorted = [
    ...tasks.filter(t => !t.done).sort((a,b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority] || (a.dueDate||"z").localeCompare(b.dueDate||"z")),
    ...tasks.filter(t => t.done),
  ];

  sectionHeader("Pending Tasks", pending);
  let doneSectionDrawn = false;

  for (const task of sorted) {
    if (task.done && !doneSectionDrawn) {
      y += 4;
      sectionHeader("Completed Tasks", done);
      doneSectionDrawn = true;
    }

    const subtasks     = task.subtasks || [];
    const subtaskDone  = subtasks.filter(s => s.done).length;
    const subtaskTotal = subtasks.length;
    const hasDesc = !!task.description;
    const hasMeta = !!(task.dueDate || subtaskTotal || task.reminder);

    // Card height — computed dynamically to fit all content
    let cardH = 7;                            // title row
    if (task.subject) cardH += 4.5;          // subject tag
    else              cardH += 1;
    if (hasMeta)      cardH += 5;            // meta row
    if (hasDesc)      cardH += 5;            // description
    if (subtaskTotal > 0) {
      cardH += 5;                            // "Steps" header row
      cardH += subtaskTotal * 4.5;           // each step row
      cardH += 4;                            // progress bar + gap
    }
    cardH += 5;                              // bottom padding

    if (y + cardH > 278) addPage();

    // Card background
    doc.setFillColor(...C.white);
    doc.setDrawColor(...C.faint);
    doc.setLineWidth(0.3);
    doc.roundedRect(pad, y, W - pad*2, cardH, 2.5, 2.5, "FD");

    // Priority accent stripe (left edge)
    const pc = priorityColor(task.priority);
    doc.setFillColor(...pc);
    doc.roundedRect(pad, y, 3, cardH, 1.5, 1.5, "F");
    // Right half of stripe is flat (covers rounded right side of stripe)
    doc.rect(pad + 1.5, y, 1.5, cardH, "F");

    const contentX = pad + 7;
    const contentW = W - pad*2 - 14;
    let rowY = y + 5.5;

    // ── Title row ──
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...(task.done ? C.done : C.text));

    // Truncate title to fit left of priority badge
    let title = task.title;
    const badgeW = 18;
    const maxTitleW = contentW - badgeW - 4;
    while (doc.getTextWidth(title) > maxTitleW && title.length > 4) title = title.slice(0,-1);
    if (title !== task.title) title += "...";
    doc.text(title, contentX, rowY);

    // Strikethrough for done tasks
    if (task.done) {
      const tw = doc.getTextWidth(title);
      doc.setDrawColor(...C.done); doc.setLineWidth(0.4);
      doc.line(contentX, rowY - 1.5, contentX + tw, rowY - 1.5);
    }

    // Priority badge (pill, top-right of card)
    const badgeX = W - pad - badgeW - 2;
    doc.setFillColor(...pc.map(v => Math.min(255, v + 180 > 255 ? v * 0.15 + 230 : v * 0.12 + 232)));
    doc.roundedRect(badgeX, y + 3, badgeW, 5, 1.5, 1.5, "F");
    doc.setFontSize(5.5); doc.setFont("helvetica","bold"); doc.setTextColor(...pc);
    doc.text(priorityLabel(task.priority), badgeX + badgeW/2, y + 6.8, { align:"center" });

    rowY += 5;

    // ── Subject tag (inline, below title) ──
    if (task.subject) {
      doc.setFontSize(7.5); doc.setFont("helvetica","normal"); doc.setTextColor(...C.muted);
      doc.text(task.subject, contentX, rowY);
      rowY += 4.5;
    } else {
      rowY += 1;
    }

    // ── Meta row: due date | steps | reminder ──
    if (hasMeta) {
      doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(...C.muted);
      const parts = [];
      if (task.dueDate) {
        const dl = daysLeft(task.dueDate);
        const label = dl < 0 ? `${Math.abs(dl)}d overdue` : dl === 0 ? "Due today" : `${dl}d left`;
        parts.push(`Due: ${formatDate(task.dueDate)}  (${label})`);
      }
      if (task.reminder)    parts.push(`Reminder set`);

      if (parts.length) {
        // Print each part with a separator dot
        let mx = contentX;
        parts.forEach((part, idx) => {
          if (idx > 0) {
            doc.setTextColor(...C.faint);
            doc.text("  |  ", mx, rowY);
            mx += doc.getTextWidth("  |  ");
            doc.setTextColor(...C.muted);
          }
          doc.text(part, mx, rowY);
          mx += doc.getTextWidth(part);
        });
        rowY += 4.5;
      }
    }

    // ── Description ──
    if (hasDesc) {
      let desc = task.description;
      const maxDescW = contentW - 2;
      doc.setFontSize(7.5); doc.setFont("helvetica","italic"); doc.setTextColor(...C.muted);
      while (doc.getTextWidth(desc) > maxDescW && desc.length > 6) desc = desc.slice(0,-1);
      if (desc !== task.description) desc += "...";
      doc.text(desc, contentX, rowY);
      rowY += 4.5;
    }

    // ── Subtask steps list + progress bar ──
    if (subtaskTotal > 0) {
      // Section header
      rowY += 2;
      doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(...C.muted);
      doc.text(`STEPS  (${subtaskDone}/${subtaskTotal})`, contentX, rowY);
      rowY += 4;

      // Individual steps
      subtasks.forEach(step => {
        // Checkbox square
        doc.setDrawColor(...(step.done ? C.accent : C.faint));
        doc.setLineWidth(0.5);
        doc.rect(contentX, rowY - 2.8, 3, 3, "S");
        // Checkmark for done steps
        if (step.done) {
          doc.setDrawColor(...C.accent);
          doc.setLineWidth(0.6);
          doc.line(contentX + 0.5, rowY - 1.3, contentX + 1.3, rowY - 0.4);
          doc.line(contentX + 1.3, rowY - 0.4, contentX + 2.8, rowY - 2.5);
        }
        // Step text
        doc.setFontSize(7.5);
        doc.setFont("helvetica", step.done ? "italic" : "normal");
        doc.setTextColor(...(step.done ? C.done : C.text));
        let stepText = step.text;
        const maxStepW = contentW - 7;
        while (doc.getTextWidth(stepText) > maxStepW && stepText.length > 4) stepText = stepText.slice(0,-1);
        if (stepText !== step.text) stepText += "...";
        doc.text(stepText, contentX + 5, rowY);
        // Strikethrough for done
        if (step.done) {
          const sw = doc.getTextWidth(stepText);
          doc.setDrawColor(...C.done); doc.setLineWidth(0.3);
          doc.line(contentX + 5, rowY - 1.5, contentX + 5 + sw, rowY - 1.5);
        }
        rowY += 4.5;
      });

      // Progress bar
      rowY += 1;
      const barW = contentW;
      const fillW = subtaskTotal > 0 ? (subtaskDone / subtaskTotal) * barW : 0;
      doc.setFillColor(228, 228, 238);
      doc.roundedRect(contentX, rowY, barW, 1.8, 0.9, 0.9, "F");
      if (fillW > 0) {
        doc.setFillColor(...C.accent);
        doc.roundedRect(contentX, rowY, fillW, 1.8, 0.9, 0.9, "F");
      }
    }

    y += cardH + 3;

  }
  // If no pending tasks, draw a placeholder
  if (pending === 0) {
    doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.setTextColor(...C.muted);
    doc.text("No pending tasks.", pad, y + 4);
    y += 12;
  }

  // ── Footer on every page ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Footer rule
    doc.setDrawColor(...C.faint); doc.setLineWidth(0.4);
    doc.line(pad, 286, W - pad, 286);
    doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(...C.muted);
    doc.text(
      `Unizuya  |  Task Tracker Report  |  Generated ${now.toLocaleDateString("en-IN")}`,
      pad, 291
    );
    doc.text(`${i} / ${pageCount}`, W - pad, 291, { align:"right" });
  }

  return doc;
}

// ── PDF Preview Modal ──────────────────────────────────────────────────────────
function PdfPreviewModal({ tasks, onClose }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let url;
    (async () => {
      try {
        const doc = await exportTasksPDF(tasks);
        const blob = doc.output("blob");
        url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch(e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
    return () => { if (url) URL.revokeObjectURL(url); };
  }, []);

  const handleDownload = async () => {
    const doc = await exportTasksPDF(tasks);
    const now = new Date();
    doc.save(`Unizuya_Tasks_${now.toISOString().slice(0,10)}.pdf`);
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
         style={{ background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)" }}>
      <div className="w-full max-w-3xl h-[90vh] bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-violet-500"/>
            <span className="font-semibold text-sm text-gray-900 dark:text-zinc-100">Task Report Preview</span>
            <span className="text-xs text-gray-400 dark:text-zinc-600">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold rounded-lg transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              </svg>
              Download PDF
            </button>
            <button onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors text-lg leading-none">✕</button>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-zinc-950 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-3">
                <svg className="w-8 h-8 animate-spin text-violet-500 mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                <p className="text-sm text-gray-500 dark:text-zinc-500">Generating preview…</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="PDF Preview"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-gray-500 dark:text-zinc-500">Failed to generate preview.</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Custom Dropdown (portal-based to escape modal overflow) ───────────────────
function Dropdown({ value, onChange, options, placeholder="Select…", className="" }) {
  const [open, setOpen]     = useState(false);
  const [pos,  setPos]      = useState({ top:0, left:0, width:0 });
  const triggerRef          = useRef(null);
  const selected            = options.find(o => o.value === value);

  // Recalculate position whenever opening
  const openDropdown = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left, width: r.width });
    }
    setOpen(true);
  };

  // Close on outside click
  useEffect(() => {
    const h = e => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) setOpen(false);
    };
    if (open) {
      document.addEventListener("mousedown", h);
      // Also close on scroll
      document.addEventListener("scroll", () => setOpen(false), true);
    }
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("scroll", () => setOpen(false), true);
    };
  }, [open]);

  return (
    <div ref={triggerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button type="button" onClick={() => open ? setOpen(false) : openDropdown()}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5
                    bg-gray-50 dark:bg-zinc-800 border rounded-xl text-sm font-medium
                    transition-all duration-150 outline-none
                    ${open
                      ? "border-violet-400 dark:border-violet-500 ring-2 ring-violet-400/20 dark:ring-violet-500/20"
                      : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"}`}>
        <span className="flex items-center gap-2 min-w-0 truncate">
          {selected?.dot && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:selected.dot }}/>}
          <span className={selected ? "text-gray-900 dark:text-zinc-100" : "text-gray-400 dark:text-zinc-600"}>
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <svg className={`w-4 h-4 text-gray-400 dark:text-zinc-500 flex-shrink-0 transition-transform duration-200 ${open?"rotate-180":""}`}
             fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {/* Portal menu — renders at document.body level, above everything */}
      {open && createPortal(
        <div
          style={{ position:"fixed", top:pos.top, left:pos.left, width:pos.width, zIndex:9999,
                   animation:"ddIn .12s ease-out both" }}
          className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700
                     rounded-xl shadow-2xl shadow-black/15 dark:shadow-black/50 overflow-hidden">
          <style>{`@keyframes ddIn{from{opacity:0;transform:translateY(-5px) scale(.97)}to{opacity:1;transform:none}}`}</style>
          <div className="py-1 max-h-52 overflow-y-auto overflow-x-hidden
                          scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-zinc-700">
            {options.map(opt => {
              const isSel = opt.value === value;
              return (
                <button key={opt.value} type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors
                              ${isSel
                                ? "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                                : "text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/60"}`}>
                  {opt.dot && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:opt.dot }}/>}
                  <span className="flex-1">{opt.label}</span>
                  {isSel && (
                    <svg className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ── Tooltip (portal-based, never clips) ───────────────────────────────────────
function Tooltip({ text, children }) {
  const [show, setShow]   = useState(false);
  const [style, setStyle] = useState({});
  const ref = useRef(null);

  const handleEnter = () => {
    if (!ref.current) return;
    const r   = ref.current.getBoundingClientRect();
    const TW  = 220;
    const above = r.top > window.innerHeight / 2;
    let left = r.left + r.width / 2 - TW / 2;
    // Clamp to viewport
    left = Math.max(8, Math.min(left, window.innerWidth - TW - 8));
    setStyle({
      position:"fixed", zIndex:10000,
      width:TW,
      left,
      ...(above
        ? { bottom: window.innerHeight - r.top + 8 }
        : { top: r.bottom + 8 }),
    });
    setShow(true);
  };

  return (
    <span ref={ref} className="relative inline-flex items-center"
          onMouseEnter={handleEnter} onMouseLeave={() => setShow(false)}>
      {children}
      {show && createPortal(
        <span className="pointer-events-none px-3 py-2 rounded-xl text-xs leading-relaxed
                         bg-gray-900 dark:bg-zinc-700 text-white shadow-xl whitespace-normal block"
              style={style}>
          {text}
        </span>,
        document.body
      )}
    </span>
  );
}

function InfoIcon({ tip }) {
  return (
    <Tooltip text={tip}>
      <span className="ml-1.5 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full
                       bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400
                       text-[9px] font-bold cursor-default select-none
                       hover:bg-violet-100 dark:hover:bg-violet-800/40
                       hover:text-violet-600 dark:hover:text-violet-400 transition-colors">i</span>
    </Tooltip>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ taskTitle, onConfirm, onCancel }) {
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"
         style={{ background:"rgba(0,0,0,0.55)", backdropFilter:"blur(6px)" }}>
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="w-11 h-11 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </div>
          <h3 className="text-center font-bold text-gray-900 dark:text-zinc-100 mb-1">Delete task?</h3>
          <p className="text-center text-gray-500 dark:text-zinc-500 text-sm leading-relaxed">
            "<span className="font-medium text-gray-700 dark:text-zinc-300">{taskTitle}</span>"<br/>
            will be permanently deleted. This cannot be undone.
          </p>
        </div>
        <div className="flex border-t border-gray-100 dark:border-zinc-800">
          <button onClick={onCancel} className="flex-1 py-3.5 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
          <div className="w-px bg-gray-100 dark:bg-zinc-800"/>
          <button onClick={onConfirm} className="flex-1 py-3.5 text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">Delete</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Onboarding ────────────────────────────────────────────────────────────────
const REAL_TIPS = [
  { icon:"✦", title:"Create a task",         desc:'Hit "+ New Task" to add anything — an assignment, exam prep, or personal goal.' },
  { icon:"⚡", title:"Set priority",           desc:"Mark tasks Low to Urgent so the most critical ones float to the top." },
  { icon:"📅", title:"Due dates & reminders",  desc:"Add a due date for a live countdown. Set a reminder and your browser will notify you." },
  { icon:"☑",  title:"Steps (subtasks)",       desc:"Break a big task into smaller steps. Each tick fills a progress bar on the card." },
  { icon:"🏷",  title:"Subject / tag",          desc:"Type any subject name — no fixed list. The filter builds itself from what you've used." },
];

function OnboardingPanel({ onDismiss }) {
  return (
    <div className="mb-6 rounded-2xl border border-violet-200 dark:border-violet-800/50 bg-violet-50 dark:bg-violet-950/30 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-sm flex items-center gap-2">
            <span className="text-violet-500">✦</span> Welcome to Task Tracker
          </h3>
          <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">Here's a quick guide to get started</p>
        </div>
        <button onClick={onDismiss} className="text-gray-400 dark:text-zinc-600 hover:text-gray-600 dark:hover:text-zinc-400 text-xl leading-none transition-colors">✕</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {REAL_TIPS.map((tip,i) => (
          <div key={i} className="flex gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900/60 border border-violet-100 dark:border-violet-800/30">
            <span className="text-xl flex-shrink-0 mt-0.5">{tip.icon}</span>
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200">{tip.title}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5 leading-relaxed">{tip.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onDismiss} className="mt-4 w-full py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold transition-colors">Got it, let's go! →</button>
    </div>
  );
}

// ── SubtaskList ───────────────────────────────────────────────────────────────
const SubtaskList = memo(function SubtaskList({ subtasks, onChange }) {
  const [newText, setNewText] = useState("");
  const inputRef = useRef();
  const add = () => {
    if (!newText.trim()) return;
    onChange([...subtasks, { id:Math.random().toString(36).slice(2,9), text:newText.trim(), done:false }]);
    setNewText(""); inputRef.current?.focus();
  };
  const toggle = id => onChange(subtasks.map(s => s.id===id ? {...s,done:!s.done} : s));
  const remove = id => onChange(subtasks.filter(s => s.id!==id));
  return (
    <div className="space-y-1.5">
      {subtasks.map(s => (
        <div key={s.id} className="flex items-center gap-2 group">
          <button onClick={() => toggle(s.id)}
            className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
              ${s.done ? "bg-violet-500 border-violet-500" : "border-gray-300 dark:border-zinc-600 hover:border-violet-400"}`}>
            {s.done && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
          </button>
          <span className={`text-sm flex-1 ${s.done ? "line-through text-gray-400 dark:text-zinc-500" : "text-gray-700 dark:text-zinc-300"}`}>{s.text}</span>
          <button onClick={() => remove(s.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-500 dark:text-zinc-600 dark:hover:text-rose-400 text-xs transition-opacity">✕</button>
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <input ref={inputRef} value={newText} onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key==="Enter" && add()} placeholder="Add a step…"
          className="flex-1 bg-gray-100 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-gray-800 dark:text-zinc-200 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors"/>
        <button onClick={add} className="px-3 py-1.5 bg-violet-100 dark:bg-violet-600/20 hover:bg-violet-200 dark:hover:bg-violet-600/40 border border-violet-300 dark:border-violet-600/40 text-violet-600 dark:text-violet-400 rounded-lg text-sm font-bold transition-colors">+</button>
      </div>
    </div>
  );
});

function PriorityBadge({ priority }) {
  const m = PRIORITY_META[priority];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${m.bg} ${m.text} ${m.border}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background:m.accent }}/>
      {m.label}
    </span>
  );
}

// ── TaskCard ──────────────────────────────────────────────────────────────────
const TaskCard = memo(function TaskCard({ task, onToggle, onDelete, onUpdate }) {
  const [expanded,      setExpanded]      = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEdit,      setShowEdit]      = useState(false);
  const days = daysLeft(task.dueDate), overdue = days!==null&&days<0, dueSoon = days!==null&&days>=0&&days<=2;
  const m  = PRIORITY_META[task.priority];
  const sd = task.subtasks?.filter(s=>s.done).length||0;
  const st = task.subtasks?.length||0;

  return (
    <>
      {confirmDelete && (
        <DeleteConfirm taskTitle={task.title}
          onConfirm={() => { setConfirmDelete(false); onDelete(task.id); }}
          onCancel={() => setConfirmDelete(false)}/>
      )}
      {showEdit && (
        <EditTaskModal
          task={task}
          onClose={() => setShowEdit(false)}
          onSave={async (updated) => { await onUpdate(updated); setShowEdit(false); }}/>
      )}
      <div className={`group relative rounded-xl border transition-all duration-200
        ${task.done ? "bg-gray-50 dark:bg-zinc-900/40 border-gray-200 dark:border-zinc-800/50 opacity-60"
          : overdue ? "bg-white dark:bg-zinc-900 border-rose-200 dark:border-rose-500/30 shadow-sm"
          : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 hover:shadow-md dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)]"}`}>
        <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full" style={{ background:m.accent }}/>
        <div className="px-4 py-3 pl-5">
          <div className="flex items-start gap-3">
            <button onClick={() => onToggle(task.id)}
              className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                ${task.done ? "bg-violet-500 border-violet-500" : "border-gray-300 dark:border-zinc-600 hover:border-violet-400"}`}>
              {task.done && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-semibold text-sm ${task.done ? "line-through text-gray-400 dark:text-zinc-500" : "text-gray-900 dark:text-zinc-100"}`}>{task.title}</span>
                <PriorityBadge priority={task.priority}/>
                {task.subject && <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700">{task.subject}</span>}
              </div>
              {task.description && !expanded && <p className="text-gray-500 dark:text-zinc-500 text-xs mt-0.5 truncate">{task.description}</p>}
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {task.dueDate && (
                  <span className={`text-xs flex items-center gap-1 ${overdue?"text-rose-500 dark:text-rose-400 font-medium":dueSoon?"text-orange-500 dark:text-orange-400":"text-gray-500 dark:text-zinc-500"}`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                    {overdue?`${Math.abs(days)}d overdue`:days===0?"Due today":`${days}d left`} · {formatDate(task.dueDate)}
                  </span>
                )}
                {st>0 && <span className="text-xs text-gray-500 dark:text-zinc-500 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>{sd}/{st} steps</span>}
                {task.reminder && <span className="text-xs text-violet-500 dark:text-violet-400 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17H9a6 6 0 116 0zM13.73 21a2 2 0 01-3.46 0"/></svg>Reminder set</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity flex-shrink-0">
              <button onClick={() => setExpanded(e=>!e)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors">
                <svg className={`w-4 h-4 transition-transform ${expanded?"rotate-180":""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <button onClick={() => setShowEdit(true)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-gray-400 dark:text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </button>
              <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-gray-400 dark:text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>
          {st>0 && <div className="mt-2.5 h-1 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden"><div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width:`${(sd/st)*100}%` }}/></div>}
          {expanded && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 space-y-3">
              {task.description && <p className="text-gray-600 dark:text-zinc-400 text-sm">{task.description}</p>}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wide mb-2">Steps {st>0&&`(${sd}/${st})`}</p>
                <SubtaskList subtasks={task.subtasks||[]} onChange={subtasks => onUpdate({...task,subtasks})}/>
              </div>
              {task.reminder && <p className="text-xs text-gray-400 dark:text-zinc-600">Reminder: {new Date(task.reminder).toLocaleString("en-IN")}</p>}
            </div>
          )}
        </div>
      </div>
    </>
  );
});

// ── EditTaskModal ─────────────────────────────────────────────────────────────
function EditTaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState({
    title:       task.title,
    description: task.description || "",
    priority:    task.priority,
    subject:     task.subject || "",
    dueDate:     task.dueDate || "",
    reminder:    task.reminder || "",
    subtasks:    task.subtasks || [],
  });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const submit = async () => {
    if (!form.title.trim() || saving) return;
    setSaving(true);
    // Clear fired reminder if reminder was changed so it can fire again
    if (form.reminder !== task.reminder && form.reminder) {
      const s = getFired(); s.delete(task.id);
      localStorage.setItem(FIRED_KEY, JSON.stringify([...s]));
    }
    await onSave({ ...task, ...form });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
         style={{ background:"rgba(0,0,0,0.5)", backdropFilter:"blur(6px)" }}
         onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="w-full sm:max-w-lg bg-white dark:bg-zinc-900 sm:rounded-2xl rounded-t-2xl
                      border border-gray-200 dark:border-zinc-700 shadow-2xl
                      max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800 flex-shrink-0">
          <h2 className="text-gray-900 dark:text-zinc-100 font-semibold text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center text-white flex-shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </span>
            Edit Task
          </h2>
          <button onClick={onClose} className="text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 text-xl leading-none transition-colors">✕</button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-4">
          <div>
            <label className="text-xs text-gray-500 dark:text-zinc-500 font-semibold mb-1.5 block uppercase tracking-wide">Task Title *</label>
            <input autoFocus value={form.title} onChange={e=>set("title",e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Task title"
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors"/>
          </div>

          <div>
            <label className="text-xs text-gray-500 dark:text-zinc-500 font-semibold mb-1.5 flex items-center uppercase tracking-wide">
              Description <InfoIcon tip="Optional context, links, or notes. Shown when you expand the card."/>
            </label>
            <textarea value={form.description} onChange={e=>set("description",e.target.value)} rows={2}
              placeholder="Optional notes, links, or context…"
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors resize-none"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 dark:text-zinc-500 font-semibold mb-1.5 flex items-center uppercase tracking-wide">
                Priority <InfoIcon tip="Urgent = exam tomorrow · High = this week · Medium = soon · Low = someday."/>
              </label>
              <Dropdown value={form.priority} onChange={v=>set("priority",v)} options={PRIORITY_OPTIONS}/>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-zinc-500 font-semibold mb-1.5 flex items-center uppercase tracking-wide">
                Subject / Tag <InfoIcon tip="Type any course or subject — no fixed list."/>
              </label>
              <input value={form.subject} onChange={e=>set("subject",e.target.value)}
                placeholder="e.g. Operating Systems"
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 dark:text-zinc-500 font-semibold mb-1.5 flex items-center uppercase tracking-wide">
                Due Date <InfoIcon tip="Shows a live countdown on the card. Turns red when overdue."/>
              </label>
              <input type="date" value={form.dueDate} onChange={e=>set("dueDate",e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors"/>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-zinc-500 font-semibold mb-1.5 flex items-center uppercase tracking-wide">
                Reminder <InfoIcon tip="Browser notification at this time. Changing the reminder resets it so it fires again."/>
              </label>
              <input type="datetime-local" value={form.reminder} onChange={e=>set("reminder",e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors"/>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 dark:text-zinc-500 font-semibold mb-1.5 flex items-center uppercase tracking-wide">
              Steps / Subtasks <InfoIcon tip="Edit, add or remove steps. Existing completion state is preserved."/>
            </label>
            <SubtaskList subtasks={form.subtasks} onChange={v=>set("subtasks",v)}/>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving||!form.title.trim()}
            className="px-5 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2">
            {saving && <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── AddTaskModal ──────────────────────────────────────────────────────────────
function AddTaskModal({ onClose, onAdd }) {
  const [form, setForm]   = useState({ title:"", description:"", priority:"medium", subject:"", dueDate:"", reminder:"", subtasks:[] });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  const submit = async () => { if (!form.title.trim()||saving) return; setSaving(true); await onAdd(form); onClose(); };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
         style={{ background:"rgba(0,0,0,0.5)", backdropFilter:"blur(6px)" }}
         onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="w-full sm:max-w-lg bg-white dark:bg-zinc-900 sm:rounded-2xl rounded-t-2xl
                      border border-gray-200 dark:border-zinc-700 shadow-2xl
                      max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header — never scrolls */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800 flex-shrink-0">
          <h2 className="text-gray-900 dark:text-zinc-100 font-semibold text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-violet-500 flex items-center justify-center text-white text-sm font-bold">+</span>
            New Task
          </h2>
          <button onClick={onClose} className="text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 text-xl leading-none transition-colors">✕</button>
        </div>

        {/* Scrollable body — overflow-y-auto only here */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-4">
          <div>
            <label className="text-xs text-gray-500 dark:text-zinc-500 font-semibold mb-1.5 block uppercase tracking-wide">Task Title *</label>
            <input autoFocus value={form.title} onChange={e=>set("title",e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="e.g. Complete OS assignment"
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors"/>
          </div>

          <div>
            <label className="text-xs text-gray-500 dark:text-zinc-500 font-semibold mb-1.5 flex items-center uppercase tracking-wide">
              Description <InfoIcon tip="Optional context, links, or notes. Shown when you expand the card."/>
            </label>
            <textarea value={form.description} onChange={e=>set("description",e.target.value)} rows={2}
              placeholder="Optional notes, links, or context…"
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors resize-none"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 dark:text-zinc-500 font-semibold mb-1.5 flex items-center uppercase tracking-wide">
                Priority <InfoIcon tip="Urgent = exam tomorrow · High = this week · Medium = soon · Low = someday. Sorted highest first."/>
              </label>
              <Dropdown value={form.priority} onChange={v=>set("priority",v)} options={PRIORITY_OPTIONS}/>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-zinc-500 font-semibold mb-1.5 flex items-center uppercase tracking-wide">
                Subject / Tag <InfoIcon tip="Type any course or subject — no fixed list. Filter auto-builds from what you've used."/>
              </label>
              <input value={form.subject} onChange={e=>set("subject",e.target.value)}
                placeholder="e.g. Operating Systems"
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 dark:text-zinc-500 font-semibold mb-1.5 flex items-center uppercase tracking-wide">
                Due Date <InfoIcon tip="Shows a live countdown on the card. Turns red when overdue."/>
              </label>
              <input type="date" value={form.dueDate} onChange={e=>set("dueDate",e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors"/>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-zinc-500 font-semibold mb-1.5 flex items-center uppercase tracking-wide">
                Reminder <InfoIcon tip="Your browser sends a notification at this exact time. Allow notifications when prompted."/>
              </label>
              <input type="datetime-local" value={form.reminder} onChange={e=>set("reminder",e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors"/>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 dark:text-zinc-500 font-semibold mb-1.5 flex items-center uppercase tracking-wide">
              Steps / Subtasks <InfoIcon tip="Break this task into smaller checkboxes. Each tick fills a progress bar on the card."/>
            </label>
            <SubtaskList subtasks={form.subtasks} onChange={v=>set("subtasks",v)}/>
          </div>
        </div>

        {/* Footer — never scrolls */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving||!form.title.trim()}
            className="px-5 py-2 bg-violet-500 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2">
            {saving && <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
            {saving ? "Saving…" : "Add Task"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TaskTracker() {
  const { tasks, loading, userId, addTask, toggleTask, deleteTask, updateTask } = useTaskStore();

  // ── Reminder poller (fires on every 30s tick, survives route changes) ──
  useReminderPoller(tasks);

  const [showAdd,        setShowAdd]        = useState(false);
  const [editingTask,    setEditingTask]    = useState(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem(LS_SEEN));
  const [filter,         setFilter]         = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [subjectFilter,  setSubjectFilter]  = useState("all");
  const [search,         setSearch]         = useState("");

  const dismissOnboarding = () => { setShowOnboarding(false); localStorage.setItem(LS_SEEN,"1"); };

  const today    = new Date().toISOString().slice(0,10);
  const filtered = tasks
    .filter(t => {
      if (filter==="today")    return t.dueDate===today && !t.done;
      if (filter==="upcoming") return t.dueDate>today   && !t.done;
      if (filter==="done")     return t.done;
      return true;
    })
    .filter(t => priorityFilter==="all" || t.priority===priorityFilter)
    .filter(t => subjectFilter==="all"  || t.subject===subjectFilter)
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => PRIORITY_ORDER[b.priority]-PRIORITY_ORDER[a.priority] || (a.dueDate||"z").localeCompare(b.dueDate||"z"));

  const stats = {
    total:   tasks.filter(t=>!t.done).length,
    done:    tasks.filter(t=>t.done).length,
    overdue: tasks.filter(t=>!t.done&&t.dueDate&&daysLeft(t.dueDate)<0).length,
    today:   tasks.filter(t=>!t.done&&t.dueDate===today).length,
  };
  const usedSubjects = [...new Set(tasks.map(t=>t.subject).filter(Boolean))].sort();
  const subjectOptions = [{ value:"all", label:"All subjects" }, ...usedSubjects.map(s=>({value:s,label:s}))];
  const priorityFilterOptions = [{ value:"all", label:"All priorities" }, ...PRIORITY_OPTIONS];

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center space-y-3">
        <svg className="w-7 h-7 animate-spin text-violet-500 mx-auto" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <p className="text-sm text-gray-500 dark:text-zinc-500">Loading your tasks…</p>
      </div>
    </div>
  );

  return (
    <div className="w-full text-gray-900 dark:text-zinc-100">
      {showAdd        && <AddTaskModal onClose={() => setShowAdd(false)} onAdd={addTask}/>}
      {showPdfPreview && <PdfPreviewModal tasks={tasks} onClose={() => setShowPdfPreview(false)}/>}

      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-8">

        {/* Header */}
        <div className="flex items-start sm:items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
              <span className="text-violet-500">✦</span> Task Tracker
            </h1>
            <p className="text-gray-500 dark:text-zinc-500 text-sm mt-0.5 hidden sm:block">Stay on top of your academic workload</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Tooltip text="Show feature guide">
              <button onClick={() => setShowOnboarding(v=>!v)}
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-zinc-500 hover:text-violet-500 dark:hover:text-violet-400 hover:border-violet-300 dark:hover:border-violet-700 transition-colors text-sm font-bold">?</button>
            </Tooltip>
            <Tooltip text="Preview & download PDF report">
              <button onClick={() => tasks.length && setShowPdfPreview(true)} disabled={!tasks.length}
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-zinc-500 hover:text-violet-500 dark:hover:text-violet-400 hover:border-violet-300 dark:hover:border-violet-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                </svg>
              </button>
            </Tooltip>
            <button onClick={() => { requestNotif(); setShowAdd(true); }}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-violet-200 dark:shadow-violet-900/30">
              <span className="text-base leading-none">+</span>
              <span className="hidden sm:inline">New Task</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {showOnboarding && <OnboardingPanel onDismiss={dismissOnboarding}/>}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-5">
          {[
            { label:"Pending",  value:stats.total,   color:"text-gray-800 dark:text-zinc-100"         },
            { label:"Today",    value:stats.today,   color:"text-orange-600 dark:text-orange-400"     },
            { label:"Overdue",  value:stats.overdue, color:"text-rose-600 dark:text-rose-400"         },
            { label:"Done",     value:stats.done,    color:"text-emerald-600 dark:text-emerald-400"   },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-2.5 sm:p-3 text-center">
              <div className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-gray-500 dark:text-zinc-400 text-[11px] sm:text-xs mt-0.5 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-1 mb-3">
          {[{key:"all",label:"All"},{key:"today",label:"Today"},{key:"upcoming",label:"Upcoming"},{key:"done",label:"Completed"}].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`flex-1 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all
                ${filter===f.key ? "bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm" : "text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-5">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks or subjects…"
              className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-800 dark:text-zinc-200 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors"/>
          </div>
          <div className="flex gap-2">
            <Dropdown value={priorityFilter} onChange={setPriorityFilter} options={priorityFilterOptions} className="w-40"/>
            {usedSubjects.length>0 && <Dropdown value={subjectFilter} onChange={setSubjectFilter} options={subjectOptions} className="w-40"/>}
          </div>
        </div>

        {/* Task list */}
        <div className="space-y-2">
          {filtered.length===0 ? (
            <div className="text-center py-14">
              <div className="text-3xl mb-3 opacity-30">✦</div>
              <p className="text-gray-500 dark:text-zinc-500 text-sm">
                {search||priorityFilter!=="all"||subjectFilter!=="all" ? "No tasks match your filters."
                  : filter==="done"?"No completed tasks yet."
                  : filter==="today"?"Nothing due today."
                  : "No tasks yet. Hit '+ Add' to get started!"}
              </p>
            </div>
          ) : filtered.map(task => (
            <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} onUpdate={updateTask}/>
          ))}
        </div>

        {tasks.length>0 && (
          <p className="text-center text-gray-500 dark:text-zinc-400 text-xs mt-6 font-medium">
            {stats.done} of {tasks.length} task{tasks.length!==1?"s":""} completed
            {!userId && <span className="ml-1 text-gray-400 dark:text-zinc-600">(local only — log in to sync)</span>}
          </p>
        )}
      </div>
    </div>
  );
}