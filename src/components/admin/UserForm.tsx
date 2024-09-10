import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { UserWithAuth, ServerError } from "../../api";
import { Input } from "../base";
import { useUserFormsStore } from "../../userFormsStore";
import { saveAuthorizations } from "../../authorizationDiffing";
import useUser from "../../hooks/useUser";
import Spinner from "../Spinner";
import { useQueryClient } from "@tanstack/react-query";
import reportServerError from "../../reportServerError";
import Button from "../Button";
import LogbookAuthorizationForm from "./LogbookAuthorizationForm";

interface Props {
  userId: string;
  onSave: () => void;
}

function UserFormInner({
  user,
  onSave,
}: {
  user: UserWithAuth;
  onSave: () => void;
}) {
  const {
    form,
    updated,
    createAuthorization,
    removeAuthorization,
    updateAuthorization,
    finishEditing,
  } = useUserFormsStore((state) => state.startEditing(user));
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await saveAuthorizations(user.authorizations, form.authorizations);
    } catch (e) {
      if (e instanceof ServerError) {
        reportServerError("Could not save user", e);
        return;
      }

      throw e;
    }
    await queryClient.invalidateQueries({ queryKey: ["user", user.email] });

    finishEditing();
    setSaving(false);
    onSave();
  }

  return (
    <div className="p-3 pt-5">
      <label className="block text-gray-500">
        Name
        <input
          disabled
          type="text"
          className={twMerge(Input, "block w-full")}
          value={form.gecos}
        />
      </label>

      <label className="block text-gray-500 mt-2">
        Email
        <input
          disabled
          type="text"
          className={twMerge(Input, "block w-full")}
          value={form.email}
        />
      </label>

      <div className="text-gray-500 mt-2">Logbook Authorizations</div>
      <LogbookAuthorizationForm
        ownerId={user.email}
        ownerType="User"
        ownerName={user.gecos}
        authorizations={form.authorizations}
        updateAuthorization={updateAuthorization}
        removeAuthorization={removeAuthorization}
        createAuthorization={createAuthorization}
      />

      <div className="flex justify-end mt-3 gap-3">
        <Button variant="text" disabled={!updated} onClick={finishEditing}>
          Discard changes
        </Button>
        <Button disabled={!updated} onClick={save} isLoading={saving}>
          Save
        </Button>
      </div>
    </div>
  );
}

export default function UserForm({ userId, onSave }: Props) {
  const user = useUser(userId, { includeAuthorizations: true });

  if (!user) {
    return <Spinner className="mt-3 w-full" />;
  }

  return <UserFormInner user={user} onSave={onSave} />;
}
