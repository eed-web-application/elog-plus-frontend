import { useCallback, useState } from "react";

export default function useTruncate({
  count,
  itemWidth,
  drawerWidth,
  getMaxWidth,
}: {
  count: number;
  itemWidth: number;
  drawerWidth: number;
  getMaxWidth: () => number;
}) {
  const [overflowIndex, setOverflowIndex] = useState<number | null>(null);
  const [width, setWidth] = useState<number | null>(null);

  const updateTruncation = useCallback(() => {
    const maxWidth = getMaxWidth();

    for (let i = 0; i < count; i++) {
      if (
        itemWidth * (i + 1) + (i === count - 1 ? 0 : drawerWidth) >
        maxWidth
      ) {
        setOverflowIndex(i);
        setWidth(itemWidth * i + drawerWidth);

        return;
      }
    }
    setOverflowIndex(null);
    setWidth(count * itemWidth);
  }, [itemWidth, count, getMaxWidth, drawerWidth]);

  return {
    updateTruncation,
    overflowIndex,
    width,
  };
}
