// src/components/home/FAQSection.jsx
import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { useReveal } from "@/hooks/useReveal"
import AnimatedList from "./AnimatedList"
import { useUIPrefs } from "@/context/UIPrefsContext"

const FAQS = [
  {
    q: "Is Unizuya free to use?",
    a: "Yes, completely free. There are no subscription fees, no ads, and no hidden charges. Unizuya is a student-built project and will remain free.",
  },
  {
    q: "Which universities are supported?",
    a: "Unizuya currently supports J.C. Bose University of Science and Technology, YMCA, Faridabad. More universities are being added - if yours isn't listed yet, reach out and we'll prioritise it.",
  },
  {
    q: "Can teachers use Unizuya?",
    a: "Yes. Teachers can sign up, create classes, run real-time attendance sessions, and export analytics reports. Teacher accounts require admin approval before class management features are enabled.",
  },
  {
    q: "Where is my data stored?",
    a: "Your data is stored securely via Appwrite (authentication and database) and Cloudinary (images). We do not sell, share, or track your data. Read our Privacy Policy for full details.",
  },
  {
    q: "Does the CGPA calculator work for my grading system?",
    a: "The calculator is built around the 10-point CBCS grading scale (O, A+, A, B+, B, C, F). You can also use the AI marksheet scan to auto-fill your grades from a result card image.",
  },
  {
    q: "How do attendance notifications work?",
    a: "When a teacher opens an attendance session, enrolled students receive a push notification (if enabled) and can see the active session in their dashboard. Push notifications require browser permission and HTTPS.",
  },
]

function FAQItem({ q, a, index }) {
  const [open, setOpen] = useState(false)
  const contentRef = useRef(null)
  const [height, setHeight] = useState(0)
  const revealRef = useReveal(index * 40)

  useEffect(() => {
    if (open && contentRef.current) {
      setHeight(contentRef.current.scrollHeight)
    } else {
      setHeight(0)
    }
  }, [open])

  return (
    <div ref={revealRef}
      className={`rounded-xl border transition-colors duration-200
        ${open
          ? "border-indigo-300/50 dark:border-indigo-500/25 bg-white dark:bg-slate-950"
          : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a]/80 hover:border-slate-300 dark:hover:border-white/20"
        }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className={`text-sm font-medium transition-colors duration-150
          ${open ? "text-foreground" : "text-foreground/80"}`}>
          {q}
        </span>
        <ChevronDown
          size={15}
          className={`flex-shrink-0 text-muted-foreground transition-transform duration-200
            ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* CSS max-height transition - no JS animation library */}
      <div
        ref={contentRef}
        className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out"
        style={{
          maxHeight: open ? `${height}px` : "0px",
          opacity: open ? 1 : 0,
        }}
      >
        <div className="px-5 pb-4">
          <div className="h-px bg-slate-100 dark:bg-white/[0.06] mb-3" />
          <p className="text-xs text-muted-foreground leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  )
}

export default function FAQSection() {
  const headRef = useReveal()
  const { resolved } = useUIPrefs()
  const animatedEnabled = resolved.animatedFaq
  const [activeFaq, setActiveFaq] = useState(null)

  return (
    <section>
      <div ref={headRef} className="text-center mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">
          Common questions
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          Frequently asked questions
        </h2>
      </div>

      {animatedEnabled ? (
        <AnimatedList
          items={FAQS}
          onItemSelect={(item, index) => setActiveFaq(activeFaq === index ? null : index)}
          renderItem={(faq, index, isSelected) => (
            <div className={`rounded-xl border transition-all duration-300 overflow-hidden
              ${activeFaq === index
                ? "border-indigo-300/50 dark:border-indigo-500/25 bg-white dark:bg-slate-950"
                : isSelected
                  ? "border-slate-300 dark:border-white/20 bg-white/50 dark:bg-slate-900"
                  : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a]/60"
              }`}
            >
              <div className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
                <span className={`text-sm font-medium transition-colors duration-150
                  ${activeFaq === index ? "text-foreground" : "text-foreground/80"}`}>
                  {faq.q}
                </span>
                <ChevronDown
                  size={15}
                  className={`flex-shrink-0 text-muted-foreground transition-transform duration-200
                    ${activeFaq === index ? "rotate-180" : ""}`}
                />
              </div>
              
              <div
                className={`overflow-hidden transition-all duration-300 ease-out`}
                style={{
                  maxHeight: activeFaq === index ? "200px" : "0px",
                  opacity: activeFaq === index ? 1 : 0,
                }}
              >
                <div className="px-5 pb-4">
                  <div className="h-px bg-slate-100 dark:bg-white/[0.06] mb-3" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              </div>
            </div>
          )}
        />
      ) : (
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <FAQItem key={i} {...faq} index={i} />
          ))}
        </div>
      )}
    </section>
  )
}
