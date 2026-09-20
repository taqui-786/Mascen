export interface LogoPromptOptions {
  brandName?: string
  describe: string
  style?: string
  tagline?: string
}

export const LOGO_STYLES: Record<string, string> = {
  "modern-3d":
    "Modern 3D claymorphic logo: beautifully sculpted smooth matte 3D form with soft ambient studio lighting, subtle clay highlights, and vibrant saturated colors. Friendly, premium tech aesthetic with bold readable forms. Standalone floating 3D mark on transparent alpha.",

  "flat-vector":
    "Clean flat vector logo: bold uniform vector contours, crisp solid color fills with subtle cel-shading, perfectly smooth geometric curves, and high graphic contrast. Standalone floating vector symbol on transparent alpha.",

  "minimal-badge":
    "Minimalist geometric logo: refined iconic mark with elegant line weights, intelligent use of negative space, and modern startup identity aesthetics. Standalone floating geometric mark on transparent alpha.",

  "vintage-retro":
    "Vintage retro cartoon logo: classic 1930s rubber-hose animation charm, pie-cut eyes or playful retro wink, warm nostalgic ink colors, slightly softened contours, and rich character personality. Standalone floating retro mark on transparent alpha.",

  "cyber-esports":
    "Dynamic tech symbol: sharp angular strokes, bold forward-leaning silhouette, energetic graphic attitude, high-contrast saturated electric accents, and cutting-edge tech company vibe. Standalone floating symbol on transparent alpha.",

  "duotone-stamp":
    "Two-tone graphic logo: strictly two harmonious spot colors against pure contrast, clean graphic stencil cuts, refined negative space, and merchandise-ready print aesthetics. Standalone floating two-tone mark on transparent alpha.",
}

const LOGO_MARGIN_RULES =
  "MARGINS: each variant must sit ENTIRELY INSIDE its designated cell with a wide generous empty margin on all four sides. Draw each variant at roughly 75% of the cell dimensions, perfectly centered. Nothing may touch, bleed into, or cross cell dividing boundaries."

const LOGO_BACKGROUND_RULE =
  "BACKGROUND: 100% completely transparent alpha background. Pure empty transparent space between and behind all marks. Zero backdrop, zero background color, no faux checkerboard textures, no drop shadows behind the cell, no watermark."

/**
 * Pre-sanitizes user input for logo generation:
 * - Strips distracting clauses, messy scene details, and low-fidelity words
 * - Preserves core character identity, traits, and brand essence
 */
export function sanitizeLogoPrompt(prompt: string): string {
  let cleaned = prompt.trim()
  if (!cleaned) return "a sleek modern geometric tech logo mark"

  cleaned = cleaned.replace(/\b(in a room|in a park|photorealistic|scenery|full body running|holding large objects)\b/gi, "")
  cleaned = cleaned.replace(/\s+/g, " ").trim()

  return cleaned
}

/**
 * Generates the 3x3 Grid (9 variants) specification dynamically adapted to the subject.
 * Eliminates all bullet points, numbers, and container boxes.
 */
export function buildNineVariantsBreakdown(subject: string): string {
  const shortSubject = subject.length > 60 ? "the brand mark" : subject
  return `The sheet contains EXACTLY NINE DISTINCT LOGO VARIANTS arranged in a 3x3 grid (3 columns by 3 rows). Every variant is strictly a standalone, isolated floating mark of ${shortSubject}. Every mark floats freely in pure transparent space without any enclosing shapes or borders.
Row 1: iconic front-facing signature mark, dynamic three-quarter angled mark with rich spatial depth, clean isometric perspective icon.
Row 2: signature primary brand color emphasis, high-contrast dark silhouette emphasis, airy minimalist negative-space treatment.
Row 3: energetic dynamic motion tilt, confident bold upright icon, curious expressive stylized geometric variation.`
}

const LOGO_EVALUATION_RULES = `PRE-GENERATION EVALUATION & ACCEPTANCE RULES:
Verify the design against these 4 mandatory checks before rendering:
1. BACKGROUND EVALUATION: The space between and behind all 9 marks must be 100% pure transparent alpha. Zero backdrop, zero background cards, zero container boxes, zero squircle pads, zero circular discs.
2. TYPOGRAPHY EVALUATION: The sheet must be 100% free of letters, numbers, captions, subtitles, labels, or cell numbers. Zero text and zero digits anywhere. Pure standalone graphic icon marks only.
3. ISOLATION EVALUATION: Every mark must be an isolated standalone floating 3D/vector icon with wide empty margins on all four sides. No enclosing frames, no badge outlines, no backdrop panels.
4. VARIATION & MATRIX EVALUATION: Exactly nine distinct standalone marks in an exact 3x3 layout sharing identical core brand identity and selected art style.`

