import { PropsWithChildren } from "react";
import Dialog from "../Dialog";
import { Button, TextButton } from "../base";
import { useDialog } from "../../hooks/useDialog";

export type Props = PropsWithChildren<{
  title: string;
  onSave?: () => void;
}>;

export default function NewAdminResourceDialog({
  title,
  onSave,
  children,
}: Props) {
  const { setOpen } = useDialog();

  return (
    <Dialog.Window
      as="form"
      className="w-full max-w-sm"
      onSubmit={(e) => {
        e.preventDefault();
        onSave?.();
        setOpen(false);
      }}
    >
      <Dialog.Section>
        <h1 className="text-lg">{title}</h1>
      </Dialog.Section>
      <Dialog.Section>{children}</Dialog.Section>
      <Dialog.Section className="flex gap-3 justify-end">
        <button
          type="button"
          className={TextButton}
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
        <input
          value="Save"
          type="submit"
          className={Button}
          disabled={!onSave}
        />
      </Dialog.Section>
    </Dialog.Window>
  );
}
