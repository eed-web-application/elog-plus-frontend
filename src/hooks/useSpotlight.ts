import { useCallback, useContext } from "react";
import { Entry } from "../api";
import SpotlightContext from "../SpotlightContext";

export default function useSpotlight(entry: Entry) {
  const setSpotlight = useContext(SpotlightContext);

  return useCallback(() => {
    setSpotlight?.(entry);
  }, [entry, setSpotlight]);
}
