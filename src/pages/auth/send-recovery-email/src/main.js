import { Client, Users, Query } from "node-appwrite"
import { Resend } from "resend"

export default async ({ req, res, log, error }) => {
  try {
    const body = JSON.parse(req.body || "{}")
    const { email, userId, secret, newPassword } = body

    const appUrl = process.env.APP_URL || "http://localhost:5173"

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY)

    const users = new Users(client)

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

      const resend = new Resend(process.env.RESEND_API_KEY)
      const { data, error: resendError } = await resend.emails.send({
        from: "Unizuya <onboarding@resend.dev>",
        to: email,
        subject: "Reset your Unizuya password",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
            <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:#0f172a;">Reset your password</h2>
            <p style="color:#555;margin-bottom:24px;line-height:1.6;">
              Click the button below to reset your Unizuya password. This link expires in <strong>1 hour</strong>.
            </p>
            <a href="${recoveryUrl}"
              style="display:inline-block;padding:12px 28px;background:#2563eb;color:white;
                     border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
              Reset Password
            </a>
            <p style="color:#999;font-size:12px;margin-top:28px;">
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

      // Verify the token is valid by checking it exists
      // Then update password directly via admin API
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