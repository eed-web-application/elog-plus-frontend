import React, { useState } from "react";

export default function useSelectCursor(
  options: number
): [number, { onKeyDown: React.KeyboardEventHandler<HTMLInputElement> }] {
  const [cursor, setCursor] = useState(0);

  // If options changes, we still want the cursor to be in range
  if (cursor >= options && cursor !== 0) {
    setCursor(options - 1 + (options === 0 ? 1 : 0));
  }

  function inputKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (e.code === "ArrowUp" && cursor > 0) {
      setCursor((cursor) => cursor - 1);
    } else if (e.code === "ArrowDown" && cursor < options - 1) {
      setCursor((cursor) => cursor + 1);
    }
  }

  return [cursor, { onKeyDown: inputKeyDown }];
}
