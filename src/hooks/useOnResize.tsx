import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

type Context = null | {
  registerListener: (listener: () => void, key: string) => void;
  removeListener: (listener: () => void) => void;
  triggerResize: (key: string) => void;
};

const ResizeManagerContext = createContext<Context>(null);

/**
 * All calls to `useOnResize` will run their listener when `observe` is resized
 * superseding its default functionality.
 */
export function useResizeObserver(observe: HTMLElement | null) {
  const listenersRef = useRef<Record<string, (() => void)[]>>({});

  const onResize = useCallback(() => {
    Object.values(listenersRef.current)
      .flat()
      .forEach((listener) => listener());
  }, []);

  const triggerResize = useCallback((key: string) => {
    listenersRef.current[key]?.forEach((listener) => listener());
  }, []);

  useEffect(() => {
    if (!observe) {
      return;
    }

    const observer = new ResizeObserver(onResize);
    observer.observe(observe);

    return () => {
      observer.unobserve(observe);
      observer.disconnect();
    };
  }, [onResize, observe]);

  const value = useMemo<Context>(
    () => ({
      registerListener: (listener, key) => {
        if (listenersRef.current[key]) {
          listenersRef.current[key].push(listener);
        } else {
          listenersRef.current[key] = [listener];
        }
      },
      removeListener: (listener: () => void) => {
        for (const key in listenersRef.current) {
          listenersRef.current[key] = listenersRef.current[key].filter(
            (handler) => handler !== listener,
          );
        }
      },
      triggerResize,
    }),
    [triggerResize],
  );

  return useCallback(
    (props: PropsWithChildren<unknown>) => (
      <ResizeManagerContext.Provider {...props} value={value} />
    ),
    [value],
  );
}

/**
 * Runs `listener` when the element `observe` resizes. However, if a parent
 * uses the hook useResizeObserver, then `listener` will only run when that
 * component resizes.
 */
export function useOnResize(
  listener: () => void,
  key: string,
  observe?: HTMLElement,
) {
  const context = useContext(ResizeManagerContext);

  const registerListener = context?.registerListener;
  const removeListener = context?.removeListener;

  useEffect(() => {
    if (registerListener && removeListener) {
      registerListener(listener, key);

      return () => removeListener(listener);
    }

    // Fallback
    if (observe) {
      const observer = new ResizeObserver(() => {
        listener();
      });

      observer.observe(observe);

      return () => {
        observer.unobserve(observe);
        observer.disconnect();
      };
    }
  }, [registerListener, removeListener, observe, listener, key]);
}

export function useTriggerResize(key: string) {
  const context = useContext(ResizeManagerContext);

  const triggerResize = context?.triggerResize;

  return useCallback(() => triggerResize?.(key), [key, triggerResize]);
}
