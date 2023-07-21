import { useContext } from "react";
import IsPaneFullscreen from "../IsPaneFullscreenContext";

export default function useSpotlightProps(entryId: string) {
  const isPaneFullscreen = useContext(IsPaneFullscreen);

  return {
    // If the pane is fullscreen, then we want to close it
    // which can be done by redirecting to the root: `/`.
    to: {
      pathname: isPaneFullscreen ? "/" : undefined,
      search: window.location.search,
    },
    replace: !isPaneFullscreen,
    state: { spotlight: entryId },
  };
}
