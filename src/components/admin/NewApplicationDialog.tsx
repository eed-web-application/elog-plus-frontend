import { useCallback, useState } from "react";
import NewAdminResourceDialog, {
  Props as NewAdminResourceDialogProps,
} from "./NewResourceDialog";
import { twJoin } from "tailwind-merge";
import { Input } from "../base";
import { createApplication } from "../../api";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

export type Props = Omit<
  NewAdminResourceDialogProps,
  "title" | "form" | "onSave"
>;

export default function NewApplicationDialog({ onClose, ...rest }: Props) {
  const [name, setName] = useState("");
  const [expiration, setExpiration] = useState("");

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  function validateExpiration() {
    try {
      return expiration && new Date(expiration) > new Date();
    } catch (e) {
      return false;
    }
  }

  function validate() {
    return name && validateExpiration();
  }

  function onClosed() {
    onClose();
    setName("");
    setExpiration("");
  }

  const saveApplication = useCallback(async () => {
    if (!validate()) {
      return;
    }

    console.log("name", name);
    const applicationId = await createApplication({ name, expiration });
    navigate(`/admin/applications/${applicationId}`);
    setName("");
    setExpiration("");
    queryClient.invalidateQueries({ queryKey: ["applications"] });
  }, [name, expiration, validate, navigate, queryClient]);

  return (
    <NewAdminResourceDialog
      {...rest}
      onClose={onClosed}
      title="New Application"
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
            Expiration
            <input
              value={expiration}
              className={twJoin(Input, "w-full block")}
              onChange={(e) => setExpiration(e.target.value)}
              type="date"
            />
            {/* error */}
            {expiration && !validateExpiration() && (
              <p className="text-red-500 mt-1">
                Expiration must be in the future
              </p>
            )}
          </label>
        </>
      }
      onSave={validate() ? saveApplication : undefined}
    />
  );
}
