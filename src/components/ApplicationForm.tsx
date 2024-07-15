import { FormEvent, useState } from "react";
import { twJoin, twMerge } from "tailwind-merge";
import { useQueryClient } from "@tanstack/react-query";
import {
  LogbookUpdation,
  ServerError,
  Shift,
  updateLogbook,
  AuthorizationPermission,
  LogbookWithAuth,
} from "../api";
import { Button, IconButton, Input, InputInvalid } from "./base";
import { useLogbookFormsStore } from "../logbookFormsStore";
import { localToUtc, utcToLocal } from "../utils/datetimeConversion";
import reportServerError from "../reportServerError";
import Select from "./Select";
import useGroups from "../hooks/useGroups";
import useApplications from "../hooks/useApplications";

interface Props {
  user: LogbookWithAuth;
  onSave: () => void;
}

const DEFAULT_AUTHORIZATION: AuthorizationPermission = "Read";

let idCounter = 0;

export default function ApplicationForm() {
  const queryClient = useQueryClient();

  const [newUserAuthorization, setNewUserAuthorizations] = useState<
    string | null
  >(null);
  const [appSearch, setAppSearch] = useState("");

  const { applications, appMap, isLoading } = useApplications({});

  return (
    <div className="px-3 pb-3">
      <div className="text-gray-500">App Authorizations</div>
      <div
        className={twJoin(
          "border rounded-lg bg-gray-50 w-full flex flex-col p-2",

          "items-center justify-center text-lg text-gray-500",
        )}
      >
        <div className="my-3">No user authorizations. Create one below.</div>

        <form noValidate className="relative mt-2 w-full">
          <Select
            className="pr-12 w-full"
            value={newUserAuthorization}
            onSearchChange={setAppSearch}
            isLoading={isLoading}
            options={[]}
            setValue={setNewUserAuthorizations}
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
      </div>
      <button className={twJoin(Button, "block ml-auto mt-3")}>Save</button>
    </div>
  );
}
