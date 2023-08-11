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
  registerListener: (listener: () => void) => void;
  removeListener: (listener: () => void) => void;
};

const ResizeManagerContext = createContext<Context>(null);

/**
 * All calls to `useOnResize` will run their listener when `observe` is resized
 * superseding its default functionality.
 */
export function useResizeObserver(observe: HTMLElement | null) {
  const listenersRef = useRef<(() => void)[]>([]);

  const onResize = useCallback(() => {
    listenersRef.current.forEach((listener) => listener());
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
            registerListener: (listener: () => void) =>
              listenersRef.current.push(listener),
            removeListener: (listener: () => void) => {
              const index = listenersRef.current.findIndex(listener);

              if (index !== -1) {
                listenersRef.current.splice(index, 1);
              }
            },
          },
        },
        props.children
      ),
    []
  );
}

/**
 * Runs `listener` when the element `observe` resizes. However, if a parent
 * uses the hook useResizeObserver, then `listener` will only run when that
 * component resizes.
 */
export function useOnResize(listener: () => void, observe?: HTMLElement) {
  const context = useContext(ResizeManagerContext);

  const registerListener = context?.registerListener;
  const removeListener = context?.registerListener;

  useEffect(() => {
    if (registerListener && removeListener) {
      registerListener(listener);

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
  }, [registerListener, removeListener, observe, listener]);
}
