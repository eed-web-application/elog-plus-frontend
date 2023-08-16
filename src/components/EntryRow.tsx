import { twJoin, twMerge } from "tailwind-merge";
import {
  PropsWithChildren,
  useState,
  useRef,
  useLayoutEffect,
  forwardRef,
  ComponentProps,
  RefObject,
} from "react";
import { Link, LinkProps } from "react-router-dom";
import {
  FloatingDelayGroup,
  FloatingPortal,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useMergeRefs,
  useRole,
} from "@floating-ui/react";
import { IconButton } from "./base";
import { Attachment, EntrySummary, Tag, getAttachmentPreviewURL } from "../api";
import EntryList from "./EntryList";
import Chip from "./Chip";
import EntryBodyText from "./EntryBodyText";
import Tooltip from "./Tooltip";
import EntryFigureList from "./EntryFigureList";
import useSpotlightProps from "../hooks/useSpotlightProps";
import { useDraftsStore } from "../draftsStore";
import useEntry from "../hooks/useEntry";
import AttachmentIcon from "./AttachmentIcon";
import { useOnResize } from "../hooks/useOnResize";
import useVariableTruncate from "../hooks/useVariableTruncate";
import useTruncate from "../hooks/useTruncate";

const ATTACHMENTS_PREVIEW_MAX_WIDTH = 1 / 4;

function RowButton({
  children,
  tooltip,
  entrySelected,
  entryHighlighted,
  onClick,
  marked = false,
  ...rest
}: PropsWithChildren<
  LinkProps & {
    tooltip: string;
    active?: boolean;
    entrySelected?: boolean;
    entryHighlighted?: boolean;
    marked?: boolean;
  }
>) {
  return (
    <Tooltip label={tooltip}>
      <Link
        className={twMerge(
          IconButton,
          "z-0 relative",
          entrySelected && "hover:bg-blue-200",
          entryHighlighted && "hover:bg-yellow-300"
        )}
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(e);
        }}
        {...rest}
      >
        {children}
        {marked && (
          <div className="absolute top-0.5 right-0.5 text-sm text-gray-500">
            *
          </div>
        )}
      </Link>
    </Tooltip>
  );
}

/**
 * Single line tag list supporting truncation based on available width and
 * an overflow drawer (an ellipsis that when hovered, displays the rest of the
 * tags with floating element)
 */
function TagList({ tags }: { tags: Tag[] }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isDrawerOpen,
    onOpenChange: setIsDrawerOpen,
  });

  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  const {
    updateTruncation,
    overflowIndex,
    drawerOffset,
    containerRef,
    itemsRef: tagsRef,
    drawerRef,
  } = useVariableTruncate(tags.length);

  const mergedDrawerRef = useMergeRefs([refs.setReference, drawerRef]);

  useOnResize(updateTruncation, containerRef.current || undefined);
  useLayoutEffect(updateTruncation);

  return (
    <div
      className="flex flex-1 overflow-hidden relative w-full pointer-events-none"
      ref={(el) => (containerRef.current = el)}
    >
      {tags.map((tag, index) => (
        <Chip
          key={tag.id}
          className={twJoin(
            "ml-1.5",
            overflowIndex !== null && index >= overflowIndex && "invisible"
          )}
          ref={(el) => (tagsRef.current[index] = el)}
        >
          {tag.name}
        </Chip>
      ))}
      <Chip
        ref={mergedDrawerRef}
        {...getReferenceProps()}
        className={twJoin(
          "ml-1.5 absolute pointer-events-auto",
          overflowIndex === null && "invisible"
        )}
        style={{ left: `${drawerOffset}px` }}
        clickable
      >
        ...
      </Chip>
      {isDrawerOpen && overflowIndex !== null && (
        <FloatingPortal>
          <div
            className="shadow rounded-lg bg-white p-1.5 pb-0 mt-1 z-10"
            style={floatingStyles}
            ref={refs.setFloating}
            {...getFloatingProps()}
          >
            {tags.slice(overflowIndex).map((tag) => (
              <Chip key={tag.id} className="mb-1.5">
                {tag.name}
              </Chip>
            ))}
          </div>
        </FloatingPortal>
      )}
    </div>
  );
}

