import {
  useMergeRefs,
  FloatingPortal,
  FloatingFocusManager,
  FloatingOverlay,
} from "@floating-ui/react";
import { BackDrop } from "./base";
import { twJoin, twMerge } from "tailwind-merge";
import {
  ComponentPropsWithoutRef,
  ElementType,
  PropsWithChildren,
  cloneElement,
  forwardRef,
  isValidElement,
} from "react";
import {
  DialogContext,
  DialogOptions,
  useDialogProvider,
  useDialog,
} from "../hooks/useDialog";
import Button from "./Button";

export type Props = {
  children: React.ReactNode;
} & DialogOptions;

function Dialog({ children, ...options }: Props) {
  const dialog = useDialogProvider(options);

  return (
    <DialogContext.Provider value={dialog}>{children}</DialogContext.Provider>
  );
}

const DialogTrigger = forwardRef<HTMLElement, PropsWithChildren<unknown>>(
  function DialogTrigger({ children, ...props }, propRef) {
    const context = useDialog();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      }),
    );
  },
);

function DialogContent({
  children,
  returnFocus = true,
}: {
  children: JSX.Element;
  returnFocus?: boolean;
}) {
  const { context: floatingContext } = useDialog();

  if (!floatingContext.open) {
    return null;
  }

  return (
    <FloatingPortal>
      <FloatingOverlay
        lockScroll
        className={twJoin(BackDrop, "z-20 flex justify-center items-center")}
      >
        <FloatingFocusManager
          returnFocus={returnFocus}
          context={floatingContext}
        >
          {children}
        </FloatingFocusManager>
      </FloatingOverlay>
    </FloatingPortal>
  );
}

export type WindowProps<T extends ElementType> = {
  showCloseButton?: boolean;
  as?: T;
} & ComponentPropsWithoutRef<T>;

function DialogWindow<T extends ElementType = "div">({
  showCloseButton = false,
  className,
  as,
  children,
  ...rest
}: WindowProps<T>) {
  const { refs, getFloatingProps, setOpen } = useDialog();

  const Component = as ?? "div";

  return (
    <Component
      ref={refs.setFloating}
      className={twMerge(
        "relative bg-white rounded-lg shadow-lg outline-none divide-y py-2",
        className,
      )}
      {...getFloatingProps(rest)}
    >
      {children}
      {showCloseButton && (
        <Button
          variant="icon"
          className="absolute top-0 right-0 border-none m-1"
          onClick={() => setOpen(false)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </Button>
      )}
    </Component>
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
Dialog.Window = DialogWindow;
Dialog.Section = DialogSection;

export default Dialog as typeof Dialog & {
  Trigger: typeof DialogTrigger;
  Content: typeof DialogContent;
  Window: typeof DialogWindow;
  Section: typeof DialogSection;
};
