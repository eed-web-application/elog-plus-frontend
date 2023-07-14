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
} from "@floating-ui/react";
import React, { useId, useRef, useState } from "react";

const ARROW_HEIGHT = 7;
const GAP = 2;

export default function Tooltip({
  children,
  label,
  placement,
}: {
  children: React.ReactElement;
  label: string;
  placement?: Placement;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const arrowRef = useRef(null);

  const { refs, floatingStyles, context } = useFloating({
    placement: placement || "top",
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(ARROW_HEIGHT + GAP),
      flip(),
      shift(),
      arrow({
        element: arrowRef,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const { delay } = useDelayGroupContext();

  const hover = useHover(context, { move: false, delay });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });
  const id = useId();
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
        })
      )}
      {isOpen && (
        <FloatingPortal>
          <div
            className="px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm"
            ref={refs.setFloating}
            style={floatingStyles}
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
