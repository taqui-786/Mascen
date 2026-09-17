import type { ReactNode } from "react";
import { Editor } from "@/components/editor";

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Editor />
      {children}
    </>
  );
}
