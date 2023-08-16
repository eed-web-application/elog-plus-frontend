import {
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  useFloating,
  FloatingOverlay,
  FloatingFocusManager,
} from "@floating-ui/react";
import { useCallback, useState } from "react";
import { twJoin } from "tailwind-merge";
import { BackDrop } from "../components/base";
import TagLogbookSelectorDialog from "../components/TagLogbookSelectorDialog";
import { Logbook } from "../api";

export default function useTagLogbookSelector() {
  const [tag, setTag] = useState<string | null>(null);
  const [logbooks, setLogbooks] = useState<Logbook[] | null>(null);
  const [onSave, setOnSave] = useState<
    ((logbook: string | null) => void) | null
  >(null);

  const select = useCallback(async (tag: string, logbooks: Logbook[]) => {
    setTag(tag);
    setLogbooks(logbooks);

    return new Promise<string>((resolve) => setOnSave(() => resolve));
  }, []);

  const isOpen = tag && logbooks && onSave;

  function close() {
    setTag(null);
    setLogbooks(null);
    setOnSave(null);
  }

  const { refs, context } = useFloating({
    open: Boolean(isOpen),
    onOpenChange: (isOpen) => {
      if (!isOpen) {
        close();
      }
    },
  });

  const click = useClick(context);
  const dismiss = useDismiss(context, {
    outsidePressEvent: "mousedown",
  });
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  const Dialog = !isOpen ? undefined : (
    <FloatingOverlay
      lockScroll
      className={twJoin(BackDrop, "z-10 flex justify-center items-center")}
    >
      <FloatingFocusManager context={context}>
        <TagLogbookSelectorDialog
          ref={refs.setFloating}
          tag={tag}
          logbooks={logbooks}
          onSave={(logbook) => {
            close();
            onSave(logbook);
          }}
          onClose={() => {
            close();
            onSave(null);
          }}
          {...getFloatingProps()}
        />
      </FloatingFocusManager>
    </FloatingOverlay>
  );

  return { getReferenceProps, select, Dialog };
}
