const WORKER_URL = import.meta.env.VITE_CONTACT_WORKER_URL

export async function submitContactForm({ name, email, message }) {
  if (!WORKER_URL) {
    throw new Error("Contact service not configured.")
  }

  let response
  try {
    response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, message }),
    })
  } catch (err) {
    throw new Error("Network error. Please check your connection.")
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error("Invalid server response.")
  }

  if (!response.ok) {
    throw new Error(data?.error || "Failed to send message.")
  }

  return {
    ok: true,
    mode: "live", // used in UI
  }
}