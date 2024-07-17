import { ComponentProps } from "react";
import SideSheet from "./SideSheet";
import { NavLink } from "react-router-dom";
import { twJoin, twMerge } from "tailwind-merge";
import Spinner from "./Spinner";

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
}

export default function AdminResource({
  items,
  home,
  children,
  isLoading,
  createLabel,
  onCreate,
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
        {isLoading ? (
          <Spinner className="self-center" />
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
