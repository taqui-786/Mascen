/**
 * Rate Limiting & API Security Test Suite
 *
 * Verifies:
 * 1. Sliding window rate limit enforcement and remaining counter decrement
 * 2. 429 status response headers (X-RateLimit-*, Retry-After)
 * 3. Client IP and prefix isolation
 * 4. Input sanitization (brandName, prompt, id validation)
 * 5. SSRF prevention for custom model discovery URLs
 */

import {
  rateLimiterInstance,
  getRateLimitHeaders,
  getClientIp,
  type RateLimitConfig,
} from "../lib/security/rate-limit.ts"
import {
  sanitizeText,
  validateBrandName,
  validatePrompt,
  validateId,
  isSafePublicUrl,
} from "../lib/security/sanitize.ts"

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`)
    process.exit(1)
  }
  console.log(`  ✅ [PASS] ${msg}`)
}

console.log("==================================================================")
console.log("🔒 RUNNING API SECURITY & RATE LIMITING TEST SUITE")
console.log("==================================================================")

// Test 1: Sliding Window Enforcement
console.log("\n1. Sliding Window & Quota Verification")
const testLimit: RateLimitConfig = { windowMs: 10_000, max: 3, prefix: "test:rl" }
const ipTest = "192.0.2.1"

// 3 allowed requests
const r1 = rateLimiterInstance.check(ipTest, testLimit)
assert(r1.success && r1.remaining === 2, "Request 1 allowed, 2 remaining")

const r2 = rateLimiterInstance.check(ipTest, testLimit)
assert(r2.success && r2.remaining === 1, "Request 2 allowed, 1 remaining")

const r3 = rateLimiterInstance.check(ipTest, testLimit)
assert(r3.success && r3.remaining === 0, "Request 3 allowed, 0 remaining")

// 4th request must be rejected
const r4 = rateLimiterInstance.check(ipTest, testLimit)
assert(!r4.success && r4.remaining === 0 && r4.retryAfter > 0, "Request 4 blocked with 429 rate limit exceeded")

// Test 2: Rate Limit Headers Generation
console.log("\n2. RFC Header Generation")
const headers = getRateLimitHeaders(r4)
assert(headers["X-RateLimit-Limit"] === "3", "X-RateLimit-Limit header set to max")
assert(headers["X-RateLimit-Remaining"] === "0", "X-RateLimit-Remaining header is 0 when blocked")
assert(typeof headers["X-RateLimit-Reset"] === "string", "X-RateLimit-Reset timestamp present")
assert(typeof headers["Retry-After"] === "string" && Number(headers["Retry-After"]) >= 1, "Retry-After header present and >= 1")

// Test 3: IP Isolation
console.log("\n3. Client IP Isolation")
const ipOther = "198.51.100.2"
const rOther = rateLimiterInstance.check(ipOther, testLimit)
assert(rOther.success && rOther.remaining === 2, "Distinct IP is not affected by blocked IP")

// Test 4: Endpoint Prefix Isolation
console.log("\n4. Route Prefix Isolation")
const otherRouteLimit: RateLimitConfig = { windowMs: 10_000, max: 5, prefix: "test:other_route" }
const rDifferentRoute = rateLimiterInstance.check(ipTest, otherRouteLimit)
assert(rDifferentRoute.success, "Blocked IP on route A can still use route B")

// Test 5: Client IP Resolution
console.log("\n5. Client IP Resolution Priority")
const mockHeadersCf = new Map([["cf-connecting-ip", "203.0.113.195"], ["x-forwarded-for", "10.0.0.1"]])
assert(getClientIp(mockHeadersCf) === "203.0.113.195", "Cloudflare cf-connecting-ip prioritized")

const mockHeadersFwd = new Map([["x-forwarded-for", "203.0.113.200, 10.0.0.2"]])
assert(getClientIp(mockHeadersFwd) === "203.0.113.200", "First IP in x-forwarded-for extracted")

const mockHeadersFallback = new Map()
assert(getClientIp(mockHeadersFallback) === "127.0.0.1", "Fallback to 127.0.0.1 when no proxy headers")

// Test 6: Input Sanitization
console.log("\n6. Input Sanitization & Bounds")
assert(validateBrandName("  Mascen Studios  ") === "Mascen Studios", "Brand name trimmed")
assert(validateBrandName("A".repeat(100)).length === 60, "Brand name bounded to 60 characters")
assert(validateBrandName("") === "Brand", "Empty brand name falls back to 'Brand'")
assert(sanitizeText("Hello\x00\x08World\x1F!", 100) === "HelloWorld!", "Control characters stripped")
assert(validatePrompt("B".repeat(2000)).length === 1500, "Prompt bounded to 1500 characters")

// Test 7: ID Pattern Validation
console.log("\n7. Entity ID Validation")
assert(validateId("logo-1789914551871"), "Alphanumeric hyphen ID valid")
assert(validateId("7b9f8d5e-2f1a-4c8e-9b2a-1a2b3c4d5e6f"), "UUID format valid")
assert(!validateId("logo'; DROP TABLE mascot_logos; --"), "SQL injection attempt rejected")
assert(!validateId("../../../etc/passwd"), "Path traversal attempt rejected")
assert(!validateId(""), "Empty ID rejected")

// Test 8: SSRF URL Protection
console.log("\n8. SSRF Prevention Guardrails")
assert(!isSafePublicUrl("http://localhost:3000"), "localhost blocked")
assert(!isSafePublicUrl("http://127.0.0.1:8080"), "127.0.0.1 loopback blocked")
assert(!isSafePublicUrl("http://0.0.0.0:8000"), "0.0.0.0 blocked")
assert(!isSafePublicUrl("http://169.254.169.254/latest/meta-data"), "AWS/cloud metadata IP blocked")
assert(!isSafePublicUrl("http://10.0.0.1/admin"), "Private class A subnet 10.x blocked")
assert(!isSafePublicUrl("http://192.168.1.1/router"), "Private class C subnet 192.168.x blocked")
assert(!isSafePublicUrl("http://172.16.0.1/internal"), "Private class B subnet 172.16.x blocked")
assert(!isSafePublicUrl("file:///etc/passwd"), "Non-HTTP protocol (file://) blocked")
assert(!isSafePublicUrl("javascript:alert(1)"), "javascript scheme blocked")

assert(isSafePublicUrl("https://openrouter.ai/api/v1"), "Legitimate public HTTPS endpoint allowed")
assert(isSafePublicUrl("https://api.openai.com/v1"), "OpenAI API URL allowed")
assert(isSafePublicUrl("https://ai.custom-proxy.org/v1"), "Custom public proxy allowed")

console.log("\n------------------------------------------------------------------")
console.log("🎉 ALL API SECURITY & RATE LIMITING TESTS PASSED (8/8 Suites)")
console.log("------------------------------------------------------------------\n")
