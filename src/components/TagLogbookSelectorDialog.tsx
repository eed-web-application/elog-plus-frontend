import { ComponentPropsWithRef, useState } from "react";
import { twJoin } from "tailwind-merge";
import { Button, Checkbox, CheckboxLabel, TextButton } from "./base";
import { Logbook } from "../api";
import Dialog from "./Dialog";

export type Props = ComponentPropsWithRef<"div"> & {
  onSave: (logbooks: string[]) => void;
  onClose: () => void;
} & (
    | {
        isOpen: true;
        tag: string;
        logbooks: Logbook[];
      }
    | { isOpen?: false }
  );

export default function TagLogbookSelectorDialog({
  onSave,
  onClose,
  className,
  ...rest
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const tag = rest.isOpen ? rest.tag : "";
  const logbooks = rest.isOpen ? rest.logbooks : [];

  return (
    <Dialog
      controlled
      isOpen={rest.isOpen}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <Dialog.Content className="max-w-md w-full">
        <Dialog.Section className="text-xl">
          Save tag <span className="text-gray-500">{tag}</span> in
        </Dialog.Section>
        <Dialog.Section className="max-h-48 overflow-y-auto gap-2 flex flex-col">
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
        </Dialog.Section>
        <Dialog.Section className="flex gap-3 justify-end">
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
        </Dialog.Section>
      </Dialog.Content>
    </Dialog>
  );
}