function AttachmentList({
  attachments,
  className,
  parentRef,
  ...rest
}: {
  attachments: Attachment[];
  parentRef: RefObject<HTMLDivElement>;
} & ComponentProps<"div">) {
  const figuresFirst = [...attachments];
  const containerRef = useRef(null);

  figuresFirst.sort(
    (a, b) =>
      (b.previewState === "Completed" ? 1 : 0) -
      (a.previewState === "Completed" ? 1 : 0)
  );

  const { updateTruncation, overflowIndex, width } = useTruncate({
    count: attachments.length,
    itemWidth: 40,
    drawerWidth: 24,
    getMaxWidth: () =>
      parentRef.current === null
        ? Infinity
        : parentRef.current.getBoundingClientRect().width *
          ATTACHMENTS_PREVIEW_MAX_WIDTH,
  });

  const end = overflowIndex ?? attachments.length;

  useOnResize(updateTruncation, containerRef.current || undefined);
  useLayoutEffect(updateTruncation);

  return (
    <div
      className={twMerge(
        "flex relative items-center overflow-hidden w-fit justify-end pointer-events-none",
        className
      )}
      style={{ width: `${width}px` }}
      ref={containerRef}
      {...rest}
    >
      {figuresFirst
        .slice(0, end)
        .map((attachment) =>
          attachment.previewState === "Completed" ? (
            <img
              key={attachment.id}
              src={getAttachmentPreviewURL(attachment.id)}
              className={twJoin(
                "flex-shrink-0 w-8 h-8 ml-2 rounded-md object-cover"
              )}
            />
          ) : (
            <AttachmentIcon
              key={attachment.id}
              className={twJoin(
                "flex-shrink-0 w-8 h-8 ml-2 text-gray-500 bg-gray-200 p-1 rounded-md"
              )}
              mimeType={attachment.contentType}
            />
          )
        )}
      {overflowIndex !== null && (
        <div
          className={twJoin(
            "text-gray-500 text-xs text-right w-6 flex-shrink-0"
          )}
        >
          +{attachments.length - end}
        </div>
      )}
    </div>
  );
}

export interface Props extends ComponentProps<"div"> {
  entry: EntrySummary;
  containerClassName?: string;
  className?: string;
  highlighted?: boolean;
  selected?: boolean;
  selectable?: boolean;
  expandable?: boolean;
  showFollowUps?: boolean;
  expandedByDefault?: boolean;
  showDate?: boolean;
  dateBasedOn?: "eventAt" | "loggedAt";
  allowFollowUp?: boolean;
  allowSupersede?: boolean;
  allowSpotlight?: boolean;
  allowSpotlightForFollowUps?: boolean;
}

/**
 * Horizontal summary of an entry supporting actions (such as follow up or
 * spotlight) and expanding to see the body content and follows ups.
 */
