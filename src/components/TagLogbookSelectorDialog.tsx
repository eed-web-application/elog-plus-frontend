import { ComponentPropsWithRef, forwardRef, useState } from "react";
import { twJoin, twMerge } from "tailwind-merge";
import { Button, Checkbox, Modal, CheckboxLabel, TextButton } from "./base";
import { Logbook } from "../api";

export interface Props extends ComponentPropsWithRef<"div"> {
  tag: string;
  logbooks: Logbook[];
  onSave: (logbooks: string[]) => void;
  onClose: () => void;
}

const TagLogbookSelectorDialog = forwardRef<HTMLDivElement, Props>(
  function TagLogbookSelectorDialog(
    { tag, logbooks, onSave, onClose, className, ...rest },
    ref
  ) {
    const [selected, setSelected] = useState<string[]>([]);

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
              key={logbook.id}
              className={twJoin(
                CheckboxLabel,
                "flex items-center uppercase text-gray-500"
              )}
            >
              <input
                type="checkbox"
                className={twJoin(Checkbox, "mr-2")}
                checked={selected.includes(logbook.id)}
                onChange={() =>
                  setSelected((selected) =>
                    selected.includes(logbook.id)
                      ? selected.filter((id) => id !== logbook.id)
                      : [...selected, logbook.id]
                  )
                }
              />
              {logbook.name}
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
            disabled={selected.length === 0}
            onClick={selected.length === 0 ? undefined : () => onSave(selected)}
          >
            Save
          </button>
        </div>
      </div>
    );
  }
);

export default TagLogbookSelectorDialog;
