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
  ReferenceType,
} from "@floating-ui/react";
import React, {
  createContext,
  isValidElement,
  useContext,
  useId,
  useRef,
  useState,
} from "react";

const ARROW_HEIGHT = 7;
const GAP = 2;
const DEFAULT_DELAY = 200;

type ContextType = {
  setPositionReference: (node: ReferenceType | null) => void;
} | null;

const DialogContext = createContext<ContextType>(null);

/**
 * Shows tooltip when child is hovered. Only one child allowed.
 */
function Tooltip({
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
        padding: 8, // rounded-lg is 8px
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
    throw new Error("Tooltip requires a single valid child");
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
      <DialogContext.Provider
        value={{ setPositionReference: refs.setPositionReference }}
      >
        {React.cloneElement(
          child,
          getReferenceProps({
            ref: refs.setReference,
          }),
        )}
      </DialogContext.Provider>
      {isOpen && !disabled && (
        <FloatingPortal>
          <div
            className="py-2 px-3 text-sm font-medium bg-white border border-gray-200 text-gray-900 rounded-lg shadow-sm transition-opacity duration-300"
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              visibility: middlewareData.hide?.referenceHidden
                ? "hidden"
                : "visible",
              zIndex: 120,
            }}
            id={id}
            {...getFloatingProps()}
          >
            {label}
            <FloatingArrow
              ref={arrowRef}
              context={context}
              height={ARROW_HEIGHT}
              fill="white"
              stroke="#E5E7EB"
              strokeWidth={0.5}
              className="drop-shadow-sm"
            />
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

Tooltip.PositionReference = function TooltipPositionReference({
  children,
}: {
  children: React.ReactElement;
}) {
  const context = useContext(DialogContext);

  if (!isValidElement(children)) {
    throw new Error("Tooltip.PositionReference requires a single valid child");
  }

  if (!context) {
    return null;
  }

  return React.cloneElement(children, {
    ref: context.setPositionReference,
  } as Record<string, unknown>);
};

export default Tooltip;
