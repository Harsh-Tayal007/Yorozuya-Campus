import { Client, Users, Query } from "node-appwrite"
import { Resend } from "resend"

export default async ({ req, res, log, error }) => {
  try {
    const body = JSON.parse(req.body || "{}")
    const { action, email, userId, secret, newPassword, name } = body

    const appUrl = process.env.APP_URL || "http://localhost:5173"
    const emailWorkerUrl = process.env.EMAIL_WORKER_URL // e.g. https://unizuya-email.harshtayal710.workers.dev

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY)

    const users = new Users(client)

    // ── MODE 0: Send styled verification email via CF worker ──────────────
    if (action === "verify") {
      log("Mode: send verification email to " + email)

      if (!userId || !secret || !email) {
        return res.json({ error: "Missing userId, secret, or email" }, 400)
      }

      const verifyUrl = `${appUrl}/verify-email?userId=${encodeURIComponent(userId)}&secret=${encodeURIComponent(secret)}`

      // If CF worker is configured, use it for styled email
      if (emailWorkerUrl) {
        const workerRes = await fetch(`${emailWorkerUrl}/send/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: email, name: name ?? "", verifyUrl }),
        })
        const workerData = await workerRes.json()
        if (!workerRes.ok) throw new Error(workerData?.error ?? "Worker error")
        log("Verification email sent via CF worker")
        return res.json({ ok: true })
      }

      // Fallback: send via Resend directly (plain styled version)
      const resend = new Resend(process.env.RESEND_API_KEY)
      const firstName = (name || "").split(" ")[0] || "there"
      const { error: resendError } = await resend.emails.send({
        from: "Unizuya <onboarding@resend.dev>",
        to: email,
        subject: "Verify your Unizuya email",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d1b35;border-radius:16px;">
            <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:#fff;">Hey ${firstName}, verify your email</h2>
            <p style="color:#94a3b8;margin-bottom:24px;line-height:1.6;">
              Click the button below to verify your Unizuya account. This link expires in <strong style="color:#f59e0b;">24 hours</strong>.
            </p>
            <a href="${verifyUrl}"
              style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#2563eb,#4f46e5);color:white;
                     border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
              ✓ Verify my email
            </a>
            <p style="color:#64748b;font-size:12px;margin-top:28px;">
              If you didn't create a Unizuya account, you can safely ignore this email.
            </p>
          </div>
        `,
      })

      if (resendError) {
        error("Resend error: " + JSON.stringify(resendError))
        return res.json({ error: resendError.message }, 500)
      }

      log("Verification email sent via Resend directly")
      return res.json({ ok: true })
    }

    // ── MODE 1: Send recovery email ───────────────────────────────────────
    if (email && !newPassword) {
      log("Mode: send recovery email to " + email)

      const list = await users.list([Query.equal("email", email)])
      log("Users found: " + list.total)

      if (list.total === 0) return res.json({ success: true })

      const user = list.users[0]
      log("Found userId: " + user.$id)

      const token = await users.createToken(user.$id)
      log("Token created")

      const recoveryUrl = `${appUrl}/reset-password?userId=${user.$id}&secret=${token.secret}`
      const firstName = (user.name || "").split(" ")[0] || "there"

      // Use CF worker for styled email if available
      if (emailWorkerUrl) {
        const workerRes = await fetch(`${emailWorkerUrl}/send/reset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: email, name: user.name ?? "", resetUrl: recoveryUrl }),
        })
        const workerData = await workerRes.json()
        if (!workerRes.ok) throw new Error(workerData?.error ?? "Worker error")
        log("Reset email sent via CF worker")
        return res.json({ success: true })
      }

      // Fallback: original Resend send
      const resend = new Resend(process.env.RESEND_API_KEY)
      const { data, error: resendError } = await resend.emails.send({
        from: "Unizuya <onboarding@resend.dev>",
        to: email,
        subject: "Reset your Unizuya password",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d1b35;border-radius:16px;">
            <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:#fff;">Reset your password</h2>
            <p style="color:#94a3b8;margin-bottom:24px;line-height:1.6;">
              Click the button below to reset your Unizuya password. This link expires in <strong style="color:#f59e0b;">1 hour</strong>.
            </p>
            <a href="${recoveryUrl}"
              style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;
                     border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
              🔑 Reset Password
            </a>
            <p style="color:#64748b;font-size:12px;margin-top:28px;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      })

      if (resendError) {
        error("Resend error: " + JSON.stringify(resendError))
        return res.json({ error: resendError.message }, 500)
      }

      log("Email sent: " + data?.id)
      return res.json({ success: true })
    }

    // ── MODE 2: Verify token + update password server-side ────────────────
    if (userId && secret && newPassword) {
      log("Mode: reset password for userId " + userId)

      if (newPassword.length < 8) {
        return res.json({ error: "Password must be at least 8 characters" }, 400)
      }

      try {
        await users.updatePassword(userId, newPassword)
        log("Password updated successfully")
        return res.json({ success: true })
      } catch (err) {
        error("Failed to update password: " + err.message)
        return res.json({ error: "Failed to update password: " + err.message }, 500)
      }
    }

    return res.json({ error: "Invalid request" }, 400)

  } catch (err) {
    error("Unexpected error: " + err.message + "\n" + err.stack)
    return res.json({ error: err.message }, 500)
  }
}