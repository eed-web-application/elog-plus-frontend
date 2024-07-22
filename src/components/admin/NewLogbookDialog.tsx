import { useCallback, useState } from "react";
import NewAdminResourceDialog, {
  Props as NewAdminResourceDialogProps,
} from "./NewResourceDialog";
import { twJoin } from "tailwind-merge";
import { Input } from "../base";
import { createLogbook } from "../../api";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

export type Props = Omit<
  NewAdminResourceDialogProps,
  "title" | "form" | "onSave"
>;

export default function NewLogbookDialog({ setIsOpen, ...rest }: Props) {
  const [newLogbookName, setNewLogbookName] = useState<string>("");

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  function onIsOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) {
      setNewLogbookName("");
    }
  }

  const saveLogbook = useCallback(async () => {
    if (!newLogbookName) {
      return;
    }

    const logbookId = await createLogbook(newLogbookName);
    navigate(`/admin/logbooks/${logbookId}`);
    setNewLogbookName("");
    queryClient.invalidateQueries({ queryKey: ["logbooks"] });
  }, [newLogbookName, navigate, queryClient]);

  return (
    <NewAdminResourceDialog
      {...rest}
      setIsOpen={onIsOpenChange}
      title="New logbook"
      form={
        <label className="block mb-2 text-gray-500">
          Name
          <input
            required
            value={newLogbookName || ""}
            className={twJoin(Input, "w-full block")}
            onChange={(e) => setNewLogbookName(e.target.value)}
          />
        </label>
      }
      onSave={newLogbookName ? saveLogbook : undefined}
    />
  );
}
