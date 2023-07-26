import cn from "classnames";

export const InputBase =
  "text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-200";
export const InputDisabled = "!bg-gray-100 !text-gray-500 !border-gray-200";

export const Input = cn(InputBase, "pl-2.5 p-2");

export const InputSmall = cn(InputBase, "px-2 py-1");

export const InputInvalid =
  "border-red-500 focus-1 ring-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500";

export const Button =
  "cursor-pointer py-2 px-2.5 bg-blue-500 rounded-lg text-white border border-blue-500 hover:bg-blue-600 focus:ring-2 focus:outline-none focus:ring-blue-300 disabled:cursor-auto disabled:bg-blue-300 disabled:border-blue-300 disabled:hover:bg-blue-300 disabled:text-gray-100";

export const IconButton =
  "w-9 h-9 p-2 hover:bg-gray-200 rounded-full cursor-pointer";

export const BackDrop = "bg-gray-800 bg-opacity-60";

export const Link = "font-medium text-blue-600 hover:underline";

export const Checkbox = "w-5 h-5 accent-blue-500";
