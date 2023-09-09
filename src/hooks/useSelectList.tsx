import {
  FloatingContext,
  useFocus,
  useInteractions,
  useListNavigation,
} from "@floating-ui/react";
import { useRef, useState } from "react";

export default function useSelectList({
  open,
  context,
}: {
  open?: boolean;
  context: FloatingContext;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const listRef = useRef<(HTMLElement | null)[]>([]);

  const focus = useFocus(context);
  const listNav = useListNavigation(context, {
    listRef,
    activeIndex,
    onNavigate: open
      ? (index) => {
          if (index !== null) {
            listRef.current[index]?.scrollIntoView({ block: "nearest" });
          }

          setActiveIndex(index);
        }
      : undefined,
    virtual: true,
    focusItemOnHover: true,
    loop: true,
  });

  return { ...useInteractions([focus, listNav]), listRef, activeIndex };
}
