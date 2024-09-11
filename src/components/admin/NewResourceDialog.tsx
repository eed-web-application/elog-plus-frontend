import { PropsWithChildren } from "react";
import Dialog from "../Dialog";
import { useDialog } from "../../hooks/useDialog";
import Button from "../Button";

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
        <Button variant="text" type="button" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button value="Save" type="submit" disabled={!onSave}>
          Save
        </Button>
      </Dialog.Section>
    </Dialog.Window>
  );
}
