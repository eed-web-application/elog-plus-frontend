import React, { useState, FormEvent, useEffect } from "react";
import { twJoin } from "tailwind-merge";
import { useQueryClient } from "@tanstack/react-query";
import { GroupAuthorization, ServerError, GroupWithAuth, AuthorizationType } from "../api";
import { Button, IconButton } from "./base";
import Select from "./Select";
import { useGroupFormsStore } from "../groupFormsStore";
import reportServerError from "../reportServerError";
import useUsers from "../hooks/useUsers";
import { updateGroup, deleteGroup, getGroup } from "../../node_modules/ui/lib/services/GroupService"; // Updated import path

interface Props {
  group: GroupWithAuth;
  onSave: () => void;
  onDelete: () => void;
}

const DEFAULT_AUTHORIZATION: AuthorizationType = "Read";

export default function GroupForm({ group, onSave, onDelete }: Props) {
  const [form, setForm, removeForm] = useGroupFormsStore((state) =>
    state.startEditing(group)
  );
  const queryClient = useQueryClient();

  const [newUserAuthorization, setNewUserAuthorization] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const { users, isLoading: isUsersLoading } = useUsers({ search: userSearch });

  const validators = { name: () => Boolean(form?.name) };
  const [invalid, setInvalid] = useState<string[]>([]);

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const groupData = await getGroup(group.id);
        const members = groupData.payload.members || [];
        setForm({
          ...group,
          authorizations: members.map((member: any) => ({
            owner: member.mail,
            authorizationType: DEFAULT_AUTHORIZATION,
            ownerType: "User",
          })),
        });
      } catch (error) {
        console.error("Error fetching group details", error);
        reportServerError("Could not fetch group details", error);
      }
    };

    fetchGroupDetails();
  }, [group.id]);


  function onValidate(valid: boolean, field: string): boolean {
    if (valid) {
      setInvalid((invalid) => invalid.filter((invalidField) => invalidField !== field));
      return true;
    }
    if (!invalid.includes(field)) {
      setInvalid((invalid) => [...invalid, field]);
    }
    return false;
  }

  async function save() {
    console.log("Save button clicked");
    try {
      console.log("Calling updateGroup with:", form.id, form.authorizations.map((auth: GroupAuthorization) => auth.owner));
      await updateGroup(form.id, { name: form.name,
        description: "description",
        members: form.authorizations.map((auth: GroupAuthorization) => auth.owner)
      }); // Update the group with the new form data
      queryClient.invalidateQueries(["groups"]); // Invalidate groups query to refresh data
      removeForm();
      onSave(); // Trigger the onSave callback
      console.log("Group updated successfully");
    } catch (e) {
      console.error("Error updating group", e);
      if (!(e instanceof ServerError)) {
        throw e;
      }
      reportServerError("Could not save group", e);
    }
  }


  async function handleDeleteGroup() {
    if (!window.confirm("Are you sure you want to delete this group?")) {
      return;
    }

    try {
      await deleteGroup(form.id); // Assuming deleteGroup function exists in GroupService
      queryClient.invalidateQueries(["groups"]); // Invalidate groups query to refresh data
      removeForm();
      onDelete(); // Trigger the onSave callback
      console.log("Group deleted successfully");
    } catch (e) {
      console.error("Error deleting group", e);
      if (!(e instanceof ServerError)) {
        throw e;
      }
      reportServerError("Could not delete group", e);
    }
  }


  function createUserAuthorization(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!newUserAuthorization) {
      return;
    }

    setNewUserAuthorization(null);
    setForm({
      ...form,
      authorizations: [
        ...(form.authorizations || []),
        {
          owner: newUserAuthorization,
          authorizationType: DEFAULT_AUTHORIZATION,
          ownerType: "User",
        },
      ],
    });
  }

  function removeAuthorization(index: number) {
    const updatedAuthorizations = (form?.authorizations || []).filter(
      (_, i) => i !== index
    );
    setForm({
      ...form,
      authorizations: updatedAuthorizations,
    });
  }

  const userAuthorizations = (form?.authorizations || []).filter(
    (auth) => auth.ownerType === "User"
  );

  const updated = JSON.stringify(form) === JSON.stringify(group);

  return (
    <div className="px-3 pb-3">
      <div className="text-gray-500">Members</div>
      <div
        className={twJoin(
          "border rounded-lg bg-gray-50 w-full flex flex-col p-2",
          userAuthorizations.length === 0 &&
            "items-center justify-center text-lg text-gray-500"
        )}
      >
        {userAuthorizations.length === 0 ? (
          <div className="my-3">No members. Add one below.</div>
        ) : (
          <>
            <div className="divide-y">
              {userAuthorizations.map((authorization, index) => (
                <div
                  key={authorization.owner}
                  className="flex justify-between items-center py-1 px-2"
                >
                  <div className="flex-grow">{authorization.owner}</div>


                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    tabIndex={0}
                    className={twJoin(IconButton, "text-gray-500")}
                    onClick={() => removeAuthorization(index)}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <form
        noValidate
        className="relative mt-2 w-full"
        onSubmit={createUserAuthorization}
      >
        <Select
          className="pr-12 w-full"
          value={newUserAuthorization}
          onSearchChange={setUserSearch}
          isLoading={isUsersLoading}
          options={(users || [])
            .filter(
              (user) =>
                !userAuthorizations.some(
                  (authorization) => authorization.owner === user.mail
                )
            )
            .map((user) => ({ label: user.gecos, value: user.mail }))}
          setValue={setNewUserAuthorization}
        />
        <button
          type="submit"
          className="flex absolute top-0 right-0 bottom-0 justify-center items-center p-2.5 text-white bg-blue-500 rounded-r-lg disabled:text-gray-100 disabled:bg-blue-300"
          disabled={!newUserAuthorization}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </button>
      </form>

      <button
        disabled={updated}
        className={twJoin(Button, "block ml-auto mt-3")}
        onClick={save}
      >
        Save
      </button>

      <button
        className={twJoin(Button, "block ml-auto mt-3 bg-red-500")}
        onClick={handleDeleteGroup}
      >
        Delete Group
      </button>
    </div>
  );
}
