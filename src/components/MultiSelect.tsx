import {
  Dispatch,
  HTMLProps,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import cn from "classnames";
import { Input, InputInvalid } from "./base";
import { size, useFloating } from "@floating-ui/react";
import Spinner from "./Spinner";
import Tag from "./Tag";

interface Props extends Omit<HTMLProps<HTMLInputElement>, "value"> {
  value: string[];
  setValue: Dispatch<SetStateAction<string[]>>;
  options: string[];
  isLoading?: boolean;
  containerClassName?: string;
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
  onFocus,
  ...rest
}: Props) {
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);

  const filteredOptions = search
    ? options.filter((option) => option.toLowerCase().includes(search))
    : options;

  const { refs, floatingStyles } = useFloating({
    open: focused,
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

  // useEffect(() => {
  //   if (value && !isOpen) {
  //     setSearch("");
  //   }
  // }, [value, isOpen]);

  return (
    <div
      className={cn(
        Input,
        invalid && InputInvalid,
        focused && "outline-none ring-1 ring-blue-500 border-blue-500",
        className,
        "flex"
      )}
      ref={refs.setReference}
    >
      <div className="flex flex-wrap flex-1">
        {value.map((option) => (
          <Tag
            delectable
            className="mr-2"
            key={option}
            onDelete={() =>
              setValue((value) =>
                value.filter((otherOption) => otherOption !== option)
              )
            }
          >
            {option}
          </Tag>
        ))}
        <input
          {...rest}
          type="text"
          placeholder={value && !placeholder ? "" : placeholder}
          value={search}
          className="flex-1 outline-none bg-transparent w-fit"
          onChange={(e) => setSearch(e.target.value)}
          onFocus={(e) => {
            onFocus?.(e);
            setFocused(true);
          }}
          onBlur={(e) => {
            onBlur?.(e);
            setFocused(false);
          }}
        />
      </div>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="self-end ml-auto w-6 h-6 text-gray-500 cursor-pointer"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 8.25l-7.5 7.5-7.5-7.5"
        />
      </svg>
      {focused && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="max-h-64 overflow-y-auto rounded-lg shadow mt-2 text-black bg-white z-10"
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
                  value.includes(option)
                    ? "bg-blue-100 hover:bg-blue-200"
                    : "hover:bg-gray-100"
                )}
                onMouseDown={() => {
                  if (value.includes(option)) {
                    setValue((value) =>
                      value.filter((otherOption) => otherOption !== option)
                    );
                  } else {
                    setValue((value) => [...value, option]);
                  }
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
