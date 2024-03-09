import { twMerge } from "tailwind-merge";
import DOMPurify from "dompurify";
import { ComponentProps } from "react";
import { useNavigate } from "react-router-dom";

interface Props extends ComponentProps<"div"> {
  body: string;
  showEmptyLabel?: boolean;
}

/**
 * Renders an entry's body text with sanitization and prose styling
 */
export default function EntryBodyText({
  body,
  className,
  showEmptyLabel,
  ...rest
}: Props) {
  const navigate = useNavigate();

  // This is here, because if a user clicks on a link in the body, we want to
  // intercept it and use the router to navigate instead of a full page load
  function clickHandler(e: React.MouseEvent<HTMLDivElement>) {
    if (!e.target) {
      return;
    }

    const targetLink = (e.target as HTMLElement).closest("a");
    if (!targetLink) {
      return;
    }

    if (targetLink.host !== window.location.host) {
      return;
    }

    e.preventDefault();

    navigate(targetLink.pathname);
  }

  return (
    <div
      onClick={clickHandler}
      className={twMerge(
        "prose max-w-none overflow-x-auto",
        !body && "text-gray-500",
        className
      )}
      dangerouslySetInnerHTML={
        !body.trim() && showEmptyLabel
          ? undefined
          : { __html: DOMPurify.sanitize(body) }
      }
      {...rest}
    >
      {!body.trim() && showEmptyLabel ? "No entry body" : undefined}
    </div>
  );
}
