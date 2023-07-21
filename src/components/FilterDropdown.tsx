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
import Filter, { Props as FilterProps } from "./Filter";

export interface Props extends FilterProps {
  onClose?: () => void;
  onDisable?: () => void;
  className?: string;
  inline?: boolean;
}

export default function FilterDropdown({
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
      <Filter
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
