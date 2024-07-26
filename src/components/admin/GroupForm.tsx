import { twJoin, twMerge } from "tailwind-merge";
import { Group, GroupUpdation, Permission, updateGroup } from "../../api";
import { Button, IconButton, Input, InputInvalid, TextButton } from "../base";
import { useGroupFormsStore, validateGroupForm } from "../../groupFormsStore";
import useLogbooks from "../../hooks/useLogbooks";
import AdminAuthorizationForm from "./AuthorizationForm";
import { saveAuthorizations } from "../../authorizationDiffing";
import { FormEvent, useState } from "react";
import useGroup from "../../hooks/useGroup";
import Spinner from "../Spinner";
import { useQueryClient } from "@tanstack/react-query";
import ResourceListForm from "./ResourceListForm";
import useUsers from "../../hooks/useUsers";
import Select from "../Select";

export type Props = {
  onSave: () => void;
  groupId: string;
};

const DEFAULT_PERMISSION: Permission = "Read";

function GroupFormInner({
  group,
  onSave,
}: {
  group: Group<true, true>;
  onSave: () => void;
}) {
  const { form, setForm, finishEditing } = useGroupFormsStore((state) =>
    state.startEditing(group),
  );

  const [logbookSearch, setLogbookSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedNewMember, setSelectedNewMember] = useState<string | null>(
    null,
  );

  const { logbooks, isLoading: isLogbooksLoading } = useLogbooks();
  const {
    users,
    isLoading: isUsersLoading,
    getMoreUsers,
  } = useUsers({
    search: memberSearch,
  });

  const invalid = validateGroupForm(form);

  const queryClient = useQueryClient();

  async function saveGroup() {
    const groupUpdation: GroupUpdation = {
      ...form,
      members: form.members.map((member) => member.id),
    };

    await updateGroup(groupUpdation);
  }

  async function save() {
    if (invalid.size > 0) {
      return;
    }

    await Promise.all([
      saveGroup(),
      saveAuthorizations(group.authorizations, form.authorizations),
    ]);

    queryClient.invalidateQueries({ queryKey: ["groups"] });
    await queryClient.invalidateQueries({ queryKey: ["group", group.id] });

    finishEditing();
    onSave();
  }

  function addMember(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedNewMember) {
      return;
    }

    setSelectedNewMember(null);
    setForm({
      ...form,
      members: [
        ...form.members,
        users.find((user) => user.id === selectedNewMember)!,
      ],
    });
  }

  function removeMember(memberId: string) {
    setForm({
      ...form,
      members: form.members.filter((member) => member.id !== memberId),
    });
  }

  function updateAuthorizationPermission(
    resourceId: string,
    permission: Permission,
  ) {
    setForm({
      ...form,
      authorizations: form.authorizations.map((otherAuthorization) =>
        otherAuthorization.resourceId === resourceId
          ? { ...otherAuthorization, permission }
          : otherAuthorization,
      ),
    });
  }

  function removeAuthorization(resourceId: string) {
    setForm({
      ...form,
      authorizations: form.authorizations.filter(
        (otherAuthorization) => otherAuthorization.resourceId !== resourceId,
      ),
    });
  }

  function createAuthorization(resourceId: string) {
    const resouceLabel = logbooks.find(
      (logbook) => logbook.id === resourceId,
    )?.name;

    // Should probably never happen, but we still want to catch it, because
    // if this throws something else is wrong.
    if (!resouceLabel) {
      throw new Error("Could not find label for new authorization");
    }

    // If the user deletes an authorization and then creates a new one with the
    // same owner, we want to keep the ID so we don't create a new one.
    const existingAuthorization = group.authorizations.find(
      (authorization) => authorization.resourceId === resourceId,
    );

    setForm({
      ...form,
      authorizations: [
        ...form.authorizations,
        {
          id: existingAuthorization?.id,
          permission: DEFAULT_PERMISSION,
          ownerId: group.id,
          ownerType: "Group",
          ownerName: group.name,
          resourceId,
          resourceType: "Logbook",
          resourceName: resouceLabel,
        },
      ],
    });
  }

  const updated = JSON.stringify(form) !== JSON.stringify(group);

  const logbooksFiltered = logbooks
    .filter((logbook) =>
      logbook.name.toLowerCase().includes(logbookSearch.toLowerCase()),
    )
    .filter(
      (logbook) =>
        !form.authorizations.some((auth) => auth.resourceId === logbook.id),
    );

  const newMembers = users.filter(
    (user) => !form.members.some((member) => user.id === member.id),
  );

  return (
    <div className="p-3">
      <label className="block text-gray-500">
        Name
        <input
          required
          type="text"
          className={twMerge(
            Input,
            invalid.has("name") && InputInvalid,
            "block w-full",
          )}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </label>

      <label className="block text-gray-500 mt-2">
        Description
        <input
          type="text"
          className={twMerge(Input, "block w-full")}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </label>

      <div className="text-gray-500 mt-2">Members</div>
      <ResourceListForm
        emptyLabel="No members. Add one below."
        disabled={!selectedNewMember}
        onSubmit={addMember}
        items={form.members.map((member) => (
          <div
            key={member.id}
            className="flex justify-between items-center px-2"
          >
            <div>
              {member.name}
              <div className="text-sm text-gray-500">{member.email}</div>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              tabIndex={0}
              className={twJoin(IconButton, "text-gray-500")}
              onClick={() => removeMember(member.id)}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        ))}
        select={
          <Select
            className="pr-12 w-full"
            value={selectedNewMember}
            onSearchChange={setMemberSearch}
            isLoading={isUsersLoading}
            options={newMembers.map((user) => ({
              label: user.name,
              value: user.id,
            }))}
            setValue={setSelectedNewMember}
            onBottomVisible={getMoreUsers}
          />
        }
      />

      <div className="text-gray-500 mt-2">Logbook Authorizations</div>
      <AdminAuthorizationForm
        emptyLabel="No logbook authorizations. Create one below."
        options={logbooksFiltered.map((logbook) => ({
          label: logbook.name,
          value: logbook.id,
        }))}
        isOptionsLoading={isLogbooksLoading}
        authorizations={form.authorizations
          .filter((auth) => auth.resourceType === "Logbook")
          .map((auth) => ({
            value: auth.resourceId,
            label: auth.resourceName,
            permission: auth.permission,
          }))}
        setOptionsSearch={setLogbookSearch}
        updatePermission={updateAuthorizationPermission}
        removeAuthorization={removeAuthorization}
        createAuthorization={createAuthorization}
      />

      <div className="flex justify-end mt-3 gap-3">
        <button
          disabled={!updated}
          className={twJoin(TextButton, "block")}
          onClick={finishEditing}
        >
          Discard changes
        </button>
        <button
          disabled={!updated || invalid.size > 0}
          className={twJoin(Button, "block")}
          onClick={save}
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default function GroupForm({ groupId, onSave }: Props) {
  const group = useGroup(groupId, {
    includeAuthorizations: true,
    includeMembers: true,
  });

  if (!group) {
    return <Spinner className="mt-3 w-full" />;
  }

  return <GroupFormInner group={group} onSave={onSave} />;
}
