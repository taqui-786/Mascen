/**
 * Evaluation Suite for Logo Prompts (Prompt Engineering Quality Assurance)
 * Tests prompt generation against:
 * 1. Background safety (zero positive container/background requests, explicit alpha mandates)
 * 2. Typography safety (zero text/wordmark requests, zero bullet numbering, explicit negative bans)
 * 3. 3x3 layout & 9-variant isolation guarantees
 * 4. Style matrix integrity across all 6 supported styles
 * 5. Input sanitization & edge cases
 */

import {
  buildMascotLogoSheetPrompt,
  sanitizeLogoPrompt,
  LOGO_STYLES,
  type LogoPromptOptions,
} from "../lib/agent/logo-prompts.ts"

interface TestCase {
  name: string
  options: LogoPromptOptions
}

interface TestResult {
  name: string
  passed: boolean
  errors: string[]
}

// Words that must NEVER appear in the positive instructions/composition (outside negative constraints)
const FORBIDDEN_POSITIVE_CONTAINER_WORDS = [
  "white background",
  "solid white",
  "solid flat white",
  "#ffffff",
  "background card",
  "background square",
  "background box",
  "squircle container",
  "squircle badge",
  "squircle pad",
  "circular emblem",
  "crest",
  "shield",
  "backdrop panel",
  "enclosed within",
  "inside a rounded squircle",
  "checkerboard texture",
]

const REQUIRED_TRANSPARENCY_MANDATES = [
  "100% completely transparent alpha background",
  "ABSOLUTELY NO BACKGROUND",
  "PNG WITH A REAL ALPHA CHANNEL",
  "standalone floating",
]

