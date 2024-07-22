import { Node } from "@tiptap/core";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import {
  EditorOptions,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  mergeAttributes,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import useEntry from "./useEntry";
import EntryRow from "../components/EntryRow";

const EntryReference = (props) => {
  const entryId = props.node.attrs.id;
  const entry = useEntry(entryId);

  if (!entry) {
    return null;
  }

  return (
    <NodeViewWrapper className="border rounded-lg">
      <EntryRow entry={entry} />
    </NodeViewWrapper>
  );
};

const EntryReferenceExtension = Node.create({
  name: "EntryReference",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      id: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "entry-ref",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["entry-ref", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EntryReference);
  },
});

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
        EntryReferenceExtension,
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
