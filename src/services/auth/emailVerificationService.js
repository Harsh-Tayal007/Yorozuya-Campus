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