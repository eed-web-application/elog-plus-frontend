import { useEffect, useState } from "react";

// Should be the same width as Tailwind's md
// eslint-disable-next-line react-refresh/only-export-components
const MD = 768;
// eslint-disable-next-line react-refresh/only-export-components
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
