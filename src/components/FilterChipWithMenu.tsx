import cn from "classnames";
import { PropsWithChildren, useState } from "react";
import {
  useFloating,
  useDismiss,
  useInteractions,
  shift,
  offset,
  autoUpdate,
} from "@floating-ui/react";
import { MouseEvent } from "react";
import FilterChip, { Props as FilterChipProps } from "./FilterChip";

export interface Props extends FilterChipProps {
  onClose?: () => void;
  onDisable?: () => void;
  className?: string;
  /**
   * If the menu should be displayed below the filter (not inlined) or over
   * the filter (inlined)
   */
  inline?: boolean;
}

/**
 * Filter chip with a custom floating menu (supplied by `children`) which is
 * once clicked. The enabled and menu opened states are not the same state
 * (e.g., the menu may be open but the filter disabled).
 */
export default function FilterChipWithMenu({
  children,
  onClose,
  onDisable,
  className,
  inline,
  ...rest
}: PropsWithChildren<Props>) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (isOpen) => {
      if (!isOpen) {
        onClose?.();
      }
      setIsOpen(isOpen);
    },
    placement: "bottom-start",

    middleware: [
      inline
        ? offset(({ rects }) => {
            return -rects.reference.height / 2 - rects.floating.height / 2;
          })
        : shift(),
    ],
    whileElementsMounted: autoUpdate,
  });

  function onClick() {
    if (!isOpen) {
      onClose?.();
    }
    setIsOpen((isOpen) => !isOpen);
  }

  function disable(e: MouseEvent<SVGSVGElement>) {
    e.stopPropagation();
    onDisable?.();
    setIsOpen(false);
  }

  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

  return (
    <>
      <FilterChip
        ref={refs.setReference}
        enabled={isOpen}
        onClick={onClick}
        className={cn(
          // It looks weird to have an inline element on top of the button
          // and see the button creep through the side, so we make it invisible.
          inline && isOpen && "invisible",
          className
        )}
        onDisable={disable}
        showDownArrow
        {...rest}
        {...getReferenceProps()}
      />
      {isOpen && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className={cn(!inline && "my-1", "shadow bg-white rounded-lg")}
          {...getFloatingProps()}
        >
          {children}
        </div>
      )}
    </>
  );
}
