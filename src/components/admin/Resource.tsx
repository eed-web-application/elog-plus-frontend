import { ComponentProps } from "react";
import SideSheet from "../SideSheet";
import { NavLink } from "react-router-dom";
import { twJoin, twMerge } from "tailwind-merge";
import Spinner from "../Spinner";
import { Input } from "../base";

export interface Item {
  label: string;
  link: string;
  edited: boolean;
}

export interface Props extends ComponentProps<"div"> {
  items: Item[];
  isLoading?: boolean;
  home: string;
  createLabel: string;
  onCreate?: () => void;
  onSearchChange: (search: string) => void;
}

export default function AdminResource({
  items,
  home,
  children,
  isLoading,
  createLabel,
  onCreate,
  onSearchChange,
}: Props) {
  return (
    <SideSheet home={home} sheetBody={children}>
      <div
        className={twMerge(
          "min-w-[384px] flex-1 flex flex-col p-3 overflow-y-auto",
          // Don't want to have border when loading
          isLoading ? "divide-y" : "w-full",
        )}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <div className="relative w-full">
            <input
              type="search"
              className={twJoin(Input, "block w-full")}
              placeholder="Search..."
              onChange={(e) => onSearchChange(e.target.value)}
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
        {isLoading ? (
          <Spinner className="self-center mt-3" />
        ) : (
          <>
            {items.map((item) => (
              <NavLink
                key={item.link}
                to={item.link}
                className={({ isActive }) =>
                  twJoin(
                    "p-2 cursor-pointer uppercase focus:outline focus:z-0 outline-2 outline-blue-500",
                    isActive
                      ? "bg-blue-100 hover:bg-blue-200"
                      : "hover:bg-gray-100",
                  )
                }
              >
                {item.label}
                <span className="text-gray-500">{item.edited && "*"}</span>
              </NavLink>
            ))}

            {onCreate && (
              <button
                className="p-2 text-center bg-gray-100 cursor-pointer hover:bg-gray-200 focus:z-0 outline-2 outline-blue-500 focus:outline"
                onClick={onCreate}
              >
                {createLabel}
              </button>
            )}
          </>
        )}
      </div>
    </SideSheet>
  );
}
