import { PropsWithChildren, ReactNode } from "react";
import Dialog from "../Dialog";
import { Button, TextButton } from "../base";

export type Props = PropsWithChildren<{
  isOpen: boolean;
  title: string;
  form: ReactNode;
  onClose: () => void;
  onSave?: () => void;
}>;

export default function NewAdminResourceDialog({
  isOpen,
  title,
  form,
  onClose,
  onSave,
  children,
}: Props) {
  return (
    <Dialog
      controlled
      isOpen={isOpen}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      {children}
      <Dialog.Content
        as="form"
        className="w-full max-w-sm"
        onSubmit={(e) => {
          e.preventDefault();
          onSave?.();
          onClose();
        }}
      >
        <Dialog.Section>
          <h1 className="text-lg">{title}</h1>
        </Dialog.Section>
        <Dialog.Section>{form}</Dialog.Section>
        <Dialog.Section className="flex gap-3 justify-end">
          <button type="button" className={TextButton} onClick={onClose}>
            Cancel
          </button>
          <input
            value="Save"
            type="submit"
            className={Button}
            disabled={!onSave}
          />
        </Dialog.Section>
      </Dialog.Content>
    </Dialog>
  );
}
