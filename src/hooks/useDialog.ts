import {
  useFloating,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
} from "@floating-ui/react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type DialogOptions = {
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

export function useDialogProvider({ onOpenChange, ...rest }: DialogOptions) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(
    "initialOpen" in rest ? rest.initialOpen : false,
  );

  const open = rest.controlled ? rest.isOpen : uncontrolledOpen;
  const setOpen = useCallback(
    (isOpen: boolean) => {
      onOpenChange?.(isOpen);
      if (!rest.controlled) {
        setUncontrolledOpen(isOpen);
      }
    },
    [rest.controlled],
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
    [open, setOpen, interactions, data],
  );
}

type ContextType = ReturnType<typeof useDialogProvider> | null;

export const DialogContext = createContext<ContextType>(null);

export function useDialog() {
  const context = useContext(DialogContext);

  if (context == null) {
    throw new Error("Dialog components must be wrapped in <Dialog />");
  }

  return context;
}
