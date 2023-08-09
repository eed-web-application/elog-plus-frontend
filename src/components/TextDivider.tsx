import { ComponentProps, PropsWithChildren } from "react";
import { twMerge } from "tailwind-merge";

export default function TextDivider({
  children,
  className,
  ...rest
}: PropsWithChildren<ComponentProps<"div">>) {
  return (
    <div className={twMerge("flex items-center", className)} {...rest}>
      <div className="flex-grow border-t"></div>
      <span className="flex-shrink mx-4 text-gray-500">{children}</span>
      <div className="flex-grow border-t"></div>
    </div>
  );
}
