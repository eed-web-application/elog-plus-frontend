import { useCallback, useState } from "react";
import NewAdminResourceDialog from "./NewResourceDialog";
import { twJoin } from "tailwind-merge";
import { Input } from "../base";
import { createApplication } from "../../api";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { yyyymmddToDate } from "../../utils/datetimeConversion";

export default function NewApplicationDialog() {
  const [name, setName] = useState("");
  const [expiration, setExpiration] = useState("");

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  function validateExpiration() {
    try {
      return expiration && yyyymmddToDate(expiration) > new Date();
    } catch (e) {
      return false;
    }
  }

  function validate() {
    return name && validateExpiration();
  }

  const saveApplication = useCallback(async () => {
    if (!validate()) {
      return;
    }

    const applicationId = await createApplication({ name, expiration });
    navigate(`/admin/applications/${applicationId}`);
    setName("");
    setExpiration("");
    queryClient.invalidateQueries({ queryKey: ["applications"] });
  }, [name, expiration, validate, navigate, queryClient]);

  return (
    <NewAdminResourceDialog
      title="New Application"
      onSave={validate() ? saveApplication : undefined}
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
        Expiration
        <input
          value={expiration}
          className={twJoin(Input, "w-full block")}
          onChange={(e) => setExpiration(e.target.value)}
          type="date"
        />
        {expiration && !validateExpiration() && (
          <p className="text-red-500 mt-1">Expiration must be in the future</p>
        )}
      </label>
    </NewAdminResourceDialog>
  );
}
