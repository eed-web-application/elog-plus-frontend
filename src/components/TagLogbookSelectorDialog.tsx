import { ComponentPropsWithRef, forwardRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { BackDrop, Button, Modal, Radio, RadioLabel, TextButton } from "./base";
import {
  FloatingFocusManager,
  FloatingOverlay,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useMergeRefs,
  useRole,
} from "@floating-ui/react";

export interface Props extends ComponentPropsWithRef<"div"> {
  tag: string;
  logbooks: string[];
  onSave: (logbook: string) => void;
  onClose: () => void;
}

const TagLogbookSelectorDialog = forwardRef<HTMLDivElement, Props>(
  function TagLogbookSelectorDialog(
    { tag, logbooks, onSave, onClose, className, ...rest },
    ref
  ) {
    const [selected, setSelected] = useState<string | null>(null);

    return (
      <div
        ref={ref}
        className={twMerge(Modal, "max-w-md w-full", className)}
        {...rest}
      >
        <h1 className="p-6 pt-5 pb-3 border-b text-xl">
          Save tag <span className="text-gray-500">{tag}</span> in
        </h1>
        <div className="max-h-48 overflow-y-auto px-6 py-3 gap-2 flex flex-col">
          {logbooks.map((logbook) => (
            <label
              key={logbook}
              className={twMerge(
                RadioLabel,
                "flex items-center uppercase text-gray-500"
              )}
            >
              <input
                type="radio"
                className={Radio}
                checked={selected === logbook}
                onChange={() => setSelected(logbook)}
              />
              {logbook}
            </label>
          ))}
        </div>
        <div className="flex gap-3 justify-end p-3 border-t">
          <button
            type="button"
            className={TextButton}
            onClick={() => onClose()}
          >
            Cancel
          </button>
          <button
            type="button"
            className={Button}
            disabled={selected === null}
            onClick={selected ? () => onSave(selected) : undefined}
          >
            Save
          </button>
        </div>
      </div>
    );
  }
);

export default TagLogbookSelectorDialog;
