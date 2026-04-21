import { useState } from "react"
import { Mail, MessageSquare, Loader2, Send, CheckCircle2, Github, Linkedin, Instagram } from "lucide-react"
import useSeoMeta from "@/hooks/useSeoMeta"
import { submitContactForm } from "@/services/shared/contactService"

const INITIAL_FORM = {
  name: "",
  email: "",
  message: "",
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function DiscordIcon({ size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

// ─── Team members ─────────────────────────────────────────────────────────────
const TEAM = [
  {
    name: "Harsh Tayal",
    role: "Founder & Lead Developer",
    socials: [
      // TODO: Add actual GitHub link
      { icon: Github, href: "https://github.com/Harsh-Tayal007", label: "GitHub" },
      // TODO: Add actual LinkedIn link
      { icon: Linkedin, href: "https://www.linkedin.com/in/harsh-tayal-619521247?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app", label: "LinkedIn" },
      // TODO: Add actual Instagram link
      { icon: Instagram, href: "https://www.instagram.com/harshisweeb/", label: "Instagram" },
      // TODO: Add actual Discord link
      { icon: DiscordIcon, href: "https://discord.gg/eZcF8eMu", label: "Discord" },
    ],
  },
  {
    name: "Kuldeep Vashishth",
    role: "Contributor & Co-Developer",
    socials: [
      // TODO: Add actual GitHub link
      { icon: Github, href: "https://github.com/kuldeepvashisth", label: "GitHub" },
      // TODO: Add actual LinkedIn link
      { icon: Linkedin, href: "https://www.linkedin.com/in/kuldeep-vashisth-974630380?utm_source=share_via&utm_content=profile&utm_medium=member_android", label: "LinkedIn" },
    ],
  },
]

export default function Contact() {
  useSeoMeta({
    title: "Contact Unizuya | Student Academic Platform",
    description: "Contact the Unizuya team for feedback, queries, and support related to syllabus, PYQs, forum, attendance, and student tools.",
  })

  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitMode, setSubmitMode] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  const updateField = (field) => (event) => {
    const value = event.target.value
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: "" }))
    setSubmitError("")
  }

  const validate = () => {
    const nextErrors = {}

    if (!form.name.trim()) {
      nextErrors.name = "Name is required."
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email is required."
    } else if (!EMAIL_PATTERN.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address."
    }

    if (!form.message.trim()) {
      nextErrors.message = "Message is required."
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validate()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError("")
    setIsSuccess(false)

    try {
      const result = await submitContactForm({
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      })

      setSubmitMode(result.mode)
      setIsSuccess(true)
      setForm(INITIAL_FORM)
    } catch (error) {
      setSubmitError(error.message || "Unable to send your message right now. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12 dark:from-[#080e1a] dark:via-[#0d1628] dark:to-[#080e1a]">
      <div className="mx-auto max-w-5xl space-y-8">

        {/* ── Existing contact layout (unchanged) ── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <section className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
              Contact Unizuya
            </p>
            <h1 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">
              Let&apos;s talk
            </h1>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Have feedback, a question, or an issue? Send us a message and we will get back to you as soon as possible.
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <Mail size={16} className="mt-0.5 text-blue-500" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Email support</h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300">support@unizuya.in</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <MessageSquare size={16} className="mt-0.5 text-indigo-500" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Response window</h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Replies are manual for now.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label htmlFor="contact-name" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={form.name}
                  onChange={updateField("name")}
                  placeholder="Your name"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-email" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={form.email}
                  onChange={updateField("email")}
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-message" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={6}
                  value={form.message}
                  onChange={updateField("message")}
                  placeholder="How can we help?"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
                {errors.message && <p className="text-xs text-red-500">{errors.message}</p>}
              </div>

              {submitError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                  {submitError}
                </p>
              )}

              {isSuccess && (
                <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <CheckCircle2 size={14} />
                  Message sent successfully
                  {submitMode === "mock"
                    ? " (demo mode)."
                    : submitMode === "appwrite-fallback"
                    ? " (fallback mode)."
                    : "."}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Send message
                  </>
                )}
              </button>
            </form>
          </section>
        </div>

        {/* ── People behind Unizuya (new, visually secondary) ── */}
        <section aria-label="Team">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              People behind Unizuya
            </p>
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {TEAM.map((member, idx) => (
              <div
                key={member.name}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/60 px-4 py-3 dark:border-white/10 dark:bg-white/5"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {member.name}
                    {idx === 0 && (
                      <span className="ml-2 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-500">
                        Primary
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{member.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  {member.socials.map(({ icon: Icon, href, label }) => (
                    <a
                      key={label}
                      href={href}
                      aria-label={`${member.name} on ${label}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200"
                    >
                      <Icon size={13} />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  )
}
