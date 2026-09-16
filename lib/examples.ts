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
