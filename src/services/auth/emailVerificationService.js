import { functions } from "@/lib/appwrite"

const FUNCTION_ID = import.meta.env.VITE_APPWRITE_RECOVERY_FUNCTION_ID

export const sendVerificationEmail = async ({ userId, email, name }) => {
  const execution = await functions.createExecution(
    FUNCTION_ID,
    JSON.stringify({ action: "verify", userId, email, name }),
    false,
    "/",
    "POST"
  )

  let result = {}
  try { result = JSON.parse(execution.responseBody || "{}") } catch {}
  if (execution.status === "failed" || result.error) {
    throw new Error(result.error ?? "Failed to send verification email")
  }
  return result
}

export const confirmVerification = async ({ userId, secret }) => {
  const execution = await functions.createExecution(
    FUNCTION_ID,
    JSON.stringify({ action: "confirmVerify", userId, secret }),
    false,
    "/",
    "POST"
  )

  let result = {}
  try { result = JSON.parse(execution.responseBody || "{}") } catch {}
  if (execution.status === "failed" || result.error) {
    throw new Error(result.error ?? "Verification failed")
  }
  return result
}