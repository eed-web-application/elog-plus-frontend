import { PropsWithChildren, ReactNode } from "react";
import Dialog from "./Dialog";
import { Button, TextButton } from "./base";

export type Props = PropsWithChildren<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  title: string;
  form: ReactNode;
  onSave?: () => void;
  onCancel?: () => void;
}>;

export default function NewAdminResourceDialog({
  isOpen,
  setIsOpen,
  title,
  form,
  onSave,
  children,
}: Props) {
  return (
    <Dialog controlled isOpen={isOpen}>
      {children}
      <Dialog.Content
        as="form"
        className="w-full max-w-sm"
        onSubmit={(e) => {
          e.preventDefault();
          onSave?.();
          setIsOpen(false);
        }}
      >
        <Dialog.Section>
          <h1 className="text-lg">{title}</h1>
        </Dialog.Section>
        <Dialog.Section>{form}</Dialog.Section>
        <Dialog.Section className="flex gap-3 justify-end">
          <button
            type="button"
            className={TextButton}
            onClick={() => setIsOpen(false)}
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
      </Dialog.Content>
    </Dialog>
  );
}
