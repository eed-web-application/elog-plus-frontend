import { useContext } from "react";
import IsPaneFullscreen from "../IsPaneFullscreenContext";
import { Entry } from "../api";
import { LinkProps } from "react-router-dom";
import SpotlightContext from "../SpotlightContext";

/**
 * Props passed to a Link component that will spotlight `entry`.
 */
export default function useSpotlightProps(entry: Entry): LinkProps {
  const isPaneFullscreen = useContext(IsPaneFullscreen);
  const setSpotlight = useContext(SpotlightContext);

  return {
    // If the pane is fullscreen, then we want to close it
    // which can be done by redirecting to the root: `/`.
    to: {
      pathname: isPaneFullscreen ? "/" : undefined,
      search: window.location.search,
      hash: window.location.hash,
    },
    replace: !isPaneFullscreen,
    onClick: (e: React.MouseEvent) => {
      if (!isPaneFullscreen) {
        e.preventDefault();
      }

      setSpotlight?.(entry);
    },
  };
}
