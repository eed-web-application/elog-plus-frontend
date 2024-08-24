import {
  EditorContent,
  Editor,
  EditorContentProps,
  EditorEvents,
  BubbleMenu,
} from "@tiptap/react";
import { twJoin, twMerge } from "tailwind-merge";
import { Input, Modal } from "./base";
import {
  ComponentProps,
  PropsWithChildren,
  forwardRef,
  useEffect,
  useState,
} from "react";
import Select from "./Select";
import useEntryEditor from "../hooks/useEntryEditor";
import EntrySelectDialog from "./EntrySelectDialog";
import Dialog from "./Dialog";
import { FloatingDelayGroup } from "@floating-ui/react";
import Tooltip from "./Tooltip";

const MenuButton = forwardRef<
  HTMLButtonElement,
  Omit<ComponentProps<"button">, "type"> & {
    disabled?: boolean;
    active?: boolean;
    tooltip: string;
  }
>(({ children, className, disabled, active, ...rest }, ref) => {
  return (
    <Tooltip label={rest.tooltip} disabled={disabled}>
      <button
        ref={ref}
        disabled={disabled}
        className={twMerge(
          "rounded text-black p-1 hover:bg-gray-100",
          disabled && "text-gray-400 hover:bg-transparent",
          active && "bg-blue-500 hover:bg-blue-600 text-white",
          className,
        )}
        type="button"
        // Don't want to lose focus
        onMouseDown={(e) => e.preventDefault()}
        {...rest}
      >
        {children}
      </button>
    </Tooltip>
  );
});

// We only want to show the users these options since that's what most people
// use
const supportedOptions = ["Normal", "H1", "H2", "H3", "Code"] as const;
// However, there are still other options that are supported, so if the user
// uses a shortcut or another method to get the option, we still want to show it
const allOptions = [
  "Normal",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "Code",
] as const;

function getFormat(editor: Editor): (typeof allOptions)[number] {
  for (let i = 1; i <= 6; i++) {
    if (editor.isActive("heading", { level: i })) {
      return `H${i}` as (typeof allOptions)[number];
    }
  }
  if (editor.isActive("codeBlock")) {
    return "Code";
  }
  return "Normal";
}

function setFormat(editor: Editor, format: (typeof allOptions)[number]) {
  if (format[0] === "H") {
    const level = parseInt(format[1]) as 1 | 2 | 3 | 4 | 5 | 6;
    editor.chain().focus().setHeading({ level }).run();
  }
  if (format === "Code") {
    editor.chain().focus().setCodeBlock().run();
  }
  if (format === "Normal") {
    editor.chain().focus().setParagraph().run();
  }
}

function MenuButtonDropDown({ editor }: { editor: Editor }) {
  const selected = getFormat(editor);

  return (
    <Select
      searchType="none"
      options={supportedOptions}
      value={selected}
      setValue={(value) =>
        setFormat(editor, value as (typeof allOptions)[number])
      }
      className="w-32 !py-0.5"
    />
  );
}

