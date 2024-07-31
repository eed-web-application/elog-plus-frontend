export default function debounce<A extends unknown[]>(
  func: (...args: A) => void,
  timeout: number,
): (...args: A) => void {
  let timer: number;

  return (...args: A) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, timeout);
  };
}
