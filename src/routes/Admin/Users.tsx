import { useCallback, useState, useSyncExternalStore } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate, useParams } from "react-router-dom";
import { twJoin, twMerge } from "tailwind-merge";
import Spinner from "../../components/Spinner";

import UserForm from "../../components/UserForm";
import useUsers from "../../hooks/useUsers";
import { useUserFormsStore } from "../../userFormsStore";
import AdminResource from "../../components/AdminResource";
import { Input } from "../../components/base";

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