function MenuButtonGroup({
  children,
  className,
  ...rest
}: PropsWithChildren<ComponentProps<"div">>) {
  return (
    <div
      className={twMerge("flex gap-1 px-2 items-center", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

function MenuBar({ editor }: { editor: Editor | null }) {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap py-2 rounded-t-lg border divide-x">
      <FloatingDelayGroup delay={200}>
        <MenuButtonGroup>
          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            tooltip="Undo"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M5.82843 6.99955L8.36396 9.53509L6.94975 10.9493L2 5.99955L6.94975 1.0498L8.36396 2.46402L5.82843 4.99955H13C17.4183 4.99955 21 8.58127 21 12.9996C21 17.4178 17.4183 20.9996 13 20.9996H4V18.9996H13C16.3137 18.9996 19 16.3133 19 12.9996C19 9.68584 16.3137 6.99955 13 6.99955H5.82843Z"
                clipRule="evenodd"
              />
            </svg>
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            tooltip="Redo"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M18.1716 6.99955H11C7.68629 6.99955 5 9.68584 5 12.9996C5 16.3133 7.68629 18.9996 11 18.9996H20V20.9996H11C6.58172 20.9996 3 17.4178 3 12.9996C3 8.58127 6.58172 4.99955 11 4.99955H18.1716L15.636 2.46402L17.0503 1.0498L22 5.99955L17.0503 10.9493L15.636 9.53509L18.1716 6.99955Z"
                clipRule="evenodd"
              />
            </svg>
          </MenuButton>
        </MenuButtonGroup>
        <MenuButtonGroup>
          <MenuButtonDropDown editor={editor} />
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            tooltip="Bold"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M8 11H12.5C13.8807 11 15 9.88071 15 8.5C15 7.11929 13.8807 6 12.5 6H8V11ZM18 15.5C18 17.9853 15.9853 20 13.5 20H6V4H12.5C14.9853 4 17 6.01472 17 8.5C17 9.70431 16.5269 10.7981 15.7564 11.6058C17.0979 12.3847 18 13.837 18 15.5ZM8 13V18H13.5C14.8807 18 16 16.8807 16 15.5C16 14.1193 14.8807 13 13.5 13H8Z"
                clipRule="evenodd"
              />
            </svg>
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            tooltip="Italic"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M15 20H7V18H9.92661L12.0425 6H9V4H17V6H14.0734L11.9575 18H15V20Z"
                clipRule="evenodd"
              />
            </svg>
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={!editor.can().chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            tooltip="Underline"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M8 3V12C8 14.2091 9.79086 16 12 16C14.2091 16 16 14.2091 16 12V3H18V12C18 15.3137 15.3137 18 12 18C8.68629 18 6 15.3137 6 12V3H8ZM4 20H20V22H4V20Z"
                clipRule="evenodd"
              />
            </svg>
          </MenuButton>

          <MenuButton
            onClick={() =>
              editor.isActive("link")
                ? editor.chain().focus().unsetLink().run()
                : editor.chain().focus().setLink({ href: "" }).run()
            }
            active={editor.isActive("link")}
            tooltip="Link"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M18.3643 15.5353L16.95 14.1211L18.3643 12.7069C20.3169 10.7543 20.3169 7.58847 18.3643 5.63585C16.4116 3.68323 13.2458 3.68323 11.2932 5.63585L9.87898 7.05007L8.46477 5.63585L9.87898 4.22164C12.6127 1.48797 17.0448 1.48797 19.7785 4.22164C22.5121 6.95531 22.5121 11.3875 19.7785 14.1211L18.3643 15.5353ZM15.5358 18.3638L14.1216 19.778C11.388 22.5117 6.9558 22.5117 4.22213 19.778C1.48846 17.0443 1.48846 12.6122 4.22213 9.87849L5.63634 8.46428L7.05055 9.87849L5.63634 11.2927C3.68372 13.2453 3.68372 16.4112 5.63634 18.3638C7.58896 20.3164 10.7548 20.3164 12.7074 18.3638L14.1216 16.9496L15.5358 18.3638ZM14.8287 7.75717L16.2429 9.17139L9.17187 16.2425L7.75766 14.8282L14.8287 7.75717Z"
                clipRule="evenodd"
              />
            </svg>
          </MenuButton>
          {/* Disabling strike throughs, because it doesn't seem useful */}
          {/* <MenuButton */}
          {/*   onClick={() => editor.chain().focus().toggleStrike().run()} */}
          {/*   disabled={!editor.can().chain().focus().toggleStrike().run()} */}
          {/*   active={editor.isActive("strike")} */}
          {/* > */}
          {/*   <svg */}
          {/*     xmlns="http://www.w3.org/2000/svg" */}
          {/*     viewBox="0 0 24 24" */}
          {/*     fill="currentColor" */}
          {/*     className="w-6 h-6" */}
          {/*   > */}
          {/*     <path */}
          {/*       fillRule="evenodd" */}
          {/*       d="M17.1538 14C17.3846 14.5161 17.5 15.0893 17.5 15.7196C17.5 17.0625 16.9762 18.1116 15.9286 18.867C14.8809 19.6223 13.4335 20 11.5862 20C9.94674 20 8.32335 19.6185 6.71592 18.8555V16.6009C8.23538 17.4783 9.7908 17.917 11.3822 17.917C13.9333 17.917 15.2128 17.1846 15.2208 15.7196C15.2208 15.0939 15.0049 14.5598 14.5731 14.1173C14.5339 14.0772 14.4939 14.0381 14.4531 14H3V12H21V14H17.1538ZM13.076 11H7.62908C7.4566 10.8433 7.29616 10.6692 7.14776 10.4778C6.71592 9.92084 6.5 9.24559 6.5 8.45207C6.5 7.21602 6.96583 6.165 7.89749 5.299C8.82916 4.43299 10.2706 4 12.2219 4C13.6934 4 15.1009 4.32808 16.4444 4.98426V7.13591C15.2448 6.44921 13.9293 6.10587 12.4978 6.10587C10.0187 6.10587 8.77917 6.88793 8.77917 8.45207C8.77917 8.87172 8.99709 9.23796 9.43293 9.55079C9.86878 9.86362 10.4066 10.1135 11.0463 10.3004C11.6665 10.4816 12.3431 10.7148 13.076 11H13.076Z" */}
          {/*       clipRule="evenodd" */}
          {/*     /> */}
          {/*   </svg> */}
          {/* </MenuButton> */}
          <MenuButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={!editor.can().chain().focus().toggleCode().run()}
            active={editor.isActive("code")}
            tooltip="Inline code"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M16.95 8.46451L18.3642 7.05029L23.3139 12L18.3642 16.9498L16.95 15.5356L20.4855 12L16.95 8.46451ZM7.05048 8.46451L3.51495 12L7.05048 15.5356L5.63627 16.9498L0.686523 12L5.63627 7.05029L7.05048 8.46451Z"
                clipRule="evenodd"
              />
            </svg>
          </MenuButton>
        </MenuButtonGroup>

        <MenuButtonGroup>
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            tooltip="Bullet list"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M8 4H21V6H8V4ZM4.5 6.5C3.67157 6.5 3 5.82843 3 5C3 4.17157 3.67157 3.5 4.5 3.5C5.32843 3.5 6 4.17157 6 5C6 5.82843 5.32843 6.5 4.5 6.5ZM4.5 13.5C3.67157 13.5 3 12.8284 3 12C3 11.1716 3.67157 10.5 4.5 10.5C5.32843 10.5 6 11.1716 6 12C6 12.8284 5.32843 13.5 4.5 13.5ZM4.5 20.4C3.67157 20.4 3 19.7284 3 18.9C3 18.0716 3.67157 17.4 4.5 17.4C5.32843 17.4 6 18.0716 6 18.9C6 19.7284 5.32843 20.4 4.5 20.4ZM8 11H21V13H8V11ZM8 18H21V20H8V18Z"
                clipRule="evenodd"
              />
            </svg>
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            tooltip="Ordered list"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M8 4H21V6H8V4ZM5 3V6H6V7H3V6H4V4H3V3H5ZM3 14V11.5H5V11H3V10H6V12.5H4V13H6V14H3ZM5 19.5H3V18.5H5V18H3V17H6V21H3V20H5V19.5ZM8 11H21V13H8V11ZM8 18H21V20H8V18Z"
                clipRule="evenodd"
              />
            </svg>
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            tooltip="Blockquote"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M19.4167 6.67891C20.4469 7.77257 21.0001 9 21.0001 10.9897C21.0001 14.4891 18.5436 17.6263 14.9695 19.1768L14.0768 17.7992C17.4121 15.9946 18.0639 13.6539 18.3245 12.178C17.7875 12.4557 17.0845 12.5533 16.3954 12.4895C14.591 12.3222 13.1689 10.8409 13.1689 9C13.1689 7.067 14.7359 5.5 16.6689 5.5C17.742 5.5 18.7681 5.99045 19.4167 6.67891ZM9.41669 6.67891C10.4469 7.77257 11.0001 9 11.0001 10.9897C11.0001 14.4891 8.54359 17.6263 4.96951 19.1768L4.07682 17.7992C7.41206 15.9946 8.06392 13.6539 8.32447 12.178C7.78747 12.4557 7.08452 12.5533 6.39539 12.4895C4.59102 12.3222 3.16895 10.8409 3.16895 9C3.16895 7.067 4.73595 5.5 6.66895 5.5C7.742 5.5 8.76814 5.99045 9.41669 6.67891Z"
                clipRule="evenodd"
              />
            </svg>
          </MenuButton>
        </MenuButtonGroup>
        <MenuButtonGroup>
          <Dialog>
            <Dialog.Content returnFocus={false}>
              <EntrySelectDialog
                onSelect={(entry) =>
                  editor
                    .chain()
                    .focus()
                    .insertContent({
                      type: "EntryReference",
                      attrs: { id: entry.id },
                    })
                    .run()
                }
              />
            </Dialog.Content>

            <Dialog.Trigger>
              <MenuButton tooltip="Insert entry">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M15 4H5V20H19V8H15V4ZM3 2.9918C3 2.44405 3.44749 2 3.9985 2H16L20.9997 7L21 20.9925C21 21.5489 20.5551 22 20.0066 22H3.9934C3.44476 22 3 21.5447 3 21.0082V2.9918ZM13.529 14.4464C11.9951 15.3524 9.98633 15.1464 8.66839 13.8284C7.1063 12.2663 7.1063 9.73367 8.66839 8.17157C10.2305 6.60948 12.7631 6.60948 14.3252 8.17157C15.6432 9.48951 15.8492 11.4983 14.9432 13.0322L17.1537 15.2426L15.7395 16.6569L13.529 14.4464ZM12.911 12.4142C13.6921 11.6332 13.6921 10.3668 12.911 9.58579C12.13 8.80474 10.8637 8.80474 10.0826 9.58579C9.30156 10.3668 9.30156 11.6332 10.0826 12.4142C10.8637 13.1953 12.13 13.1953 12.911 12.4142Z"
                    clipRule="evenodd"
                  />
                </svg>
              </MenuButton>
            </Dialog.Trigger>
          </Dialog>
        </MenuButtonGroup>
      </FloatingDelayGroup>
    </div>
  );
}

function LinkBubbleMenu({
  value,
  onChange,
  onRemove,
}: {
  value?: string;
  onChange: (newValue: string, focus?: boolean) => void;
  onRemove: () => void;
}) {
  const [stagedValue, setStagedValue] = useState(value || "");

  useEffect(() => {
    setStagedValue(value || "");
  }, [value]);

  return (
    <div className={twJoin(Modal, "p-1.5 shadow-lg flex items-center")}>
      <input
        placeholder="http://www.google.com"
        className={twMerge(Input, "text-sm")}
        onChange={(e) => setStagedValue(e.target.value)}
        value={stagedValue}
        onBlur={() => {
          onChange(stagedValue);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onChange(stagedValue, true);
          }
        }}
      />
      <MenuButton className="ml-1" onClick={onRemove}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path d="M17.657 14.8286L16.2428 13.4143L17.657 12.0001C19.2191 10.438 19.2191 7.90538 17.657 6.34328C16.0949 4.78118 13.5622 4.78118 12.0001 6.34328L10.5859 7.75749L9.17171 6.34328L10.5859 4.92907C12.9291 2.58592 16.7281 2.58592 19.0712 4.92907C21.4143 7.27221 21.4143 11.0712 19.0712 13.4143L17.657 14.8286ZM14.8286 17.657L13.4143 19.0712C11.0712 21.4143 7.27221 21.4143 4.92907 19.0712C2.58592 16.7281 2.58592 12.9291 4.92907 10.5859L6.34328 9.17171L7.75749 10.5859L6.34328 12.0001C4.78118 13.5622 4.78118 16.0949 6.34328 17.657C7.90538 19.2191 10.438 19.2191 12.0001 17.657L13.4143 16.2428L14.8286 17.657ZM14.8286 7.75749L16.2428 9.17171L9.17171 16.2428L7.75749 14.8286L14.8286 7.75749ZM5.77539 2.29303L7.70724 1.77539L8.74252 5.63909L6.81067 6.15673L5.77539 2.29303ZM15.2578 18.3612L17.1896 17.8435L18.2249 21.7072L16.293 22.2249L15.2578 18.3612ZM2.29303 5.77539L6.15673 6.81067L5.63909 8.74252L1.77539 7.70724L2.29303 5.77539ZM18.3612 15.2578L22.2249 16.293L21.7072 18.2249L17.8435 17.1896L18.3612 15.2578Z"></path>
        </svg>
      </MenuButton>
    </div>
  );
}

/**
 * WYSIWYG editor that renders to HTML
 */
export default function EntryBodyTextEditor({
  value,
  onChange,
  ...rest
}: Omit<EditorContentProps, "value" | "onChange" | "ref" | "editor"> & {
  value: string;
  onChange: (value: string) => void;
}) {
  const editor = useEntryEditor({
    editorProps: {
      attributes: {
        class: twMerge(
          Input,
          "prose focus:ring-0 rounded-t-none border-t-transparent max-w-none",
        ),
      },
    },
    content: value,
  });

  useEffect(() => {
    function handler({ editor }: EditorEvents["update"]) {
      if (editor.isEmpty) {
        onChange("");
      } else {
        onChange(editor.getHTML());
      }
    }

    editor?.on("update", handler);
    return () => {
      editor?.off("update", handler);
    };
  }, [editor, onChange]);

  return (
    <div>
      <MenuBar editor={editor} />
      {editor && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor }) => editor.isActive("link")}
        >
          <LinkBubbleMenu
            value={editor.getAttributes("link").href}
            onChange={(value, focus) => {
              (focus ? editor.chain().focus() : editor.chain())
                .extendMarkRange("link")
                .updateAttributes("link", { href: value })
                .run();
            }}
            onRemove={() => {
              editor.chain().focus().unsetLink().run();
            }}
          />
        </BubbleMenu>
      )}
      <EditorContent {...rest} editor={editor} />
    </div>
  );
}
