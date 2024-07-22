import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";

import UserForm from "../../components/admin/UserForm";
import useUsers from "../../hooks/useUsers";
import { useUserFormsStore } from "../../userFormsStore";
import AdminResource from "../../components/admin/Resource";

export default function AdminUsers() {
  const [userSearch, setUserSearch] = useState("");

  const { users, userMap, isLoading } = useUsers({
    search: userSearch,
    includeAuthorizations: true,
  });
  const { userId: selectedUserId } = useParams();

  const selectedUser = selectedUserId ? userMap[selectedUserId] : undefined;

  const usersEdited = useUserFormsStore((state) => Object.keys(state.forms));

  const onSave = useCallback(() => {
    toast.success("Saved user");
  }, []);

  return (
    <>
      <AdminResource
        home="/admin/users"
        items={users.map((user) => ({
          label: user.name,
          link: `/admin/users/${user.id}`,
          edited: usersEdited.includes(user.id),
        }))}
        isLoading={isLoading}
        createLabel="Create logbook"
        onSearchChange={setUserSearch}
      >
        {selectedUser && <UserForm user={selectedUser} onSave={onSave} />}
      </AdminResource>
    </>
  );
}
