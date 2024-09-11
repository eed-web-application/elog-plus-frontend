import { createContext } from "react";
import { Entry } from "./api";

/**
 * Set the current spotlighted entry.
 */
const SpotlightContext = createContext<((entry: Entry) => void) | null>(null);

export default SpotlightContext;
