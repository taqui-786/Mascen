## Task one - Build my own package

name - "mascot-taqui"

reference app - /home/md-taqui-imam/my-projects/page-mascot
read its codebase they have their "page-mascot" package component

i don't want to be look like jsut copied or steal their, so be smart, writ a unique code, see if they have any bug and we can write more profesisonal clean code then them,

also rich usage, like i can used in any framework, react, vuejs, nextjs, svelte, angular, deno, bun, nodejs etc

Reagarding more features then them - 

currenct like (example) 

<Mascot
    directions="/mascots/taqui-directions.webp"
    reactions="/mascots/taqui-reactions.webp"
    size={180}
    label="Taqui"
/>

i want to make a npx cli code adding command like npx add mascot-taqui --nextjs , when this run it will read the codebase and add the mascot component in the best way possible way (in nextjs any other framework) that can be used in whole project in a single line import

like

<Mascot
  className="bg-yellow-400 "
  size={140}
  label="Taqui"
/>

just addint, and user can use this where they want, as it won't require any other 3rd parth package as in nextjs i only see import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react' - these dependency

Also see we can add more props, more features and etc

Like what i want is expressionOnLoac as boolean, default false, but when true, when the app loads or image load 4 or 6 animation like fast look like system loaded something, and some more props that suits best for the use case and we make it better then them