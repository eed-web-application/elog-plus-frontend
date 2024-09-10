import { ComponentPropsWithoutRef, forwardRef, useEffect, useRef } from "react";
import Spinner from "./Spinner";

export interface Props extends ComponentPropsWithoutRef<"div"> {
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyLabel?: string;
  onBottomVisible?: () => void;
}

const SelectList = forwardRef<HTMLDivElement, Props>(function SelectList(
  { isLoading, isEmpty, emptyLabel, onBottomVisible, children, ...rest },
  ref,
) {
  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Don't want to fire onBottomVisible when there are no items or when loading.
    if (isEmpty || isLoading || !onBottomVisible) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        if (entries[0]?.isIntersecting) {
          onBottomVisible?.();
        }
      },
    );

    let loader = null;

    if (loaderRef.current) {
      loader = loaderRef.current;
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loader) {
        observer.unobserve(loader);
      }
    };
  }, [onBottomVisible, isEmpty, isLoading]);

  return (
    <div ref={ref} {...rest}>
      {isEmpty && !isLoading ? (
        <div className="py-3 w-full text-center text-gray-500">
          {emptyLabel || "No options"}
        </div>
      ) : (
        <>
          {children}
          <div ref={loaderRef}>
            {isLoading && <Spinner className="my-2 mx-auto" />}
          </div>
        </>
      )}
    </div>
  );
});

export default SelectList;
