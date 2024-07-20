import { ComponentProps } from "react";
import { useNavigate } from "react-router-dom";
import useEntryEditor from "../hooks/useEntryEditor";
import { EditorContent } from "@tiptap/react";

interface Props extends ComponentProps<typeof EditorContent> {
  body: string;
  showEmptyLabel?: boolean;
}

/**
 * Renders an entry's body text with sanitization and prose styling
 */
export default function EntryBodyText({
  body,
  showEmptyLabel,
  onClick,
  ...rest
}: Props) {
  const navigate = useNavigate();

  // This is here, because if a user clicks on a link in the body, we want to
  // intercept it and use the router to navigate instead of a full page load
  function clickHandler(e: React.MouseEvent<HTMLDivElement>) {
    if (!e.target) {
      return;
    }

    onClick?.(e);

    const targetLink = (e.target as HTMLElement).closest("a");
    if (!targetLink) {
      return;
    }

    if (targetLink.host !== window.location.host) {
      return;
    }

    e.preventDefault();

    const targetPath = targetLink.pathname;

    //Fix path elog/elog/
    const alteredPath = targetPath.replace("elog/", "");

    navigate(alteredPath);
  }

  const editor = useEntryEditor(
    {
      editable: false,
      content: body,
      editorProps: {
        attributes: {
          class: "prose max-w-none overflow-x-auto",
        },
      },
    },
    [body],
  );

  return !body.trim() && showEmptyLabel ? (
    <div className="text-gray-500">No entry body</div>
  ) : (
    <EditorContent {...rest} onClick={clickHandler} editor={editor} />
  );
}
