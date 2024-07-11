import React, { useCallback, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate, useParams } from "react-router-dom";
import { twJoin, twMerge } from "tailwind-merge";
import Spinner from "../../components/Spinner";
import SideSheet from "../../components/SideSheet";
import Dialog from "../../components/Dialog";
import { Button, Input, TextButton } from "../../components/base";
import { useQueryClient } from "@tanstack/react-query";
// import {
//   getGroups,
//   createGroup,
// } from "../../../node_modules/ui/lib/services/GroupService";
import GroupForm from "../../components/GroupForm.tsx";
import { GroupWithAuth } from "../../api/groups.ts";

export default function AdminGroups() {
  const [groupSearch, setGroupSearch] = useState("");
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithAuth | null>(
    null,
  );
  const { groupID } = useParams<{ groupID: string }>();
  const [newGroupName, setNewGroupName] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    fetchGroups();
  }, [groupSearch]);

  useEffect(() => {
    if (groupID) {
      const group = groups.find((g) => g.id === groupID);
      if (group) {
        setSelectedGroup(group);
      } else {
        setSelectedGroup(null);
      }
    } else {
      setSelectedGroup(null);
    }
  }, [groupID, groups]);

  const onSave = useCallback(() => {
    toast.success("Saved Group");
  }, []);

  const onDelete = useCallback(() => {
    toast.success("Deleted Group");
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const data = await getGroups();
      setGroups(data);
    } catch (error) {
      toast.error("Failed to fetch groups");
    }
    setIsLoading(false);
  };

  const searchFor = (value: string) => {
    setGroupSearch(value);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupName) {
      try {
        await createGroup({ name: newGroupName });
        fetchGroups();
        setNewGroupName(null);
        toast.success("Group created successfully");
      } catch (error) {
        toast.error("Failed to create group");
      }
    }
  };

  return (
    <>
      <form
        className="flex-1 mt-2 mr-2 md:mx-2"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="relative w-full">
          <input
            type="search"
            className={twJoin(Input, "block w-full")}
            placeholder="Search..."
            onChange={(e) => searchFor(e.target.value)}
          />
          <button
            type="submit"
            className="absolute top-0 right-0 p-1.5 text-sm font-medium text-white bg-blue-500 rounded-r-lg border border-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 focus:outline-none"
          >
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </button>
        </div>
      </form>
      <Dialog controlled isOpen={newGroupName !== null}>
        <div className="flex flex-col h-screen">
          <div className="flex overflow-hidden flex-1">
            <SideSheet
              home="/admin/groups"
              sheetBody={
                selectedGroup && (
                  <GroupForm
                    group={selectedGroup}
                    onSave={onSave}
                    onDelete={onDelete}
                  />
                )
              }
            >
              <div
                className={twMerge(
                  "min-w-[384px] flex-1 flex flex-col justify-stretch p-3 overflow-y-auto",
                  groups ? "divide-y" : "justify-center w-full",
                )}
              >
                {isLoading ? (
                  <Spinner className="self-center" />
                ) : (
                  <>
                    {groups?.map((group) => (
                      <Link
                        key={group.id}
                        to={`/admin/groups/${group.id}`}
                        tabIndex={0}
                        className={twJoin(
                          "p-2 cursor-pointer uppercase focus:outline focus:z-0 outline-2 outline-blue-500",
                          selectedGroup !== group.id
                            ? "hover:bg-gray-100"
                            : "bg-blue-100 hover:bg-blue-200",
                        )}
                      >
                        {group.name}
                        <span className="text-gray-500">{}</span>
                      </Link>
                    ))}
                    <button
                      className="p-2 text-center bg-gray-100 cursor-pointer hover:bg-gray-200 focus:z-0 outline-2 outline-blue-500 focus:outline"
                      onClick={() => setNewGroupName("")}
                    >
                      Create Group
                    </button>
                  </>
                )}
              </div>
            </SideSheet>
          </div>
        </div>
        <Dialog.Content
          as="form"
          className="w-full max-w-sm"
          onSubmit={handleCreateGroup}
        >
          <Dialog.Section>
            <h1 className="text-lg">New Group</h1>
          </Dialog.Section>
          <Dialog.Section>
            <label className="block mb-2 text-gray-500">
              Name
              <input
                required
                value={newGroupName || ""}
                className={twJoin(Input, "w-full block")}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </label>
          </Dialog.Section>
          <Dialog.Section className="flex gap-3 justify-end">
            <button
              type="button"
              className={TextButton}
              onClick={() => setNewGroupName(null)}
            >
              Cancel
            </button>
            <input
              value="Save"
              type="submit"
              className={Button}
              disabled={!newGroupName}
            />
          </Dialog.Section>
        </Dialog.Content>
      </Dialog>
    </>
  );
}
