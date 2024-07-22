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

export default function NewLogbookDialog({ onClose, ...rest }: Props) {
  const [name, setName] = useState("");

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  function onClosed() {
    onClose();
    setName("");
  }

  const saveLogbook = useCallback(async () => {
    if (!name) {
      return;
    }

    const logbookId = await createLogbook(name);
    navigate(`/admin/logbooks/${logbookId}`);
    setName("");
    queryClient.invalidateQueries({ queryKey: ["logbooks"] });
  }, [name, navigate, queryClient]);

  return (
    <NewAdminResourceDialog
      {...rest}
      onClose={onClosed}
      title="New logbook"
      form={
        <label className="block mb-2 text-gray-500">
          Name
          <input
            required
            value={name}
            className={twJoin(Input, "w-full block")}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
      }
      onSave={name ? saveLogbook : undefined}
    />
  );
}
