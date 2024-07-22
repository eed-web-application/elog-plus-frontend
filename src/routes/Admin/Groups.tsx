import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";

import GroupForm from "../../components/admin/GroupForm";
import useGroups from "../../hooks/useGroups";
import { useGroupFormsStore } from "../../groupFormsStore";
import AdminResource from "../../components/admin/Resource";

export default function AdminGroups() {
  const [groupSearch, setGroupSearch] = useState("");

  const { groups, groupMap, isLoading } = useGroups({
    search: groupSearch,
    includeAuthorizations: true,
  });
  const { groupId: selectedGroupId } = useParams();

  const selectedGroup = selectedGroupId ? groupMap[selectedGroupId] : undefined;

  const groupsEdited = useGroupFormsStore((state) => Object.keys(state.forms));

  const onSave = useCallback(() => {
    toast.success("Saved group");
  }, []);

  return (
    <>
      <AdminResource
        home="/admin/groups"
        items={groups.map((group) => ({
          label: group.name,
          link: `/admin/groups/${group.id}`,
          edited: groupsEdited.includes(group.id),
        }))}
        isLoading={isLoading}
        createLabel="Create group"
        onSearchChange={setGroupSearch}
      >
        {selectedGroup && <GroupForm group={selectedGroup} onSave={onSave} />}
      </AdminResource>
    </>
  );
}
