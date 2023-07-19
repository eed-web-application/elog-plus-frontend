import cn from "classnames";
import DOMPurify from "dompurify";
import { HTMLProps } from "react";

interface Props extends HTMLProps<HTMLDivElement> {
  body: string;
  showEmptyLabel?: boolean;
}

export default function EntryBody({
  body,
  className,
  showEmptyLabel,
  ...rest
}: Props) {
  return (
    <div
      className={cn(
        className,
        !body && "text-gray-500",
        "prose max-w-none overflow-x-auto"
      )}
      dangerouslySetInnerHTML={
        !body && showEmptyLabel
          ? undefined
          : { __html: DOMPurify.sanitize(body) }
      }
      {...rest}
    >
      {!body && showEmptyLabel ? "No entry body" : undefined}
    </div>
  );
}
