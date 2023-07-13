import React, { useRef, useState } from "react";

export default function useSelectCursor(options: number) {
  const [cursor, setCursor] = useState(0);
  const optionRefs = useRef<(HTMLElement | null)[]>(new Array(options));

  // If options changes, we still want the cursor to be in range
  if (cursor >= options && cursor !== 0) {
    setCursor(options - 1 + (options === 0 ? 1 : 0));
  }

  function ensureSelectedInView(cursor: number) {
    optionRefs.current[cursor]?.scrollIntoView({ block: "nearest" });
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (e.code === "ArrowUp" && cursor > 0) {
      setCursor((cursor) => cursor - 1);
      ensureSelectedInView(cursor - 1);
      e.preventDefault();
    } else if (e.code === "ArrowDown" && cursor < options - 1) {
      setCursor((cursor) => cursor + 1);
      ensureSelectedInView(cursor + 1);
      e.preventDefault();
    }
  }

  return { cursor, setCursor, optionRefs, onInputKeyDown };
}
