export type ExampleMode = "prompt" | "photo"

export type MascotExample = {
  id: string
  title: string
  prompt: string
  mode: ExampleMode
  directions: string
  reactions: string
  image: string
}

export type StyleLook = {
  id: string
  title: string
  note: string
  prompt: string
  image: string
  directions: string
  reactions: string
}

function sheets(id: string) {
  const directions = `/mascots/${id}-directions.webp`
  const reactions = `/mascots/${id}-reactions.webp`
  return { directions, reactions, image: directions }
}

export const TAQUI: MascotExample = {
  id: "taqui",
  title: "Taqui",
  prompt: "a chibi man with a neat beard, dark hair, and a navy suit",
  mode: "prompt",
  ...sheets("taqui"),
}

export const MASCEN_FOUNDER_LOGO: MascotExample = {
  id: "mascen-founder",
  title: "Mascen Founder (3D Mascot)",
  prompt: "stylized 3D claymorphic mascot logo portrait with styled black hair, manicured beard and mustache, warm friendly eyes, in modern tech blazer with vibrant warm burnt orange (#ca3500) collar accent",
  mode: "prompt",
  directions: "/logos/mascen-founder-logo-sheet.png",
  reactions: "/logos/mascen-founder-logo-sheet.png",
  image: "/logos/mascen-founder-logo-sheet.png",
}

export const MASCEN_CURSOR_LOGO: MascotExample = {
  id: "mascen-cursor",
  title: "Mascen (Geometric Cursor)",
  prompt: "sleek modern geometric brand identity combining an interactive pointer cursor with an energetic spark of motion and primary brand orange accent",
  mode: "prompt",
  directions: "/logos/mascen-logo-sheet.png",
  reactions: "/logos/mascen-logo-sheet.png",
  image: "/logos/mascen-logo-sheet.png",
}

export const MASCEN_LOGO: MascotExample = MASCEN_FOUNDER_LOGO

export const LOGO_PRESETS: MascotExample[] = [
  MASCEN_FOUNDER_LOGO,
  MASCEN_CURSOR_LOGO,
]

export const STYLES: StyleLook[] = [
  {
    id: "colour",
    title: "colour",
    note: "the default",
    prompt: "in full colour, chibi, head and shoulders",
    ...sheets("fox"),
  },
  {
    id: "ink",
    title: "ink",
    note: "black line",
    prompt: "in black ink line, chibi, head and shoulders",
    ...sheets("fox-ink"),
  },
  {
    id: "sketch",
    title: "sketch",
    note: "pencil",
    prompt: "in pencil sketch, chibi, head and shoulders",
    ...sheets("fox-sketch"),
  },
  {
    id: "riso",
    title: "riso",
    note: "two-tone print",
    prompt: "in riso two-tone print, chibi, head and shoulders",
    ...sheets("fox-riso"),
  },
  {
    id: "paper",
    title: "paper",
    note: "cut paper",
    prompt: "in cut paper, chibi, head and shoulders",
    ...sheets("fox-paper"),
  },
  {
    id: "pixel",
    title: "pixel",
    note: "32 across",
    prompt: "in pixel art, 32 pixels across, chibi, head and shoulders",
    ...sheets("fox-pixel"),
  },
]
