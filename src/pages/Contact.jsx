import { useState } from "react"
import { Mail, MessageSquare, Loader2, Send, CheckCircle2 } from "lucide-react"
import useSeoMeta from "@/hooks/useSeoMeta"
import { submitContactForm } from "@/services/shared/contactService"

const INITIAL_FORM = {
  name: "",
  email: "",
  message: "",
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_1.2fr]">
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
                Message sent successfully{submitMode === "mock" ? " (demo mode)." : "."}
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
    </main>
  )
}
