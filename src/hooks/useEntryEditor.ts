import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { EditorOptions, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export default function useEntryEditor(
  options?: Partial<EditorOptions>,
  deps?: React.DependencyList | undefined,
) {
  return useEditor(
    {
      extensions: [
        StarterKit.configure({
          bulletList: {
            keepMarks: true,
            keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
          },
          orderedList: {
            keepMarks: true,
            keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
          },
          // dropcursor: false,
        }),
        Underline,
        Link.extend({
          // We don't want to keep any attributes (besides href) when drag and
          // dropping. We, specifically, want to get rid of the class attribute,
          // because when the user drags and drops an entry, the classes are
          // kept.
          addAttributes() {
            return {
              href: {
                default: null,
              },
            };
          },
        }).configure({
          openOnClick: false,
        }),
      ],
      ...options,
    },
    deps,
  );
}
