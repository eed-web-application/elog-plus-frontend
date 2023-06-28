import { HTMLProps, useEffect, useState } from "react";
import cn from "classnames";
import { Input, InputInvalid } from "./base";
import { size, useFloating } from "@floating-ui/react";
import Spinner from "./Spinner";

interface Props extends Omit<HTMLProps<HTMLInputElement>, "value"> {
  value: string | null;
  setValue: (selected: string | null) => void;
  options: string[];
  isLoading?: boolean;
  containerClassName: string;
  invalid?: boolean;
}

export default function Select({
  value,
  setValue,
  options,
  isLoading,
  className,
  containerClassName,
  placeholder,
  invalid,
  onBlur,
  ...rest
}: Props) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = search
    ? options.filter((option) => option.toLowerCase().includes(search))
    : options;

  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "bottom-start",
    middleware: [
      size({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
          });
        },
      }),
    ],
  });

  useEffect(() => {
    if (value && !isOpen) {
      setSearch("");
    }
  }, [value, isOpen]);

  return (
    <div className={cn(containerClassName, "relative")}>
      <input
        {...rest}
        type="text"
        className={cn(Input, invalid && InputInvalid, className)}
        placeholder={value && !placeholder ? "" : placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        ref={refs.setReference}
        onFocus={() => setIsOpen(true)}
        onBlur={(e) => {
          onBlur?.(e);
          setIsOpen(false);
        }}
      />
      {
        <div
          className={cn(
            // Using styles from Input to ensure padding is correct
            Input,
            className,
            "absolute flex left-0 right-0 bottom-0 top-0 bg-transparent border-transparent pointer-events-none"
          )}
        >
          {value && !search ? value : ""}

          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="self-end ml-auto w-6 h-6 text-gray-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </div>
      }
      {isOpen && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="max-h-64 overflow-y-auto rounded-lg shadow mt-2 text-black bg-white"
        >
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
                  value == option
                    ? "bg-blue-100 hover:bg-blue-200"
                    : "hover:bg-gray-100"
                )}
                onMouseDown={() => {
                  setValue(option);
                }}
              >
                {option}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