const FORBIDDEN_INFOGRAPHIC_PATTERNS = [
  /- cell \d/i,
  /cell \d:/i,
  /row \d \(/i,
  /\bwordmark\b/i,
  /\bsubtitle\b/i,
  /\bcaption\b/i,
  /\bannotation\b/i,
]

const REQUIRED_NEGATIVE_CONSTRAINTS = [
  "ABSOLUTELY NO TEXT",
  "NO LETTERS",
  "NO NUMBERS",
  "NO WORDS",
  "NO BRAND NAMES",
  "NO LABELS",
  "zero typography",
  "ABSOLUTELY NO BACKGROUND",
  "ZERO BACKDROP",
]

const TEST_CASES: TestCase[] = [
  {
    name: "Mascen Brand Mark (3D Tech)",
    options: {
      brandName: "Mascen",
      describe: "a sleek modern geometric tech logo mark combining an interactive pointer cursor with an energetic spark",
      style: "modern-3d",
      tagline: "Interactive Mascots & Brand Engine",
    },
  },
  {
    name: "Character Mascot (Fox - Flat Vector)",
    options: {
      brandName: "Kitsune",
      describe: "a playful orange fox head with bright friendly eyes",
      style: "flat-vector",
      tagline: "Clever code tools",
    },
  },
  {
    name: "Minimal Geometric Badge (Minimal Style)",
    options: {
      brandName: "Apex",
      describe: "an origami crane in flight",
      style: "minimal-badge",
    },
  },
  {
    name: "Vintage Cartoon (Retro Style)",
    options: {
      brandName: "DinerJoy",
      describe: "a happy 1930s rubber-hose coffee cup with pie-cut eyes",
      style: "vintage-retro",
    },
  },
  {
    name: "Cyber Esports (Tech Symbol)",
    options: {
      brandName: "Vortex",
      describe: "an angular mechanical falcon with neon visor",
      style: "cyber-esports",
    },
  },
  {
    name: "Two-Tone Stamp (Duotone Style)",
    options: {
      brandName: "Nordic",
      describe: "a pine tree silhouette intersecting a mountain peak",
      style: "duotone-stamp",
    },
  },
  {
    name: "Edge Case: Dirty User Input with Scenery & Clutter",
    options: {
      brandName: "CleanTest",
      describe: "a cute cat in a room in a park photorealistic holding large objects holding a sword",
      style: "modern-3d",
    },
  },
  {
    name: "Edge Case: Empty Input",
    options: {
      describe: "",
      style: "modern-3d",
    },
  },
]

export function runLogoPromptEvaluations(): { allPassed: boolean; results: TestResult[] } {
  const results: TestResult[] = []

  for (const tc of TEST_CASES) {
    const prompt = buildMascotLogoSheetPrompt(tc.options)
    const errors: string[] = []

    // Split into Positive Composition and Negative Constraints sections
    const splitPoint = prompt.indexOf("STRICT NEGATIVE CONSTRAINTS:")
    const positiveSection = splitPoint !== -1 ? prompt.slice(0, splitPoint).toLowerCase() : prompt.toLowerCase()
    const negativeSection = splitPoint !== -1 ? prompt.slice(splitPoint) : ""

    // 1. Positive Composition: Check for forbidden container/background trigger words
    for (const forbidden of FORBIDDEN_POSITIVE_CONTAINER_WORDS) {
      if (positiveSection.includes(forbidden.toLowerCase())) {
        errors.push(`Found forbidden container/background trigger in composition: "${forbidden}"`)
      }
    }

    // 2. Transparency Mandates: Ensure explicit transparent alpha instructions exist
    for (const required of REQUIRED_TRANSPARENCY_MANDATES) {
      if (!prompt.includes(required)) {
        errors.push(`Missing required transparency mandate: "${required}"`)
      }
    }

    // 3. Typography Safety: Ensure zero infographic bullet formats or caption requests
    for (const pattern of FORBIDDEN_INFOGRAPHIC_PATTERNS) {
      if (pattern.test(positiveSection)) {
        errors.push(`Found forbidden infographic pattern in composition: ${pattern}`)
      }
    }

    // 4. Negative Constraints Block: Ensure all strict negative bans are present
    for (const required of REQUIRED_NEGATIVE_CONSTRAINTS) {
      if (!negativeSection.includes(required) && !prompt.includes(required)) {
        errors.push(`Missing required negative constraint: "${required}"`)
      }
    }

    // 5. Layout Invariant: Must enforce 3x3 mathematical grid with 9 standalone variants
    if (!prompt.includes("3 columns by 3 rows") && !prompt.includes("3x3 grid")) {
      errors.push("Missing 3x3 grid layout specification")
    }
    if (!prompt.includes("EXACTLY NINE DISTINCT LOGO VARIANTS")) {
      errors.push("Missing nine distinct variants breakdown declaration")
    }

    // 6. Dynamic Subject Neutrality: Injected subject must appear in prompt
    if (tc.options.describe.trim()) {
      const sanitized = sanitizeLogoPrompt(tc.options.describe)
      if (!prompt.includes(sanitized)) {
        errors.push(`Sanitized subject "${sanitized}" not found in prompt`)
      }
    }

    // 7. Input Sanitization: Messy scene clauses must be purged
    if (tc.options.describe.includes("in a room") && prompt.includes("in a room")) {
      errors.push("Failed to sanitize 'in a room' from prompt")
    }
    if (tc.options.describe.includes("photorealistic") && prompt.includes("photorealistic")) {
      errors.push("Failed to sanitize 'photorealistic' from prompt")
    }

    // 8. Tagline Safety: Taglines must be isolated from typography
    if (tc.options.tagline) {
      if (!prompt.includes("informs the brand mood of the marks only — it must NOT be rendered as text")) {
        errors.push("Tagline was not isolated with anti-text guardrails")
      }
    }

    // 9. In-Prompt Evaluation Rules: Must include AI pre-generation verification criteria
    if (!prompt.includes("PRE-GENERATION EVALUATION & ACCEPTANCE RULES:")) {
      errors.push("Missing in-prompt evaluation rules block for AI self-verification")
    }

    results.push({
      name: tc.name,
      passed: errors.length === 0,
      errors,
    })
  }

  // 9. Verify all styles in LOGO_STYLES are strictly free of container words
  for (const [styleKey, styleText] of Object.entries(LOGO_STYLES)) {
    const styleLower = styleText.toLowerCase()
    const styleErrors: string[] = []
    for (const forbidden of FORBIDDEN_POSITIVE_CONTAINER_WORDS) {
      if (styleLower.includes(forbidden.toLowerCase())) {
        styleErrors.push(`Style "${styleKey}" contains container word: "${forbidden}"`)
      }
    }
    results.push({
      name: `Style Definition Audit: ${styleKey}`,
      passed: styleErrors.length === 0,
      errors: styleErrors,
    })
  }

  const allPassed = results.every((r) => r.passed)
  return { allPassed, results }
}

// CLI Runner
if (process.argv[1]?.endsWith("eval-logo-prompts.ts") || process.argv[1]?.endsWith("eval-logo-prompts.js")) {
  console.log("==================================================================")
  console.log("🔍 RUNNING LOGO PROMPT ENGINEERING EVALUATION SUITE")
  console.log("==================================================================\n")

  const { allPassed, results } = runLogoPromptEvaluations()

  for (const r of results) {
    if (r.passed) {
      console.log(`  ✅ [PASS] ${r.name}`)
    } else {
      console.log(`  ❌ [FAIL] ${r.name}`)
      for (const err of r.errors) {
        console.log(`      ⚠️  ${err}`)
      }
    }
  }

  console.log("\n------------------------------------------------------------------")
  console.log(`Summary: ${results.filter((r) => r.passed).length}/${results.length} tests passed.`)
  console.log("------------------------------------------------------------------")

  if (allPassed) {
    console.log("🎉 ALL EVALUATIONS PASSED: Prompts guarantee 0 background, 0 text, and 9 standalone variants!\n")
    process.exit(0)
  } else {
    console.error("💥 EVALUATIONS FAILED: Prompt contains forbidden triggers or missing constraints.\n")
    process.exit(1)
  }
}
