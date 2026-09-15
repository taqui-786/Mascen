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

function titleOf(id: string) {
  return id.charAt(0).toUpperCase() + id.slice(1)
}

const FEED_IDS = [
  "taqui",
  "bear",
  "bunny",
  "cat",
  "deer",
  "dino",
  "fox",
  "frog",
  "hamster",
  "hedgehog",
  "koala",
  "otter",
  "owl",
  "panda",
  "penguin",
  "pug",
  "raccoon",
  "redpanda",
  "sheep",
  "sloth",
  "tiger",
  "afro",
  "astronaut",
  "bald",
  "ballerina",
  "beard",
  "builder",
  "cap",
  "chef",
  "glasses",
  "grandpa",
  "granny",
  "hijabi",
  "nurse",
  "pirate",
  "scientist",
  "sikh",
  "skater",
  "wizard",
  "clockwork",
  "crt",
  "cube",
  "drone",
  "gearbot",
  "knight",
  "lantern",
  "postbot",
  "radio",
  "rocket",
  "scout",
  "toaster",
  "tv",
] as const

const PROMPTS: Record<string, string> = {
  taqui: "a chibi man with a neat beard, dark hair, and a navy suit",
  otter: "a chibi otter with chocolate-brown fur, a cream muzzle and dark ear tips",
  fox: "a cute chibi fox with warm orange fur, a cream muzzle and dark ear tips",
  granny: "a chibi grandmother with silver hair in a neat bun and round gold spectacles",
}

export const EXAMPLES: MascotExample[] = FEED_IDS.map((id) => ({
  id,
  title: titleOf(id),
  mode: "prompt" as const,
  prompt: PROMPTS[id] ?? `a chibi ${id}`,
  ...sheets(id),
}))

export const TAQUI = EXAMPLES[0]!

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
