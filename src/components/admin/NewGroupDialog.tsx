import { useCallback, useState } from "react";
import NewAdminResourceDialog, {
  Props as NewAdminResourceDialogProps,
} from "./NewResourceDialog";
import { twJoin } from "tailwind-merge";
import { Input } from "../base";
import { createGroup } from "../../api";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

export type Props = Omit<
  NewAdminResourceDialogProps,
  "title" | "form" | "onSave"
>;

export default function NewGroupDialog({ onClose, ...rest }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  function onClosed() {
    onClose();
    setName("");
    setDescription("");
  }

  const saveGroup = useCallback(async () => {
    if (!name) {
      return;
    }

    const groupId = await createGroup({ name });
    navigate(`/admin/groups/${groupId}`);
    setName("");
    setDescription("");
    queryClient.invalidateQueries({ queryKey: ["groups"] });
  }, [name, navigate, queryClient]);

  return (
    <NewAdminResourceDialog
      {...rest}
      onClose={onClosed}
      title="New Group"
      form={
        <>
          <label className="block mb-2 text-gray-500">
            Name
            <input
              required
              value={name}
              className={twJoin(Input, "w-full block")}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block mb-2 text-gray-500">
            Description
            <input
              value={description}
              className={twJoin(Input, "w-full block")}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </>
      }
      onSave={name ? saveGroup : undefined}
    />
  );
}
