import {
  useFloating,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  useMergeRefs,
  FloatingPortal,
  FloatingFocusManager,
  FloatingOverlay,
} from "@floating-ui/react";
import { BackDrop, IconButton } from "./base";
import { twJoin, twMerge } from "tailwind-merge";
import {
  ComponentPropsWithoutRef,
  ElementType,
  PropsWithChildren,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type DialogOptions = {
  onOpenChange?: (open: boolean) => void;
} & (
  | {
      controlled?: false;
      initialOpen?: boolean;
    }
  | {
      controlled: true;
      isOpen?: boolean;
    }
);

export function useDialog({ onOpenChange, ...rest }: DialogOptions) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(
    "initialOpen" in rest ? rest.initialOpen : false
  );

  const open = rest.controlled ? rest.isOpen : uncontrolledOpen;
  const setOpen = useCallback(
    (isOpen: boolean) => {
      onOpenChange?.(isOpen);
      if (!rest.controlled) {
        setUncontrolledOpen(isOpen);
      }
    },
    [rest.controlled]
  );

  const data = useFloating({
    open,
    onOpenChange: setOpen,
  });

  const context = data.context;

  const click = useClick(context, {
    enabled: !rest.controlled,
  });
  const dismiss = useDismiss(context, { outsidePressEvent: "mousedown" });
  const role = useRole(context);

  const interactions = useInteractions([click, dismiss, role]);

  return useMemo(
    () => ({
      open,
      setOpen,
      ...interactions,
      ...data,
    }),
    [open, setOpen, interactions, data]
  );
}

type ContextType = ReturnType<typeof useDialog> | null;

const DialogContext = createContext<ContextType>(null);

function useDialogContext() {
  const context = useContext(DialogContext);

  if (context == null) {
    throw new Error("Dialog components must be wrapped in <Dialog />");
  }

  return context;
}

export type Props = {
  children: React.ReactNode;
} & DialogOptions;

function Dialog({ children, ...options }: Props) {
  const dialog = useDialog(options);

  return (
    <DialogContext.Provider value={dialog}>{children}</DialogContext.Provider>
  );
}

export const DialogTrigger = forwardRef<HTMLElement, PropsWithChildren<{}>>(
  function DialogTrigger({ children, ...props }, propRef) {
    const context = useDialogContext();
    const childrenRef = (children as any).ref;

    const ref = useMergeRefs([context.refs.setReference, propRef, childrenRef]);

    if (!isValidElement(children)) {
      throw new Error("Dialog.Trigger requires a single valid child");
    }

    return cloneElement(
      children,
      context.getReferenceProps({
        ref,
        ...props,
        ...children.props,
      })
    );
  }
);

export type ContentProps<T extends ElementType> = {
  showCloseButton?: boolean;
  as?: T;
};

function DialogContent<T extends ElementType = "div">({
  showCloseButton = false,
  className,
  as,
  children,
  ...rest
}: ContentProps<T> & ComponentPropsWithoutRef<T>) {
  const { context: floatingContext, ...context } = useDialogContext();

  const Component = as ?? "div";

  if (!floatingContext.open) {
    return null;
  }

  return (
    <FloatingPortal>
      <FloatingOverlay
        lockScroll
        className={twJoin(BackDrop, "z-20 flex justify-center items-center")}
      >
        <FloatingFocusManager context={floatingContext}>
          <Component
            ref={context.refs.setFloating}
            className={twMerge(
              "relative bg-white rounded-lg shadow-lg outline-none divide-y py-2",
              className
            )}
            {...context.getFloatingProps(rest)}
          >
            {children}
            {showCloseButton && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                tabIndex={0}
                className={twJoin(IconButton, "absolute top-0 left-0 m-1")}
                onClick={() => context.setOpen(false)}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </Component>
        </FloatingFocusManager>
      </FloatingOverlay>
    </FloatingPortal>
  );
}

const DialogSection = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(function DialogBody({ children, className, ...rest }, ref) {
  return (
    <div ref={ref} className={twMerge("px-6 py-3", className)} {...rest}>
      {children}
    </div>
  );
});

Dialog.Trigger = DialogTrigger;
Dialog.Content = DialogContent;
Dialog.Section = DialogSection;

export default Dialog as typeof Dialog & {
  Trigger: typeof DialogTrigger;
  Content: typeof DialogContent;
  Section: typeof DialogSection;
};
