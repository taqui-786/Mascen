export interface LogoPromptOptions {
  brandName?: string
  describe: string
  style?: string
  tagline?: string
}

export const LOGO_STYLES: Record<string, string> = {
  "modern-3d":
    "Modern 3D claymorphic logo: beautifully sculpted smooth matte 3D character with soft ambient studio lighting, subtle clay highlights, and vibrant saturated colors. Friendly, premium tech aesthetic with bold readable forms. No airbrushed noise or hyper-realistic textures.",

  "flat-vector":
    "Clean flat vector mascot logo: bold uniform black vector outlines, crisp solid color fills with subtle cel-shading, perfectly smooth geometric curves, and high graphic contrast. High-appeal sticker and app icon look with timeless clarity.",

  "minimal-badge":
    "Minimalist emblem badge: mascot head enclosed within a geometric crest or circular emblem, elegant line weights, intelligent use of negative space, and a refined modern startup identity aesthetic.",

  "vintage-retro":
    "Vintage retro cartoon mascot: classic 1930s rubber-hose animation charm, pie-cut eyes or playful retro wink, warm nostalgic ink colors, slightly softened contours, and rich character personality.",

  "cyber-esports":
    "Dynamic tech mascot crest: sharp angular strokes, bold forward-leaning silhouette, energetic facial attitude, high-contrast saturated electric accents, and a modern gaming or cutting-edge AI company vibe.",

  "duotone-stamp":
    "Two-tone screenprint emblem: strictly two harmonious spot colors against pure contrast, graphic stencil cuts, clean negative space, and merchandise-ready print aesthetics.",
}

const LOGO_MARGIN_RULES =
  "MARGINS & CELL BOUNDARIES: Each variant must sit ENTIRELY INSIDE its designated cell with a wide generous empty margin on all four sides. Draw each variant at roughly 75% of the cell dimensions, perfectly centered. Nothing may touch, bleed into, or cross cell dividing boundaries."

const LOGO_BACKGROUND_RULE =
  "BACKGROUND: Isolated on a pure flat solid white background (#FFFFFF) with high contrast against every logo mark. Absolutely NO checkerboard grid, NO faux transparency textures, NO dropshadows behind the cell, NO watermark, NO realistic photo backdrop."

/**
 * Pre-sanitizes user input for logo generation:
 * - Strips distracting clauses, messy scene details, and low-fidelity words
 * - Preserves core character identity, animals, traits, and brand essence
 */
export function sanitizeLogoPrompt(prompt: string): string {
  let cleaned = prompt.trim()
  if (!cleaned) return "a cute friendly mascot character"

  // Remove instructions that add messy photographic backgrounds or human full-body scenes
  cleaned = cleaned.replace(/\b(in a room|in a park|photorealistic|scenery|full body running|holding large objects)\b/gi, "")

  // Remove excess whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim()

  return cleaned
}

/**
 * 3x3 Grid (9 variants) specification:
 * Ideal resolution per cell (~340x340px at 1024x1024, or ~512x512px at 1536x1536).
 * Provides the optimal balance between variety and microscopic fidelity.
 */
const MATRIX_3X3_BREAKDOWN = `The sheet contains EXACTLY NINE DISTINCT LOGO VARIANTS — no more, no fewer, no empty or partially drawn cells — arranged in a 3x3 grid (3 columns by 3 rows). Every variant is a complete standalone icon-only mark: pure mascot icon, absolutely NO text, letters, numbers, brand names, labels, captions, or grid lines anywhere in the sheet.
Row 1 (Badge Framing Explorations):
- Cell 1: Circular Emblem Lockup — mascot mark inside a clean circular border or crest
- Cell 2: Modern App Icon / Squircle — mascot mark centered in a rounded-square icon frame
- Cell 3: Standalone Die-Cut Sticker — mascot silhouette with a bold outer contour badge

Row 2 (Style-Appropriate Color Balance Variations):
- Cell 4: Signature Color Emphasis — emphasize the dominant brand ink within the selected style's palette
- Cell 5: Contrast Emphasis — redistribute the same palette for stronger silhouette contrast
- Cell 6: Airy Color Balance — use more white negative space with restrained areas of the same inks

Row 3 (Expression & Silhouette Treatments):
- Cell 7: Playful Wink / Friendly Expression — cheerful engaging character attitude
- Cell 8: Bold Confident Icon — assured expression and a punchy silhouette
- Cell 9: Curious Character Icon — inquisitive expression and a subtle tilt, retaining the selected rendering style`

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

  return `Generate a 3x3 grid mascot logo exploration sheet of ${safeDescribe} ${brandContext}. ${styleBlock} ${taglineContext}

COMPOSITION & PURPOSE:
This is a professional logo exploration sheet of exactly nine icon-only logo variants. Every cell must display one complete, cohesive, standalone icon mark with strong brand appeal, memorable silhouette, and high legibility. NO accompanying text, labels, captions, wordmarks, taglines, or grid lines anywhere — icon marks only.

LAYOUT:
Exactly 3 columns by 3 rows — nine cells total, evenly spaced in an exact mathematical grid, with exactly one complete variant centered inside each cell and generous empty margins. Cell boundaries are invisible; do not draw the grid. Pure solid flat white background (#FFFFFF). All nine variants share the exact same core mascot identity and the exact same selected art style throughout the sheet; each cell explores a unique combination of color tone, badge framing, and graphic treatment within that style.

The mascot may be an animal OR a personified object character, following the description. Render the character's most iconic form: for animal or creature mascots the head and upper shoulders or an iconic head badge; for object characters the object's most iconic and recognizable form. A cursor mascot stays a recognizable cursor-shaped object character, never an animal head. Any head or portrait guidance in the selected style applies only when appropriate to the described character.

${MATRIX_3X3_BREAKDOWN}

PROPORTIONS & ICON CLARITY:
- Strong silhouette with clean, readable details that stay crisp even when scaled down to favicon size.
- NO cluttered tiny body parts, no intricate tiny fingers, no messy detailed landscapes.

COLOR DISCIPLINE:
Palette explorations must stay appropriate to the selected art style. A duotone or two-tone style uses the same strictly two flat spot inks across all nine variants on unprinted white background, with no extra colors, gradients, shading, or blended tones. A flat vector style stays bold and graphic. Never switch rendering styles or break palette rules for variety; adapt each cell's framing and expression to the selected style.

${LOGO_MARGIN_RULES}

NO simulated checkerboard transparency textures, NO random floating watermark text, NO photorealistic clutter.
${LOGO_BACKGROUND_RULE}
Square image, at least 1024x1024 PNG.`
}
