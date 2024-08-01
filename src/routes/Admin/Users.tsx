import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";

import UserForm from "../../components/admin/UserForm";
import useUsers from "../../hooks/useUsers";
import { useUserFormsStore } from "../../userFormsStore";
import AdminResource from "../../components/admin/Resource";
import useDebounce from "../../hooks/useDebounce";

export default function AdminUsers() {
  const [userSearch, setUserSearch] = useState("");

  const { users, isLoading, getMoreUsers } = useUsers({
    search: userSearch,
  });
  const { userId: selectedUserId } = useParams();

  const usersEdited = useUserFormsStore((state) => Object.keys(state.forms));

  const onSave = useCallback(() => {
    toast.success("Saved user");
  }, []);

  const onSearchChange = useDebounce(setUserSearch, 500);

  return (
    <>
      <AdminResource
        home="/admin/users"
        items={users.map((user) => ({
          label: user.name,
          link: `/admin/users/${encodeURI(user.id)}/`,
          edited: usersEdited.includes(user.id),
          readOnly: false,
        }))}
        isLoading={isLoading}
        createLabel="Create logbook"
        onSearchChange={onSearchChange}
        onBottomVisible={getMoreUsers}
      >
        {selectedUserId && <UserForm userId={selectedUserId} onSave={onSave} />}
      </AdminResource>
    </>
  );
}
