import React, { HTMLProps, forwardRef } from "react";
import cn from "classnames";

export interface Props extends HTMLProps<HTMLDivElement> {
  delectable?: boolean;
  clickable?: boolean;
  onDelete?: (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => void;
}

const Tag = forwardRef<HTMLDivElement, Props>(function Tag(
  { delectable, clickable, className, children, onDelete, ...rest },
  ref
) {
  const base = cn(
    "border-gray-400 border text-sm rounded-full flex justify-center items-center whitespace-nowrap w-fit",
    clickable && "hover:bg-gray-200"
  );

  if (!delectable) {
    return (
      <div
        className={cn(base, "px-1.5 py-0.5 leading-none", className)}
        ref={ref}
        {...rest}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={cn(base, className)} ref={ref} {...rest}>
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
});

export default Tag;
