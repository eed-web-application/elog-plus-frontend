import { useMemo } from "react";
import debounce from "../utils/debounce";

export default function useDebounce<A extends unknown[]>(
  func: (...args: A) => void,
  timeout: number,
): (...args: A) => void {
  return useMemo(() => debounce(func, timeout), [func, timeout]);
}