const EntryRow = forwardRef<HTMLDivElement, PropsWithChildren<Props>>(
  (
    {
      entry,
      containerClassName,
      className,
      highlighted,
      selected,
      selectable,
      expandable,
      showFollowUps,
      expandedByDefault,
      showDate,
      dateBasedOn = "eventAt",
      allowFollowUp,
      allowSupersede,
      allowSpotlight,
      allowSpotlightForFollowUps,
      ...rest
    },
    ref
  ) => {
    const rowRef = useRef<HTMLDivElement>(null);
    const [expanded, setExpanded] = useState(Boolean(expandedByDefault));
    const fullEntry = useEntry(expanded ? entry.id : undefined, {
      critical: false,
      onError: () => setExpanded(false),
    });

    const [hasFollowUpDraft, hasSupersedingDraft] = useDraftsStore(
      ({ drafts }) => [
        Boolean(drafts[`followUp/${entry.id}`]),
        Boolean(drafts[`supersede/${entry.id}`]),
      ]
    );

    const spotlightProps = useSpotlightProps(entry.id);
    const date = dateBasedOn === "loggedAt" ? entry.loggedAt : entry.eventAt;

    return (
      <div ref={ref} className={containerClassName} {...rest}>
        <div
          ref={rowRef}
          className={twMerge(
            "flex items-center group",
            selectable && "cursor-pointer relative hover:bg-gray-50",
            selected && "bg-blue-50",
            selected && selectable && "hover:bg-blue-100",
            highlighted && "bg-yellow-100",
            highlighted && selectable && "hover:bg-yellow-200",
            className
          )}
        >
          <div className="px-2 flex flex-col justify-center items-center w-16">
            {showDate && (
              <div className="text-sm">
                {date.toLocaleDateString("en-us", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            )}
            <div className="leading-none">
              {date.toLocaleString("en-us", {
                hour: "numeric",
                minute: "numeric",
                hourCycle: "h23",
              })}
            </div>
          </div>
          <div className="flex-1 flex flex-col py-1 overflow-hidden">
            {selectable ? (
              <Link
                to={{
                  pathname: `/${entry.id}`,
                  search: window.location.search,
                }}
                // see https://inclusive-components.design/cards/
                className="truncate leading-[1.2] after:absolute after:left-0 after:right-0 after:bottom-0 after:top-0"
              >
                {entry.title}
              </Link>
            ) : (
              <div className="truncate leading-[1.2]">{entry.title}</div>
            )}
            <div className="flex items-center h-5">
              <div className="text-sm text-gray-500 leading-none whitespace-nowrap truncate">
                {`${entry.logbooks
                  .map(({ name }) => name.toUpperCase())
                  .join(", ")} • ${entry.loggedBy}`}
              </div>
              <TagList tags={entry.tags} />
            </div>
          </div>
          <AttachmentList attachments={entry.attachments} parentRef={rowRef} />
          <div className="pl-3 hidden group-hover:flex">
            <FloatingDelayGroup delay={200}>
              {allowSpotlight && (
                <RowButton
                  tooltip="Spotlight"
                  entrySelected={selected}
                  entryHighlighted={highlighted}
                  {...spotlightProps}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                </RowButton>
              )}

              {allowSupersede && (
                <RowButton
                  tooltip="Supersede"
                  to={{
                    pathname: `/${entry.id}/supersede`,
                    search: window.location.search,
                  }}
                  entrySelected={selected}
                  entryHighlighted={highlighted}
                  marked={hasSupersedingDraft}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                      className="absolute "
                    />
                  </svg>
                </RowButton>
              )}

              {allowFollowUp && (
                <RowButton
                  tooltip="Follow up"
                  to={{
                    pathname: `/${entry.id}/follow-up`,
                    search: window.location.search,
                  }}
                  entrySelected={selected}
                  entryHighlighted={highlighted}
                  marked={hasFollowUpDraft}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3"
                    />
                  </svg>
                </RowButton>
              )}
            </FloatingDelayGroup>
          </div>
          {expandable && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              tabIndex={0}
              className={twMerge(
                IconButton,
                "z-0",
                expanded && "rotate-180",
                selected && "hover:bg-blue-200",
                highlighted && "hover:bg-yellow-300"
              )}
              onClick={() => setExpanded((expanded) => !expanded)}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          )}
        </div>
        {expanded && fullEntry && (
          <>
            <div
              className={twJoin(
                "p-2 pb-1 bg-gray-100",
                !fullEntry.text && "text-gray-500"
              )}
            >
              <EntryBodyText body={fullEntry.text} showEmptyLabel />
              <EntryFigureList attachments={fullEntry.attachments} />
            </div>
            {showFollowUps && fullEntry.followUps.length > 0 && (
              <div className="ml-6 pt-2 pr-2">
                <EntryList
                  entries={fullEntry.followUps}
                  selectable
                  expandable
                  showDate
                  showFollowUps={showFollowUps}
                  allowFollowUp={allowFollowUp}
                  allowSupersede={allowSupersede}
                  allowSpotlight={allowSpotlightForFollowUps}
                />
              </div>
            )}
          </>
        )}
      </div>
    );
  }
);

export default EntryRow;
