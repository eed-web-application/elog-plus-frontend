import { useCallback, useState } from "react";
import NewAdminResourceDialog from "./NewResourceDialog";
import { twJoin } from "tailwind-merge";
import { Input } from "../base";
import { createGroup } from "../../api";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

export default function NewGroupDialog() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const saveGroup = useCallback(async () => {
    if (!name) {
      return;
    }

    const groupId = await createGroup({ name, description, members: [] });
    navigate(`/admin/groups/${groupId}`);
    setName("");
    setDescription("");
    queryClient.invalidateQueries({ queryKey: ["groups"] });
  }, [name, description, navigate, queryClient]);

  return (
    <NewAdminResourceDialog
      title="New Group"
      onSave={name ? saveGroup : undefined}
    >
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
    </NewAdminResourceDialog>
  );
}
