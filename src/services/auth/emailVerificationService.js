/**
 * emailVerificationService.js
 * Handles sending + confirming email verification via the Appwrite function.
 */

import { account, functions } from "@/lib/appwrite"

const FUNCTION_ID = import.meta.env.VITE_APPWRITE_RECOVERY_FUNCTION_ID

/**
 * Send a verification email to the current logged-in user.
 * Calls the Appwrite function which routes to our CF worker → Resend.
 */
export const sendVerificationEmail = async ({ userId, email, name }) => {
  // Step 1: Create a verification token via Appwrite
  // This returns a token with userId + secret that we pass to our function
  const verification = await account.createVerification(
    `${window.location.origin}/verify-email`
  )

  // Step 2: Call our Appwrite function to send the styled email
  const execution = await functions.createExecution(
    FUNCTION_ID,
    JSON.stringify({
      action: "verify",
      userId: verification.userId,
      secret: verification.secret,
      email,
      name,
    }),
    false,
    "/",
    "POST"
  )

  const result = JSON.parse(execution.responseBody || "{}")
  if (result.error) throw new Error(result.error)

  return result
}

/**
 * Confirm email verification using the userId + secret from the email link.
 * Called from the /verify-email page.
 */
export const confirmVerification = async ({ userId, secret }) => {
  return await account.updateVerification(userId, secret)
}