import { twMerge } from "tailwind-merge";
import {
  Group,
  GroupUpdation,
  ServerError,
  User,
  updateGroup,
} from "../../api";
import { Input, InputInvalid } from "../base";
import { useGroupFormsStore, validateGroupForm } from "../../groupFormsStore";
import { saveAuthorizations } from "../../authorizationDiffing";
import { FormEvent, useState } from "react";
import useGroup from "../../hooks/useGroup";
import Spinner from "../Spinner";
import { useQueryClient } from "@tanstack/react-query";
import ResourceListForm from "./ResourceListForm";
import useUsers from "../../hooks/useUsers";
import Select from "../Select";
import reportServerError from "../../reportServerError";
import Button from "../Button";
import LogbookAuthorizationForm from "./LogbookAuthorizationForm";

export type Props = {
  onSave: () => void;
  groupId: string;
};

function GroupFormInner({
  group,
  onSave,
}: {
  group: Group;
  onSave: () => void;
}) {
  const {
    form,
    updated,
    setForm,
    createAuthorization,
    updateAuthorization,
    removeAuthorization,
    finishEditing,
  } = useGroupFormsStore((state) => state.startEditing(group));

  const [memberSearch, setMemberSearch] = useState("");
  const [selectedNewMember, setSelectedNewMember] = useState<User | null>(null);

  const {
    users,
    isLoading: isUsersLoading,
    getMoreUsers,
  } = useUsers({
    search: memberSearch,
  });

  const invalid = validateGroupForm(form);

  const queryClient = useQueryClient();

  const [saving, setSaving] = useState(false);

  async function saveGroup() {
    const groupUpdation: GroupUpdation = {
      ...form,
      members: form.members.map((member) => member.email),
    };

    await updateGroup(groupUpdation);
  }

  async function save() {
    if (invalid.size > 0) {
      return;
    }

    setSaving(true);

    try {
      await Promise.all([
        saveGroup(),
        saveAuthorizations(group.authorizations, form.authorizations),
      ]);
    } catch (e) {
      if (e instanceof ServerError) {
        reportServerError("Could not save group", e);
        return;
      }

      throw e;
    }

    queryClient.invalidateQueries({ queryKey: ["groups"] });
    await queryClient.invalidateQueries({ queryKey: ["group", group.id] });

    finishEditing();
    setSaving(false);
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
      members: [...form.members, selectedNewMember],
    });
  }

  function removeMember(memberId: string) {
    setForm({
      ...form,
      members: form.members.filter((member) => member.email !== memberId),
    });
  }

  const newMembers = users.filter(
    (user) => !form.members.some((member) => user.email === member.email),
  );

  return (
    <div className="p-3 pt-5">
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
        addable={Boolean(selectedNewMember)}
        onSubmit={addMember}
        items={form.members.map((member) => (
          <div
            key={member.email}
            className="flex justify-between items-center px-2"
          >
            <div>
              {member.gecos}
              <div className="text-sm text-gray-500">{member.email}</div>
            </div>
            <Button
              variant="icon"
              className="text-gray-500"
              onClick={() => removeMember(member.email)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>
        ))}
        select={
          <Select
            className="pr-12 w-full"
            value={
              selectedNewMember && {
                label: `${selectedNewMember.gecos} (${selectedNewMember.email})`,
                value: selectedNewMember.email,
              }
            }
            searchType="managed"
            onSearchChange={setMemberSearch}
            isLoading={isUsersLoading}
            options={newMembers.map((user) => ({
              label: `${user.gecos} (${user.email})`,
              value: user.email,
            }))}
            setValue={(userId) => {
              const user = newMembers.find((user) => user.email === userId);
              setSelectedNewMember(user || null);
            }}
            onBottomVisible={getMoreUsers}
          />
        }
      />

      <div className="text-gray-500 mt-2">Logbook Authorizations</div>
      <LogbookAuthorizationForm
        ownerId={group.id}
        ownerType="Group"
        ownerName={group.name}
        authorizations={form.authorizations}
        updateAuthorization={updateAuthorization}
        removeAuthorization={removeAuthorization}
        createAuthorization={createAuthorization}
      />

      <div className="flex justify-end mt-3 gap-3">
        <Button variant="text" disabled={!updated} onClick={finishEditing}>
          Discard changes
        </Button>
        <Button
          disabled={!updated || invalid.size > 0}
          onClick={save}
          isLoading={saving}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

export default function GroupForm({ groupId, onSave }: Props) {
  const group = useGroup(groupId);

  if (!group) {
    return <Spinner className="mt-3 w-full" />;
  }

  return <GroupFormInner group={group} onSave={onSave} />;
}
