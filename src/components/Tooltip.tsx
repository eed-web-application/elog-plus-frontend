import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useDelayGroup,
  useDelayGroupContext,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
  FloatingArrow,
  arrow,
  Placement,
  hide,
} from "@floating-ui/react";
import React, { useId, useRef, useState } from "react";

const ARROW_HEIGHT = 7;
const GAP = 2;
const DEFAULT_DELAY = 200;

/**
 * Shows tooltip when child is hovered. Only one child allowed.
 */
export default function Tooltip({
  children,
  label,
  placement,
  disabled,
}: {
  children: React.ReactElement;
  label: string;
  placement?: Placement;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const arrowRef = useRef(null);

  const { refs, floatingStyles, context, middlewareData } = useFloating({
    placement: placement || "top",
    open: isOpen && !disabled,
    onOpenChange: setIsOpen,
    middleware: [
      offset(ARROW_HEIGHT + GAP),
      flip(),
      shift(),
      arrow({
        element: arrowRef,
      }),
      hide(),
    ],
    whileElementsMounted: autoUpdate,
  });

  const { delay } = useDelayGroupContext();

  const id = useId();
  const hover = useHover(context, {
    move: false,
    // Even when not in a delay group, delay will be zero, so we use || instead
    // of ??.
    delay: delay || DEFAULT_DELAY,
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });
  useDelayGroup(context, { id });

  const child = React.Children.only(children);

  if (!React.isValidElement(child)) {
    throw new Error("Tooltip.Tripper requires a single valid child");
  }

  // Merge all the interactions into prop getters
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  return (
    <>
      {React.cloneElement(
        child,
        getReferenceProps({
          ref: refs.setReference,
        }),
      )}
      {isOpen && !disabled && (
        <FloatingPortal>
          <div
            className="z-10 py-2 px-3 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm transition-opacity duration-300"
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              visibility: middlewareData.hide?.referenceHidden
                ? "hidden"
                : "visible",
            }}
            id={id}
            {...getFloatingProps()}
          >
            {label}
            <FloatingArrow
              ref={arrowRef}
              context={context}
              height={ARROW_HEIGHT}
            />
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
