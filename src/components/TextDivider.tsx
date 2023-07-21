import { ComponentProps, PropsWithChildren } from "react";

export default function TextDivider({
  children,
  ...rest
}: PropsWithChildren<ComponentProps<"div">>) {
  return (
    <div className="flex items-center" {...rest}>
      <div className="flex-grow border-t"></div>
      <span className="flex-shrink mx-4 text-gray-500">{children}</span>
      <div className="flex-grow border-t"></div>
    </div>
  );
}
