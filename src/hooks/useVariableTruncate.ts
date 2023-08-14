import { useCallback, useRef, useState } from "react";

export default function useVariableTruncate(size: number) {
  const containerRef = useRef<HTMLElement | null>(null);
  const itemsRef = useRef<(HTMLElement | null)[]>([]);
  const drawerRef = useRef<HTMLElement | null>(null);

  const [drawerOffset, setDrawerOffset] = useState<number | null>(null);
  const [overflowIndex, setOverflowIndex] = useState<number | null>(null);

  // Iterates through each item checking if it is outside the bounds of its
  // parent. If one is found, then overflow index is set to its index, and
  // it and all itemss after it are hidden. To position the drawer correctly, we
  // sum up width (and margin) of each visable item and then position the drawer
  // with that offset.
  const updateTruncation = useCallback(() => {
    if (!containerRef.current || !drawerRef.current) {
      return;
    }
    const containerRect = containerRef.current.getBoundingClientRect();
    const drawerRect = drawerRef.current.getBoundingClientRect();
    let offset = 0;

    for (let i = 0; i < size; i++) {
      const el = itemsRef.current[i];
      if (!el) {
        continue;
      }

      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);

      const margin =
        parseFloat(styles.marginRight) + parseFloat(styles.marginLeft);

      if (
        offset + rect.width + margin >
        containerRect.width -
          (overflowIndex === null || i === size - 1
            ? 0
            : drawerRect.width + margin)
      ) {
        setOverflowIndex(i);
        setDrawerOffset(offset);

        return;
      }

      offset += rect.width + margin;
    }

    setOverflowIndex(null);
  }, [overflowIndex, size]);

  return {
    updateTruncation,
    overflowIndex,
    drawerOffset,
    containerRef,
    itemsRef,
    drawerRef,
  };
}
