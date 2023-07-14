import { useEffect, useState } from "react";

// Should be the small width as Tailwind's sm
// eslint-disable-next-line react-refresh/only-export-components
const SM = 640;
// eslint-disable-next-line react-refresh/only-export-components
const QUERY = `(min-width: ${SM}px)`;

export default function useIsSmallScreen() {
  const [isSmallScreen, setIsSmallScreen] = useState(
    !window.matchMedia(QUERY).matches
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
