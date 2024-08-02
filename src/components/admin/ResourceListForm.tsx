import { ComponentProps, FormEvent, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type Props = Omit<ComponentProps<"div">, "onSubmit"> & {
  items: ReactNode[];
  emptyLabel: string;
  select: ReactNode;
  addable?: boolean;
  disabled?: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export default function ResourceListForm({
  items,
  emptyLabel,
  select,
  addable,
  disabled,
  onSubmit,
  className,
  ...rest
}: Props) {
  return (
    <div
      className={twMerge(
        "border rounded-lg bg-gray-50 w-full flex flex-col p-2",
        items.length === 0 &&
          "items-center justify-center text-lg text-gray-500",
        disabled && "bg-gray-100 text-gray-500 border-gray-200",
        className,
      )}
      {...rest}
    >
      {items.length === 0 ? (
        <div className="my-3">{emptyLabel}</div>
      ) : (
        <div className="divide-y">{items}</div>
      )}

      <form noValidate className="relative mt-2 w-full" onSubmit={onSubmit}>
        {select}
        <button
          type="submit"
          className="flex absolute top-0 right-0 bottom-0 justify-center items-center p-2.5 text-white bg-blue-500 rounded-r-lg disabled:text-gray-100 disabled:bg-blue-300"
          disabled={disabled || !addable}
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
  );
}
