import { twJoin, twMerge } from "tailwind-merge";
import {
  PropsWithChildren,
  useState,
  useRef,
  useLayoutEffect,
  forwardRef,
  ComponentProps,
  RefObject,
  memo,
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
import { Attachment, Entry } from "../api";
import EntryList from "./EntryList";
import Chip from "./Chip";
import EntryBodyText from "./EntryBodyText";
import Tooltip from "./Tooltip";
import EntryFigureList from "./EntryFigureList";
import useSpotlightProps from "../hooks/useSpotlightProps";
import { useDraftsStore } from "../draftsStore";
import useEntry from "../hooks/useEntry";
import AttachmentIcon from "./AttachmentIcon";
import { useOnResize, useTriggerResize } from "../hooks/useOnResize";
import useVariableTruncate from "../hooks/useVariableTruncate";
import useTruncate from "../hooks/useTruncate";
import useDisplayTags from "../hooks/useDisplayTags";
import FavoriteButton from "./FavoriteButton";
import TextDivider from "./TextDivider";

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
          entryHighlighted && "hover:bg-yellow-300",
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
function TagList({ tags, entryId }: { tags: string[]; entryId: string }) {
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

  useOnResize(updateTruncation, containerRef.current || undefined, entryId);
  useLayoutEffect(updateTruncation);

  return (
    <div
      className="flex overflow-hidden relative flex-1 w-full pointer-events-none"
      ref={(el) => (containerRef.current = el)}
    >
      {tags.map((tag, index) => (
        <Chip
          key={tag}
          className={twJoin(
            "ml-1.5",
            overflowIndex !== null && index >= overflowIndex && "invisible",
          )}
          ref={(el) => (tagsRef.current[index] = el)}
        >
          {tag}
        </Chip>
      ))}
      <Chip
        ref={mergedDrawerRef}
        {...getReferenceProps()}
        className={twJoin(
          "ml-1.5 absolute pointer-events-auto",
          overflowIndex === null && "invisible",
        )}
        style={{ left: `${drawerOffset}px` }}
        clickable
      >
        ...
      </Chip>
      {isDrawerOpen && overflowIndex !== null && (
        <FloatingPortal>
          <div
            className="z-10 p-1.5 pb-0 mt-1 bg-white rounded-lg shadow"
            style={floatingStyles}
            ref={refs.setFloating}
            {...getFloatingProps()}
          >
            {tags.slice(overflowIndex).map((tag) => (
              <Chip key={tag} className="mb-1.5">
                {tag}
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
      (a.previewState === "Completed" ? 1 : 0),
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
        className,
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
              src={`data:image/png;base64,${attachment.miniPreview}`}
              className={twJoin(
                "flex-shrink-0 w-8 h-8 ml-2 rounded-md object-cover",
              )}
            />
          ) : (
            <AttachmentIcon
              key={attachment.id}
              className={twJoin(
                "flex-shrink-0 w-8 h-8 ml-2 text-gray-500 bg-gray-200 p-1 rounded-md",
              )}
              mimeType={attachment.contentType}
            />
          ),
        )}
      {overflowIndex !== null && (
        <div
          className={twJoin(
            "text-gray-500 text-xs text-right w-6 flex-shrink-0",
          )}
        >
          +{attachments.length - end}
        </div>
      )}
    </div>
  );
}

export interface Props extends ComponentProps<"div"> {
  entry: Entry;
  containerClassName?: string;
  className?: string;
  highlighted?: boolean;
  selected?: boolean;
  showFollowUps?: boolean;
  showReferences?: boolean;
  expandedByDefault?: boolean;
  showDate?: boolean;
  dateBasedOn?: "eventAt" | "loggedAt";
  allowFavorite?: boolean;
  allowFollowUp?: boolean;
  allowSupersede?: boolean;
  allowSpotlight?: boolean;
  allowSpotlightForFollowUps?: boolean;
}

/**
 * Horizontal summary of an entry supporting actions (such as follow up or
 * spotlight) and expanding to see the body content and follows ups.
 */
const EntryRow = memo(
  forwardRef<HTMLDivElement, PropsWithChildren<Props>>(function EntryRow(
    {
      entry,
      containerClassName,
      className,
      highlighted,
      selected,
      showFollowUps,
      showReferences,
      expandedByDefault,
      showDate,
      dateBasedOn = "eventAt",
      allowFavorite,
      allowFollowUp,
      allowSupersede,
      allowSpotlight,
      allowSpotlightForFollowUps,
      ...rest
    },
    ref,
  ) {
    const rowRef = useRef<HTMLDivElement>(null);
    const [expanded, setExpanded] = useState(Boolean(expandedByDefault));
    const fullEntry = useEntry(expanded ? entry.id : undefined, {
      critical: false,
      onError: () => setExpanded(false),
    });

    const hasFollowUpDraft = useDraftsStore((state) =>
      Boolean(state.drafts[`followUp/${entry.id}`]),
    );
    const hasSupersedingDraft = useDraftsStore((state) =>
      Boolean(state.drafts[`supersede/${entry.id}`]),
    );

    // FIXME: See https://github.com/eed-web-application/elog-plus/issues/248
    const logbookIds = entry.logbooks.map(({ id }) => id);
    const tags = entry.tags.filter((tag) =>
      logbookIds.includes(tag.logbook.id),
    );

    const spotlightProps = useSpotlightProps(entry.id);
    const date = dateBasedOn === "loggedAt" ? entry.loggedAt : entry.eventAt;
    const tagNames = useDisplayTags(tags, entry.logbooks.length);

    const triggerResize = useTriggerResize(entry.id);

    let referenceIcon;

    if (
      entry.referencedBy &&
      entry.referencedBy?.length > 0 &&
      entry.references?.length > 0
    ) {
      referenceIcon = (
        // https://remixicon.com/icon/arrow-left-right-line
        <Tooltip label="Referenced by and references other entries">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="inline relative z-10 mr-1 w-4 h-4 text-gray-500"
          >
            <path d="M16.0503 12.0498L21 16.9996L16.0503 21.9493L14.636 20.5351L17.172 17.9988L4 17.9996V15.9996L17.172 15.9988L14.636 13.464L16.0503 12.0498ZM7.94975 2.0498L9.36396 3.46402L6.828 5.9988L20 5.99955V7.99955L6.828 7.9988L9.36396 10.5351L7.94975 11.9493L3 6.99955L7.94975 2.0498Z" />
          </svg>
        </Tooltip>
      );
    } else if (entry.referencedBy && entry.referencedBy?.length > 0) {
      referenceIcon = (
        <Tooltip label="Referenced by other entries">
          {/* https://remixicon.com/icon/arrow-go-back-line */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="inline relative z-10 mr-1 w-4 h-4 text-gray-500"
          >
            <path d="M10.0003 5.00014L19.0002 5L19.0002 7L12.0003 7.00011L12.0002 17.1719L15.9499 13.2222L17.3642 14.6364L11.0002 21.0004L4.63623 14.6364L6.05044 13.2222L10.0002 17.172L10.0003 5.00014Z" />
          </svg>
        </Tooltip>
      );
    } else if (entry.references?.length > 0) {
      referenceIcon = (
        <Tooltip label="References other entries">
          {/* https://remixicon.com/icon/corner-up-left-line */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="inline relative z-10 mr-1 w-4 h-4 text-gray-500"
          >
            <path d="M19.0003 10.0003L19.0004 19.0002L17.0004 19.0002L17.0003 12.0003L6.82845 12.0002L10.7782 15.9499L9.36396 17.3642L3 11.0002L9.36396 4.63623L10.7782 6.05044L6.8284 10.0002L19.0003 10.0003Z" />
          </svg>
        </Tooltip>
      );
    }

    return (
      <div
        ref={ref}
        className={twMerge(
          containerClassName,
          expanded && fullEntry && "border-b",
        )}
        {...rest}
      >
        <div
          ref={rowRef}
          onMouseEnter={triggerResize}
          onMouseLeave={triggerResize}
          className={twMerge(
            "flex items-center group cursor-pointer relative h-12 hover:bg-gray-50",
            selected && "bg-blue-50",
            selected && "hover:bg-blue-100",
            highlighted && "bg-yellow-100",
            highlighted && "hover:bg-yellow-200",
            className,
          )}
          draggable="true"
          data-drag-handle
          data-entry-id={entry.id}
          onDragStart={(e) => {
            e.dataTransfer.setData(
              "text/html",
              `<entry-ref id="${entry.id}"></entry-ref>`,
            );
            // TODO: Set the URL of the entry
            // e.dataTransfer.setData("text/uri-list", "https://www.mozilla.org");
          }}
        >
          <div className="flex flex-col justify-center items-center px-2 w-16">
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
          <div className="flex overflow-hidden flex-col flex-1 py-1">
            <Link
              to={{
                pathname: `/${entry.id}`,
                search: window.location.search,
              }}
              // See https://inclusive-components.design/cards/
              className="truncate leading-[1.2] after:absolute after:left-0 after:right-0 after:bottom-0 after:top-0 text-inherit no-underline font-normal"
              // Since the whole row is draggable, we don't want the link to be draggable
              draggable="false"
            >
              {referenceIcon}
              {Boolean(entry.followingUp) && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="inline mr-1 w-4 h-4 text-gray-500"
                >
                  <path d="M3.505 2.365A41.369 41.369 0 019 2c1.863 0 3.697.124 5.495.365 1.247.167 2.18 1.108 2.435 2.268a4.45 4.45 0 00-.577-.069 43.141 43.141 0 00-4.706 0C9.229 4.696 7.5 6.727 7.5 8.998v2.24c0 1.413.67 2.735 1.76 3.562l-2.98 2.98A.75.75 0 015 17.25v-3.443c-.501-.048-1-.106-1.495-.172C2.033 13.438 1 12.162 1 10.72V5.28c0-1.441 1.033-2.717 2.505-2.914z" />
                  <path d="M14 6c-.762 0-1.52.02-2.271.062C10.157 6.148 9 7.472 9 8.998v2.24c0 1.519 1.147 2.839 2.71 2.935.214.013.428.024.642.034.2.009.385.09.518.224l2.35 2.35a.75.75 0 001.28-.531v-2.07c1.453-.195 2.5-1.463 2.5-2.915V8.998c0-1.526-1.157-2.85-2.729-2.936A41.645 41.645 0 0014 6z" />
                </svg>
              )}
              {entry.title}
            </Link>
            <div className="flex items-center h-5">
              <div className="text-sm leading-none text-gray-500 whitespace-nowrap truncate">
                {`${entry.logbooks
                  .map(({ name }) => name.toUpperCase())
                  .join(", ")} • ${entry.loggedBy}`}
              </div>
              <TagList tags={tagNames} entryId={entry.id} />
            </div>
          </div>
          <AttachmentList attachments={entry.attachments} parentRef={rowRef} />
          <FloatingDelayGroup delay={200}>
            <div className="hidden pl-3 group-hover:flex">
              {allowSpotlight && (
                <RowButton
                  tooltip="Spotlight"
                  entrySelected={selected}
                  entryHighlighted={highlighted}
                  {...spotlightProps}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                      clipRule="evenodd"
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
                      className="absolute"
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
            </div>
            {allowFavorite && (
              <FavoriteButton
                entryId={entry.id}
                className={twMerge(
                  "z-0",
                  selected && "hover:bg-blue-200",
                  highlighted && "hover:bg-yellow-300",
                )}
                favoriteIconClassName="hidden group-hover:block"
              />
            )}
          </FloatingDelayGroup>
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
              highlighted && "hover:bg-yellow-300",
            )}
            onClick={() => setExpanded((expanded) => !expanded)}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </div>
        {expanded && fullEntry && (
          <>
            <div
              className={twJoin(
                "p-2 pb-1 bg-gray-100",
                !fullEntry.text && "text-gray-500",
              )}
            >
              <EntryBodyText body={fullEntry.text} showEmptyLabel />
              <EntryFigureList attachments={fullEntry.attachments} />
            </div>
            {showFollowUps && fullEntry.followUps.length > 0 && (
              <>
                <div className="pt-2 pr-2 ml-6">
                  <EntryList
                    entries={fullEntry.followUps}
                    showDate
                    showFollowUps
                    showReferences={showReferences}
                    allowFollowUp={allowFollowUp}
                    allowSupersede={allowSupersede}
                    allowSpotlight={allowSpotlightForFollowUps}
                  />
                </div>
              </>
            )}
            {showReferences &&
              fullEntry.referencedBy &&
              fullEntry.referencedBy.length > 0 && (
                <>
                  <TextDivider>Referenced By</TextDivider>
                  <div className="pt-2 pr-2 ml-6">
                    <EntryList
                      entries={fullEntry.referencedBy}
                      showDate
                      showFollowUps={showFollowUps}
                      showReferences
                      allowFollowUp={allowFollowUp}
                      allowSupersede={allowSupersede}
                      allowSpotlight={allowSpotlightForFollowUps}
                    />
                  </div>
                </>
              )}
          </>
        )}
      </div>
    );
  }),
);

export default EntryRow;