export function buildMascotLogoSheetPrompt({
  brandName,
  describe,
  style = "modern-3d",
  tagline,
}: LogoPromptOptions): string {
  const safeDescribe = sanitizeLogoPrompt(describe)
  const styleBlock = LOGO_STYLES[style] || LOGO_STYLES["modern-3d"]
  const brandContext = brandName ? `for the brand "${brandName.trim()}"` : "for a modern brand identity"
  const taglineContext = tagline
    ? `The tagline "${tagline.trim()}" informs the brand mood of the marks only — it must NOT be rendered as text anywhere in the image.`
    : ""

  return `Generate a 3x3 grid logo exploration sheet of ${safeDescribe} ${brandContext}. ${styleBlock} ${taglineContext}

COMPOSITION & PURPOSE:
This is a professional logo exploration sheet of exactly nine standalone icon-only logo marks on a 100% transparent alpha background. Every cell displays one complete, isolated, standalone floating icon mark with strong brand appeal, memorable silhouette, and high legibility. Standalone floating icon marks only — zero text, zero labels, zero borders.

LAYOUT:
Exactly 3 columns by 3 rows — nine cells total, evenly spaced in an exact mathematical grid, with exactly one standalone floating variant centered inside each cell and generous empty margins. 100% fully transparent alpha background. All nine variants share the exact same core brand identity and the exact same selected art style throughout the sheet; each cell explores a unique combination of color tone, silhouette angle, and detail treatment within that style.

Render the brand's most iconic form: ${safeDescribe}, capturing its recognizable silhouette and clean graphic appeal.

${buildNineVariantsBreakdown(safeDescribe)}

PROPORTIONS & ICON CLARITY:
- Strong silhouette with clean, readable details that stay crisp even when scaled down to favicon size.
- NO cluttered tiny body parts, no intricate tiny fingers, no messy detailed landscapes.
- Standalone floating shapes with pure transparent empty space surrounding each mark.

COLOR DISCIPLINE:
Palette explorations must stay appropriate to the selected art style. A duotone or two-tone style uses the same strictly two flat spot inks across all nine variants on transparent background. A flat vector style stays bold and graphic. Never switch rendering styles or break palette rules for variety; adapt each cell's framing and expression to the selected style.

${LOGO_MARGIN_RULES}

STRICT NEGATIVE CONSTRAINTS:
ABSOLUTELY NO TEXT, NO LETTERS, NO NUMBERS, NO WORDS, NO BRAND NAMES, NO LABELS, NO CAPTIONS, NO SUBTITLES, NO CELL NUMBERS, NO ANNOTATIONS, NO GRID LINES, NO BORDERS, NO WATERMARK.
ABSOLUTELY NO BACKGROUND, ZERO BACKDROP, NO SOLID COLOR BACKDROP, NO CONTAINER SHAPES, NO CARDS, NO BOXES, NO PADS, NO DISCS.
Every cell must be strictly a standalone floating graphic symbol on 100% transparent alpha with zero typography.

${LOGO_EVALUATION_RULES}

${LOGO_BACKGROUND_RULE}
Square image, at least 1024x1024 PNG WITH A REAL ALPHA CHANNEL.`
}

export function buildReferencePhotoLogoPrompt({
  brandName,
  describe,
  style = "modern-3d",
  tagline,
}: LogoPromptOptions): string {
  const safeDescribe = sanitizeLogoPrompt(describe)
  const styleBlock = LOGO_STYLES[style] || LOGO_STYLES["modern-3d"]
  const brandContext = brandName ? `for the brand "${brandName.trim()}"` : "for a modern brand identity"
  const taglineContext = tagline
    ? `The tagline "${tagline.trim()}" informs the brand mood of the marks only — it must NOT be rendered as text anywhere in the image.`
    : ""

  return `The attached reference image shows a person or character. Redraw them as a 3x3 grid logo exploration sheet of nine standalone, icon-only mascot logo marks ${brandContext}. ${styleBlock} ${taglineContext}

REFERENCE ADAPTATION:
DO NOT reproduce the photograph or realistic skin textures. Restyle completely into an iconic stylized mascot logo head and shoulders portrait. Keep ONLY key identifying likeness: hair volume and dark color, neat trimmed beard and mustache, warm friendly eyes, and confident expression${
    safeDescribe ? `. Character details: ${safeDescribe}` : ""
  }. Simplify everything else away into bold, readable, high-appeal icon geometry.

COMPOSITION & PURPOSE:
This is a professional logo exploration sheet of exactly nine standalone icon-only mascot marks on a 100% transparent alpha background. Every cell displays one complete, isolated, standalone floating icon mark with strong brand appeal, memorable silhouette, and high legibility. Standalone floating icon marks only — zero text, zero labels, zero borders.

LAYOUT:
Exactly 3 columns by 3 rows — nine cells total, evenly spaced in an exact mathematical grid, with exactly one standalone floating variant centered inside each cell and generous empty margins. 100% fully transparent alpha background. All nine variants share the exact same core mascot identity and the exact same selected art style throughout the sheet; each cell explores a unique combination of color tone, silhouette angle, and detail treatment within that style.

${buildNineVariantsBreakdown("the stylized founder mascot mark")}

PROPORTIONS & ICON CLARITY:
- Strong silhouette with clean, readable details that stay crisp even when scaled down to favicon size.
- Head and shoulders bust only, no realistic clothing wrinkles, no tiny fingers, no messy landscapes.
- Standalone floating shapes with pure transparent empty space surrounding each mark.

COLOR DISCIPLINE:
Palette explorations must stay appropriate to the selected art style. A duotone or two-tone style uses the same strictly two flat spot inks across all nine variants on transparent background. A flat vector style stays bold and graphic. Never switch rendering styles or break palette rules for variety; adapt each cell's framing and expression to the selected style.

${LOGO_MARGIN_RULES}

STRICT NEGATIVE CONSTRAINTS:
ABSOLUTELY NO TEXT, NO LETTERS, NO NUMBERS, NO WORDS, NO BRAND NAMES, NO LABELS, NO CAPTIONS, NO SUBTITLES, NO CELL NUMBERS, NO ANNOTATIONS, NO GRID LINES, NO BORDERS, NO WATERMARK.
ABSOLUTELY NO BACKGROUND, ZERO BACKDROP, NO SOLID COLOR BACKDROP, NO CONTAINER SHAPES, NO CARDS, NO BOXES, NO PADS, NO DISCS.
Every cell must be strictly a standalone floating graphic symbol on 100% transparent alpha with zero typography.

${LOGO_EVALUATION_RULES}

${LOGO_BACKGROUND_RULE}
Square image, at least 1024x1024 PNG WITH A REAL ALPHA CHANNEL.`
}

