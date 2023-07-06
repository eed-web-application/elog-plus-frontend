import React, { HTMLProps } from "react";
import cn from "classnames";

export interface Props extends HTMLProps<HTMLDivElement> {
  delectable?: boolean;
  onDelete?: (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => void;
}

export default function Tag({
  delectable,
  className,
  children,
  onDelete,
  ...rest
}: Props) {
  const base =
    "border-gray-400 border text-sm rounded-full flex overflow-hidden justify-center items-center whitespace-nowrap w-fit";

  if (!delectable) {
    return (
      <div
        className={cn(base, "px-1.5 py-0.5 leading-none", className)}
        {...rest}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={cn(base, className)} {...rest}>
      <div className="pl-1.5 py-0.5 leading-none">{children}</div>

      {delectable && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 px-1 h-full hover:bg-gray-200"
          tabIndex={0}
          onClick={onDelete}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
    </div>
  );
}
