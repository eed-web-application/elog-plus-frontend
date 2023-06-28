import cn from "classnames";
import { useState } from "react";
import Spinner from "./Spinner";
import { Input } from "./base";

export interface Props {
  selected: string[];
  setSelected: (options: string[]) => void;
  options: string[];
  isLoading: boolean;
}

export default function LogbookSelect({
  selected,
  setSelected,
  options,
  isLoading,
}: Props) {
  const [search, setSearch] = useState("");

  const filteredOptions = search
    ? options.filter((option) => option.toLowerCase().includes(search))
    : options;

  function selectOption(option: string) {
    if (selected.includes(option)) {
      setSelected(selected.filter((x) => x !== option));
    } else {
      setSelected([...selected, option]);
    }
  }

  return (
    <>
      <input
        type="search"
        className={cn("block w-64 rounded-b-none", Input)}
        placeholder="Search..."
        autoFocus
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="max-h-64 overflow-y-auto">
        {filteredOptions.length === 0 || isLoading ? (
          <div className="text-gray-500 text-center w-full py-3">
            {isLoading ? <Spinner className="m-auto" /> : "No options"}
          </div>
        ) : (
          filteredOptions.map((option) => (
            <div
              tabIndex={0}
              key={option}
              className={cn(
                "px-2 p-1  cursor-pointer",
                selected.includes(option)
                  ? "bg-blue-100 hover:bg-blue-200"
                  : "hover:bg-gray-100"
              )}
              // To prevent blur on search input
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectOption(option)}
            >
              {option}
            </div>
          ))
        )}
      </div>
    </>
  );
}
