export const STYLES: Record<string, string> = {
  colour:
    "Cute storybook sticker art: clean bold black outlines with some weight variation, big expressive eyes each with a bright white catchlight, soft pink cheek blush, and warm saturated colours. Give it several tones per colour -- a lighter muzzle or belly, a darker shaded edge, coloured inner ears -- and a textured, tufted silhouette wherever the character has fur or hair, rather than a smooth blob. Charming and playful, full of small appealing details. Not flat, not plain, not minimal. No photorealism, no heavy 3D gloss, no airbrushed gradients.",

  ink:
    "Black and white pen-and-ink drawing. Confident varied-weight black linework with fine cross-hatching and stippling for shading. NO colour anywhere and no flat grey fills -- every tone comes from the density of the hatching. Big expressive eyes with a white catchlight left as clean paper. Crisp, high contrast, plenty of open white. Charming and characterful, like a children's book illustration. Keep the big-head chibi cartoon proportions and soft cheek blush.",

  sketch:
    "Loose graphite pencil sketch. Visible hand-drawn strokes with a slightly rough, searching quality, soft smudged shading, a few construction lines left showing. Warm grey graphite tones only, no flat colour and no hard vector edges. Big expressive eyes with a bright highlight left as clean paper. Warm and handmade. Keep the big-head chibi cartoon proportions and soft cheek blush.",

  riso:
    "Two-colour risograph print. Flat spot inks in warm coral red and deep teal ONLY, plus the paper showing through. Visible paper grain, coarse halftone dot texture in the shaded areas, and a slight misregistration offset between the two ink layers. Bold simple shapes, no black outline -- forms are defined by the colour blocks.",

  paper:
    "Cut-paper collage. The character built entirely from flat torn and cut paper shapes in layered matte colours, with visible paper fibre texture and a soft drop shadow where one piece overlaps another. No drawn outlines at all -- every edge is a cut or torn paper edge. Warm, tactile and handmade.",

  pixel:
    "16-bit pixel art. Chunky visible square pixels on a strict grid, a small limited palette, hard-edged dithering for shading, a crisp one-pixel dark outline, and absolutely no anti-aliasing or soft edges anywhere. Readable and characterful at a small size, like a Super Nintendo sprite.",
}

const RULES = `LAYOUT: 3 columns by 3 rows, evenly spaced, pure solid flat white background (#FFFFFF). Each drawing is head plus upper shoulders, centred in its cell, same character and same head size in all nine cells.

FRAMING: a PORTRAIT BUST. Head, neck and shoulders only. NO arms, NO hands, NO legs, NO lower body. The shoulders are the lowest thing in the cell.

PROPORTIONS: a BIG HEAD chibi that still has a real body. The head is large and dominant, and the shoulders are roughly TWO THIRDS the width of the head -- narrower than the head, but clearly there. Do NOT draw a floating head.

THE RULE THAT MATTERS MOST: draw the BODY ONCE and reuse it. The neck, chest and shoulders must be the EXACT SAME SHAPE in the EXACT SAME POSITION in all nine cells, identical pixels if you can. The body always faces the viewer. Do NOT redraw the body in profile when the head turns. Only the head rotates, on top of an unchanging body.

MARGINS: each character must sit ENTIRELY INSIDE its own cell with a wide empty gap on all four sides. Draw it at roughly 75% of the cell height, centred, leaving clear empty space above the head AND below the shoulders. The shoulders must STOP WELL SHORT of the bottom edge of the cell -- do not let the body run off the bottom or bleed into the cell underneath. Nothing may touch or cross a cell boundary.`

const EXPRESSIONS = `1. Eyes closed as two upward curved arcs. No symbol.
2. Same closed arc eyes, plus one clearly visible SMALL RED HEART floating in the empty space above the head.
3. Same closed arc eyes, plus THREE SMALL YELLOW SPARKLE STARS above the head.
4. Eyes wide open and very round, mouth open in a small round O of surprise.
5. Starstruck: both eyes drawn as bright star shapes, big happy smile.
6. Eyes closed arcs, strong pink blush on both cheeks.
7. Eyes closed sleeping curves, plus a small blue "z z z" above the head.
8. Both eyes drawn as spiral swirls, wavy wobbly mouth. Dizzy.
9. Eyes closed arcs, mouth wide open in a big happy grin.`

const TAIL =
  "SOLID BACKGROUND: Must be isolated on a pure flat solid white background (#FFFFFF) with high contrast against the character silhouette. Absolutely NO checkerboard patterns, NO simulated transparency textures, NO gradients, NO drop shadows, NO border lines, no text. Square image, at least 1024x1024 PNG."

