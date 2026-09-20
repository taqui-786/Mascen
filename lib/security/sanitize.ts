/**
 * Input Sanitization and Security Validation Helpers
 * 
 * Protects against injection, oversized payload resource exhaustion,
 * and Server-Side Request Forgery (SSRF).
 */

/**
 * Strips non-printable ASCII control characters (except newline \n and tab \t)
 * and truncates to maxLength.
 */
export function sanitizeText(
  input: unknown,
  maxLength: number = 1000,
  fallback: string = ""
): string {
  if (typeof input !== "string") {
    return fallback
  }

  // Remove control characters (0x00-0x08, 0x0B-0x0C, 0x0E-0x1F, 0x7F)
  // eslint-disable-next-line no-control-regex
  const sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim()

  return sanitized.slice(0, maxLength)
}

/**
 * Validates and sanitizes brand name input (max 60 characters)
 */
export function validateBrandName(input: unknown): string {
  const sanitized = sanitizeText(input, 60, "Brand")
  return sanitized || "Brand"
}

/**
 * Validates and sanitizes generation prompt (max 1500 characters)
 */
export function validatePrompt(input: unknown): string {
  return sanitizeText(input, 1500, "")
}

/**
 * Validates and sanitizes tagline input (max 150 characters)
 */
export function validateTagline(input: unknown): string {
  return sanitizeText(input, 150, "")
}

/**
 * Validates entity ID string (alphanumeric, dash, underscore, 1-128 chars)
 */
export function validateId(input: unknown): boolean {
  if (typeof input !== "string") return false
  const trimmed = input.trim()
  if (!trimmed || trimmed.length > 128) return false
  return /^[a-zA-Z0-9_-]+$/.test(trimmed)
}

/**
 * Validates custom Base URLs to prevent SSRF (Server-Side Request Forgery).
 * Rejects private IPs, loopback addresses, AWS/GCP metadata endpoints, and non-HTTP protocols.
 */
export function isSafePublicUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString)

    // Only allow HTTP and HTTPS
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false
    }

    const hostname = parsed.hostname.toLowerCase()

    // Disallow localhost and loopback
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) {
      return false
    }

    // Cloud metadata services (e.g. AWS/GCP 169.254.169.254)
    if (hostname === "169.254.169.254" || hostname.startsWith("169.254.")) {
      return false
    }

    // Disallow standard private IPv4 address ranges
    // 10.0.0.0 - 10.255.255.255
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return false
    }
    // 172.16.0.0 - 172.31.255.255
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return false
    }
    // 192.168.0.0 - 192.168.255.255
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return false
    }

    return true
  } catch {
    return false
  }
}
