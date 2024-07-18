import { twMerge } from "tailwind-merge";
import { PropsWithChildren, useState } from "react";
import {
  useFloating,
  useDismiss,
  useInteractions,
  offset,
  autoUpdate,
  useClick,
  FloatingPortal,
  FloatingFocusManager,
} from "@floating-ui/react";
import FilterChip, { Props as FilterChipProps } from "./FilterChip";

export type Props = FilterChipProps;

export default function FilterChipInput({
  children,
  className,
  ...rest
}: PropsWithChildren<Props>) {
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: open,
    onOpenChange: setOpen,
    placement: "bottom-start",
    middleware: [
      offset(({ rects }) => {
        return -rects.reference.height / 2 - rects.floating.height / 2;
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const dismiss = useDismiss(context);
  const click = useClick(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    dismiss,
    click,
  ]);

  return (
    <>
      <FilterChip
        ref={refs.setReference}
        active={open}
        className={twMerge(
          // It looks weird to have an inline element on top of the button
          // and see the button creep through the side, so we make it invisible.
          open && "invisible",
          className,
        )}
        showDownArrow
        {...rest}
        {...getReferenceProps()}
      />
      {open && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className="z-20"
              {...getFloatingProps()}
            >
              {children}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
}
