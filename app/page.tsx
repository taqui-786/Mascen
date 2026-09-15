import { Mascot } from "./components/mascot";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 selection:bg-indigo-500/20">
      <main className="w-full max-w-4xl px-6 py-20 flex flex-col items-center text-center">
        {/* Mascot Hero Section */}
        <div className="relative mb-6 flex flex-col items-center">
          <div className="relative group p-4 rounded-3xl bg-gradient-to-b from-zinc-200/50 to-zinc-100/30 dark:from-zinc-800/50 dark:to-zinc-900/30 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-900/5 dark:shadow-black/40 transition-transform duration-300 hover:scale-[1.02]">
            <Mascot
              className="bg-yellow-400"
              size={180}
              label="Taqui"
              expressionOnLoad
            />
          </div>
          <span className="mt-3 text-xs tracking-wider uppercase font-medium text-zinc-400 dark:text-zinc-500">
            Loads with a greeting • Hover to look around • Click to boop
          </span>
        </div>

        {/* Title & Bio */}
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
          Meet Your Personal Mascot
        </h1>
        <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed mb-8">
          A custom, cursor-tracking chibi avatar styled after you. Powered by dual 3×3 sprite atlases with zero per-frame JavaScript overhead.
        </p>

        {/* Interaction Tips Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-12 text-left">
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
            <div className="text-xl mb-1">👀</div>
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-1">Cursor Tracking</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
              Turns its head smoothly in 8 directions to follow your pointer across the screen.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
            <div className="text-xl mb-1">✨</div>
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-1">Boop Payoffs</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
              Click to boop! It cycles through blinks, hearts, sparkles, and happy grins.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
            <div className="text-xl mb-1">🌀</div>
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-1">Dizzy Combo</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
              Click 4 times rapidly in a row to spin its eyes into a dizzy swirl state.
            </p>
          </div>
        </div>

        {/* Code Snippet Box */}
        <div className="w-full max-w-2xl bg-zinc-900 text-zinc-200 rounded-2xl p-5 border border-zinc-800 shadow-lg text-left">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3 text-xs text-zinc-400 font-mono">
            <span>Usage in React / Next.js</span>
            <span className="text-emerald-400 font-medium">0.00px verified shift</span>
          </div>
          <pre className="text-xs sm:text-sm font-mono overflow-x-auto text-zinc-300">
{`import { Mascot } from '@/components/mascot'

<Mascot
  className="bg-yellow-400"
  size={140}
  label="Taqui"
  expressionOnLoad
/>`}
          </pre>
        </div>
      </main>

      <footer className="w-full py-6 text-center text-xs text-zinc-400 dark:text-zinc-600 border-t border-zinc-200/60 dark:border-zinc-900">
        Crafted with <span className="text-red-500">♥</span> using mascot-taqui
      </footer>
    </div>
  );
}