/**
 * Pre-sanitizes user input to remove traits that break sprite alignment.
 * For example: ties back loose long hair that covers shoulders.
 */
export function sanitizePrompt(prompt: string): string {
  let cleaned = prompt.trim()
  if (!cleaned) return "a cute chibi creature"

  // If prompt describes long loose hair over shoulders, rewrite to tied-back
  if (/\b(long hair|loose hair|flowing hair|hair down)\b/i.test(cleaned)) {
    cleaned = cleaned.replace(
      /\b(long hair|loose hair|flowing hair|hair down)\b/gi,
      "hair tied back in a neat bun or under a hat"
    )
  }

  // Avoid held props or wide accessories that break head-and-shoulders framing
  if (/\b(holding a staff|holding a mug|holding an instrument|holding a sword|holding a book|holding weapons?)\b/i.test(cleaned)) {
    cleaned = cleaned.replace(
      /\b(holding a staff|holding a mug|holding an instrument|holding a sword|holding a book|holding weapons?)\b/gi,
      "head and upper shoulders portrait only"
    )
  }

  return cleaned
}

export function buildDirectionsPrompt(describe: string, style = "colour"): string {
  const safeDescribe = sanitizePrompt(describe)
  const styleBlock = STYLES[style] || STYLES.colour

  return `Generate a 3x3 grid sprite sheet of ${safeDescribe}. ${styleBlock}

This sheet is NINE HEAD DIRECTIONS, not expressions -- the face keeps the same calm expression in every cell and only the direction the head is TURNED changes.

${RULES}

Turn the whole head clearly, do not just move the eyes: looking left swings the nose or muzzle left and brings the far ear or cheek into view.
Row 1: up-left, up, up-right. Row 2: left, straight at the viewer, right.
Row 3: down-left, down, down-right.

NO hearts, NO sparkles, NO "zzz", NO spiral eyes -- no floating symbols of any kind.
${TAIL}`
}

export function buildReactionsPrompt(describe: string, style = "colour"): string {
  const safeDescribe = sanitizePrompt(describe)
  const look =
    style !== "colour"
      ? `Keep the ${style} rendering style of the reference image exactly. `
      : ""

  return `The attached reference image is a 3x3 head-direction sprite sheet. Produce the MATCHING EXPRESSIONS sheet for that same character. The character is ${safeDescribe}. ${look}Copy the character from the attached image exactly: the same colours, the same markings, the same fur or surface detail, the same line weight. Every marking visible in the attached sheet must appear here too. Do not restyle, simplify or redraw it. CRITICAL: keep the exact same pure flat solid white background (#FFFFFF) with NO checkerboard or textures.

NOT head directions. The character faces STRAIGHT AT THE VIEWER in all nine cells, head perfectly straight. The only thing that changes between cells is the FACE, plus one small floating symbol in three of them.

CRITICAL: same character, same art style, same palette, same line weight, same proportions, and EXACTLY THE SAME SIZE AND POSITION IN THE CELL as the attached sheet. The chest and shoulders must be the same drawing, the same width, and the same height off the bottom of the cell as in the attached sheet, identical in all nine cells here. If the two sheets do not line up the character visibly jumps, so match them.

Wide margin on all four sides, nothing touching a cell edge including the floating symbols, and clear empty space below the shoulders.

The nine expressions, left to right, top to bottom:
${EXPRESSIONS}

${TAIL}`
}

export function buildReferencePhotoPrompt(describe: string, style = "colour"): string {
  const safeDescribe = sanitizePrompt(describe)
  const styleBlock = STYLES[style] || STYLES.colour

  return `The attached image shows a person or character. Redraw them as a 3x3 grid sprite sheet of NINE HEAD DIRECTIONS, in a completely different style from the attached image.

DO NOT reproduce the photograph: not its realism, not its lighting, not its proportions, not its level of detail. Restyle it completely into a BIG HEAD CHIBI CARTOON -- a head roughly one and a half times the width of the shoulders, very large round friendly eyes far bigger than a real person's, a simplified nose and mouth, thick clean outlines and soft cheek blush. Think children's sticker, not portrait.

Keep ONLY the things that identify them: hair shape and colour, facial hair, the shape and colour of any glasses, skin tone, and the colour of their top${
    safeDescribe ? `. They are ${safeDescribe}` : ""
  }. Simplify everything else away. ${styleBlock}

The face keeps the same calm friendly expression in every cell; only the direction the head is TURNED changes.

${RULES}

Turn the whole head clearly, do not just move the eyes.
Row 1: up-left, up, up-right. Row 2: left, straight at the viewer, right.
Row 3: down-left, down, down-right.

NO hearts, NO sparkles, NO "zzz", NO spiral eyes -- no floating symbols of any kind.
${TAIL}`
}
