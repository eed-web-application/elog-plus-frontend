import { createContext } from "react";

export type Context = {
  zIndex: number;
  usedHeight: number;
};

/**
 * Since we have multiple sticky headers, we need to keep track of the total
 * used height of all headers and the current z-index. This prevents the headers
 * from overlapping each other and ensures that the headers currently stack.
 */
const StickyEntryRow = createContext<Context>({ zIndex: 100, usedHeight: 0 });

export default StickyEntryRow;
