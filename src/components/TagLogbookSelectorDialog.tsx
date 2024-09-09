import { useState } from "react";
import { twJoin } from "tailwind-merge";
import { Checkbox, CheckboxLabel } from "./base";
import { Logbook } from "../api";
import Dialog from "./Dialog";
import { useDialog } from "../hooks/useDialog";
import Button from "./Button";

export interface Props {
  tag: string;
  logbooks: Logbook[];
  onSelect: (logbooks: string[]) => void;
}

export default function TagLogbookSelectorDialog({
  onSelect,
  logbooks,
  tag,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const { setOpen } = useDialog();

  return (
    <Dialog.Window className="w-full max-w-md">
      <Dialog.Section className="text-xl">
        Save tag <span className="text-gray-500">{tag}</span> in
      </Dialog.Section>
      <Dialog.Section className="flex overflow-y-auto flex-col gap-2 max-h-48">
        {logbooks.map((logbook) => (
          <label
            key={logbook.id}
            className={twJoin(
              CheckboxLabel,
              "flex items-center uppercase text-gray-500",
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
                    : [...selected, logbook.id],
                )
              }
            />
            {logbook.name}
          </label>
        ))}
      </Dialog.Section>
      <Dialog.Section className="flex gap-3 justify-end">
        <Button type="button" variant="text" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={selected.length === 0}
          onClick={() => {
            onSelect(selected);
            setOpen(false);
          }}
        >
          Save
        </Button>
      </Dialog.Section>
    </Dialog.Window>
  );
}
