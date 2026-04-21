const DEFAULT_TIMEOUT_MS = 8_000
const WORKER_DOWN_STATUSES = new Set([404, 502])

function createWorkerUnavailableError(message, details = {}) {
  const err = new Error(message)
  err.name = "WorkerUnavailableError"
  err.isWorkerUnavailable = true
  err.status = details.status ?? null
  err.code = details.code ?? "WORKER_UNAVAILABLE"
  return err
}

function isAbortError(error) {
  return error?.name === "AbortError"
}

export function isWorkerDownStatus(status) {
  return WORKER_DOWN_STATUSES.has(Number(status))
}

export function isWorkerUnavailableError(error) {
  return Boolean(error?.isWorkerUnavailable)
}

export async function readJsonSafe(response) {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

/**
 * Cloudflare Worker fetch with timeout + outage classification.
 * - Throws WorkerUnavailableError on timeout/network and HTTP 404/502.
 * - Returns Response for all other statuses so caller can decide behavior.
 */
export async function fetchCloudflareWorker(
  url,
  {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    workerName = "Cloudflare Worker",
    allowStatuses = [],
    ...fetchOptions
  } = {},
) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  if (fetchOptions.signal) {
    if (fetchOptions.signal.aborted) {
      controller.abort()
    } else {
      fetchOptions.signal.addEventListener("abort", () => controller.abort(), {
        once: true,
      })
    }
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })

    const status = Number(response.status)
    if (!allowStatuses.includes(status) && isWorkerDownStatus(status)) {
      throw createWorkerUnavailableError(
        `${workerName} is currently unavailable (${status}).`,
        { status, code: "WORKER_DOWN" },
      )
    }

    return response
  } catch (error) {
    if (isWorkerUnavailableError(error)) throw error

    if (isAbortError(error)) {
      throw createWorkerUnavailableError(
        `${workerName} request timed out after ${timeoutMs}ms.`,
        { code: "WORKER_TIMEOUT" },
      )
    }

    if (error instanceof TypeError) {
      throw createWorkerUnavailableError(
        `${workerName} is unreachable right now.`,
        { code: "WORKER_NETWORK" },
      )
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}
