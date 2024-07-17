import { useCallback, useState, useSyncExternalStore } from "react";
import { toast } from "react-toastify";
import {
  Link,
  useNavigate,
  useParams,
  Outlet,
  useOutlet,
} from "react-router-dom";
import { twJoin, twMerge } from "tailwind-merge";
import Spinner from "../../components/Spinner";

import UserForm from "../../components/UserForm";
import SideSheet from "../../components/SideSheet";
import Dialog from "../../components/Dialog";
import { Button, Input, TextButton } from "../../components/base";
import { useQueryClient } from "@tanstack/react-query";
//useUsers hook?
import useUsers from "../../hooks/useUsers";
import { useUserFormsStore } from "../../userFormsStore";
import AdminResource from "../../components/AdminResource";

export default function AdminUsers() {
  // const [userSearch, setUserSearch] = useState("");

  const { users, userMap, isLoading } = useUsers({ search: "" });
  const { userId: selectedUserId } = useParams();

  const selectedUser = selectedUserId ? userMap[selectedUserId] : undefined;

  const usersEdited = useUserFormsStore((state) => Object.keys(state.forms));

  const onSave = useCallback(() => {
    toast.success("Saved user");
  }, []);

  // function searchFor(value: string) {
  //   setUserSearch(value);
  // }

  return (
    <>
      {/* <form */}
      {/*   className="flex-1 mt-2 mr-2 md:mx-2" */}
      {/*   onSubmit={(e) => { */}
      {/*     e.preventDefault(); */}
      {/*   }} */}
      {/* > */}
      {/*   <div className="relative w-full"> */}
      {/*     <input */}
      {/*       type="search" */}
      {/*       className={twJoin(Input, "block w-full")} */}
      {/*       placeholder="Search..." */}
      {/*       onChange={(e) => searchFor(e.target.value)} */}
      {/*     /> */}
      {/*     <button */}
      {/*       type="submit" */}
      {/*       className="absolute top-0 right-0 p-1.5 text-sm font-medium text-white bg-blue-500 rounded-r-lg border border-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 focus:outline-none" */}
      {/*     > */}
      {/*       <svg */}
      {/*         aria-hidden="true" */}
      {/*         className="w-5 h-5" */}
      {/*         fill="none" */}
      {/*         stroke="currentColor" */}
      {/*         viewBox="0 0 24 24" */}
      {/*         xmlns="http://www.w3.org/2000/svg" */}
      {/*       > */}
      {/*         <path */}
      {/*           strokeLinecap="round" */}
      {/*           strokeLinejoin="round" */}
      {/*           strokeWidth="2" */}
      {/*           d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" */}
      {/*         ></path> */}
      {/*       </svg> */}
      {/*     </button> */}
      {/*   </div> */}
      {/* </form> */}
      <AdminResource
        home="/admin/users"
        items={users.map((user) => ({
          label: user.name,
          link: `/admin/users/${user.id}`,
          edited: usersEdited.includes(user.id),
        }))}
        isLoading={isLoading}
        createLabel="Create logbook"
      >
        {selectedUser && <UserForm user={selectedUser} onSave={onSave} />}
      </AdminResource>
    </>
  );
}
