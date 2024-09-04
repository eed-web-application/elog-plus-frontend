import { useEffect, useState } from "react";

// Should be the same width as Tailwind's md
const MD = 768;
const QUERY = `(min-width: ${MD}px)`;

export default function useIsSmallScreen() {
  const [isSmallScreen, setIsSmallScreen] = useState(
    !window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    function handler(e: MediaQueryListEvent) {
      setIsSmallScreen(!e.matches);
    }

    window.matchMedia(QUERY).addEventListener("change", handler);
    return () => {
      window.matchMedia(QUERY).removeEventListener("change", handler);
    };
  }, []);

  return isSmallScreen;
}
