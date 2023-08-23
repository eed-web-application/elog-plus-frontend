import {
  PropsWithChildren,
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";

type Context = null | {
  registerListener: (listener: () => void, key?: string) => void;
  removeListener: (listener: () => void) => void;
  triggerResize: (key: string) => void;
};

const ResizeManagerContext = createContext<Context>(null);

let idCounter = 0;

/**
 * All calls to `useOnResize` will run their listener when `observe` is resized
 * superseding its default functionality.
 */
export function useResizeObserver(observe: HTMLElement | null) {
  const listenersRef = useRef<Record<string, () => void>>({});

  const onResize = useCallback(() => {
    Object.values(listenersRef.current).forEach((listener) => listener());
  }, []);

  const triggerResize = useCallback((key: string) => {
    listenersRef.current[key]();
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

  return useCallback(
    (props: PropsWithChildren<unknown>) =>
      createElement(
        ResizeManagerContext.Provider,
        {
          ...props,
          value: {
            registerListener: (listener, key) => {
              if (key) {
                listenersRef.current[key] = listener;
              } else {
                listenersRef.current[`_${idCounter}`] = listener;
                idCounter++;
              }
            },
            removeListener: (listener: () => void) => {
              const pair = Object.entries(listenersRef.current).find(
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                ([_, otherListener]) => otherListener === listener
              );

              if (pair !== undefined) {
                delete listenersRef.current[pair[0]];
              }
            },
            triggerResize,
          },
        },
        props.children
      ),
    [triggerResize]
  );
}

/**
 * Runs `listener` when the element `observe` resizes. However, if a parent
 * uses the hook useResizeObserver, then `listener` will only run when that
 * component resizes.
 */
export function useOnResize(
  listener: () => void,
  observe?: HTMLElement,
  key?: string
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
