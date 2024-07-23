import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";

import GroupForm from "../../components/admin/GroupForm";
import useGroups from "../../hooks/useGroups";
import { useGroupFormsStore } from "../../groupFormsStore";
import AdminResource from "../../components/admin/Resource";
import NewGroupDialog from "../../components/admin/NewGroupDialog";

export default function AdminGroups() {
  const [groupSearch, setGroupSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { groups, isLoading, getMoreGroups } = useGroups({
    search: groupSearch,
  });
  const { groupId: selectedGroupId } = useParams();

  const groupsEdited = useGroupFormsStore((state) => Object.keys(state.forms));

  const onSave = useCallback(() => {
    toast.success("Saved group");
  }, []);

  return (
    <NewGroupDialog
      isOpen={isCreateOpen}
      onClose={() => setIsCreateOpen(false)}
    >
      <AdminResource
        home="/admin/groups"
        items={groups.map((group) => ({
          label: group.name,
          link: `/admin/groups/${group.id}`,
          edited: groupsEdited.includes(group.id),
        }))}
        isLoading={isLoading}
        createLabel="Create group"
        onCreate={() => setIsCreateOpen(true)}
        onSearchChange={setGroupSearch}
        onBottomVisible={getMoreGroups}
      >
        {selectedGroupId && (
          <GroupForm groupId={selectedGroupId} onSave={onSave} />
        )}
      </AdminResource>
    </NewGroupDialog>
  );
}
