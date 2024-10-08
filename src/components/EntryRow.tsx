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
  useContext,
} from "react";
import { Link } from "react-router-dom";
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
import StickyEntryRow from "../StickyEntryRowContext";
import Button from "./Button";
import useDelayedLoader from "../hooks/useDelayedLoader";
import Spinner from "./Spinner";

const ATTACHMENTS_PREVIEW_MAX_WIDTH = 1 / 4;

function RowButton({
  children,
  tooltip,
  onClick,
  marked = false,
  ...rest
}: PropsWithChildren<
  ComponentProps<typeof Button<typeof Link>> & {
    tooltip: string;
    active?: boolean;
    marked?: boolean;
  }
>) {
  return (
    <Tooltip label={tooltip}>
      <Button
        as={Link}
        variant="iconSmall"
        className="z-0 relative"
        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
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
      </Button>
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

  useOnResize(updateTruncation, entryId, containerRef.current || undefined);
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
          ref={(el: HTMLElement | null) => (tagsRef.current[index] = el)}
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
  entryId,
  ...rest
}: {
  attachments: Attachment[];
  parentRef: RefObject<HTMLDivElement>;
  entryId: string;
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

  useOnResize(updateTruncation, entryId, containerRef.current || undefined);
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

function ReferenceIcon({
  entry,
  ...rest
}: { entry: Entry } & ComponentProps<"svg">) {
  const isReferenced = entry.referencedBy && entry.referencedBy?.length > 0;
  const containsReferences =
    (entry.references && entry.references.length > 0) ||
    ("referencesInBody" in entry && entry.referencesInBody);

  if (isReferenced && containsReferences) {
    return (
      <Tooltip label="Referenced by and references other entries">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          {...rest}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
          />
        </svg>
      </Tooltip>
    );
  } else if (isReferenced) {
    return (
      <Tooltip label="Referenced by other entries">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          {...rest}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25"
          />
        </svg>
      </Tooltip>
    );
  } else if (containsReferences) {
    return (
      <Tooltip label="References other entries">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          {...rest}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15"
          />
        </svg>
      </Tooltip>
    );
  }

  return null;
}

function FollowUpIcon({
  entry,
  ...rest
}: { entry: Entry } & ComponentProps<"svg">) {
  const hasFollowUps = entry.followUps.length > 0;
  const isFollowingUp = Boolean(entry.followingUp);

  if (hasFollowUps && isFollowingUp) {
    return (
      <Tooltip label="Is a follow up and has follow ups">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          {...rest}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
          />
        </svg>
      </Tooltip>
    );
  } else if (hasFollowUps) {
    return (
      <Tooltip label="Has follow ups">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          {...rest}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25"
          />
        </svg>
      </Tooltip>
    );
  } else if (isFollowingUp) {
    return (
      <Tooltip label="Is a follow up">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          {...rest}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12"
          />
        </svg>
      </Tooltip>
    );
  }

  return null;
}

export interface Props extends Omit<ComponentProps<"div">, "onClick"> {
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
  allowExpanding?: boolean;
  allowFavorite?: boolean;
  allowFollowUp?: boolean;
  allowSupersede?: boolean;
  allowSpotlight?: boolean;
  allowSpotlightForFollowUps?: boolean;
  onClick?: (event: React.MouseEvent) => void;
}

const colors = [
  "bg-red-300",
  "bg-yellow-300",
  "bg-green-300",
  "bg-blue-300",
  "bg-purple-300",
  "bg-pink-300",
];

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
      allowExpanding,
      allowFavorite,
      allowFollowUp,
      allowSupersede,
      allowSpotlight,
      allowSpotlightForFollowUps,
      onClick,
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

    const spotlightProps = useSpotlightProps(entry);
    const date = dateBasedOn === "loggedAt" ? entry.loggedAt : entry.eventAt;
    const tagNames = useDisplayTags(entry.tags, entry.logbooks.length);

    const triggerResize = useTriggerResize(entry.id);

    const colorBands = entry.logbooks.map(
      ({ id }) => colors[id.charCodeAt(23) % colors.length],
    );

    const { usedHeight, zIndex } = useContext(StickyEntryRow);

    const updatedStickEntryRowContext = {
      zIndex: zIndex - 1,
      usedHeight:
        usedHeight + (rowRef.current?.getBoundingClientRect().height ?? 0),
    };

    const showLoader = useDelayedLoader(!fullEntry && expanded);

    const open = showLoader || (expanded && fullEntry);
    const buttonState = highlighted
      ? "highlighted"
      : selected
        ? "selected"
        : "neutral";

    return (
      <div
        ref={ref}
        className={twMerge(containerClassName, "pl-3 relative")}
        {...rest}
      >
        <div className="absolute left-0 top-0 bottom-0 w-3 flex flex-col">
          {colorBands.map((color, index) => (
            <div key={index} className={twMerge(color, "w-full flex-grow")} />
          ))}
        </div>
        <div
          ref={rowRef}
          onMouseEnter={triggerResize}
          onMouseLeave={triggerResize}
          className={twMerge(
            "flex items-center group pl-4 cursor-pointer relative h-12 hover:bg-gray-50 text-black bg-white",
            selected && "bg-blue-50 hover:bg-blue-100",
            highlighted && "bg-yellow-100 hover:bg-yellow-200",
            open && "sticky border-b",
            className,
          )}
          style={{
            top: open ? usedHeight : undefined,
            zIndex: open ? zIndex : undefined,
          }}
          draggable="true"
          data-drag-handle
          data-entry-id={entry.id}
          onDragStart={(e) => {
            e.dataTransfer.setData(
              "text/html",
              `<elog-entry-ref id="${entry.id}"></entry-ref>`,
            );
            // TODO: Set the URL of the entry
            // e.dataTransfer.setData("text/uri-list", "https://www.mozilla.org");
          }}
        >
          <div className="flex overflow-hidden flex-col flex-1 py-1">
            <Link
              to={{
                pathname: `/${entry.id}`,
                search: window.location.search,
                hash: window.location.hash,
              }}
              // See https://inclusive-components.design/cards/
              className={twJoin(
                "truncate leading-[1.2] after:absolute after:left-0 after:right-0 after:bottom-0 after:top-0 no-underline font-normal",
              )}
              onClick={
                onClick
                  ? (e) => {
                      e.preventDefault();
                      onClick(e);
                    }
                  : undefined
              }
              // Since the whole row is draggable, we don't want the link to be draggable
              draggable="false"
            >
              {!entry.isEmpty && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="inline relative z-10 mr-1 w-4 h-4 text-gray-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                  />
                </svg>
              )}

              <FloatingDelayGroup delay={200}>
                <ReferenceIcon
                  className="inline relative z-10 mr-1 w-4 h-4 text-gray-500"
                  entry={entry}
                />
                <FollowUpIcon
                  className="inline relative z-10 mr-1 w-4 h-4 text-gray-500"
                  entry={entry}
                />
              </FloatingDelayGroup>
              {entry.title}
            </Link>
            <div className="flex items-center h-5">
              <div className="text-sm leading-none text-gray-500 whitespace-nowrap truncate">
                {`${entry.logbooks
                  .map(({ name }) => name.toUpperCase())
                  .join(", ")} • ${entry.loggedBy}`}
              </div>
              {tagNames.length > 0 && (
                <TagList
                  tags={tagNames.map(({ label }) => label)}
                  entryId={entry.id}
                />
              )}
            </div>
          </div>
          {entry.attachments.length > 0 && (
            <AttachmentList
              attachments={entry.attachments}
              parentRef={rowRef}
              entryId={entry.id}
              className={
                allowSpotlight ||
                allowSupersede ||
                allowFollowUp ||
                allowFavorite
                  ? "mr-1.5"
                  : ""
              }
            />
          )}

          <div
            className={twJoin(
              "flex flex-col justify-center items-center pl-2",
              (allowSpotlight || allowFollowUp || allowSupersede) &&
                "group-hover:hidden",
            )}
          >
            {showDate && (
              <div className="text-sm">
                {date.toLocaleDateString("en-us", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            )}
            <div className="leading-none text-gray-500 text-sm">
              {date.toLocaleString("en-us", {
                hour: "numeric",
                minute: "numeric",
                hourCycle: "h23",
              })}
            </div>
          </div>

          <FloatingDelayGroup delay={200}>
            <div className="hidden group-hover:flex">
              {allowSpotlight && (
                <RowButton
                  tooltip="Spotlight"
                  state={buttonState}
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
                    hash: window.location.hash,
                  }}
                  state={buttonState}
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
                    hash: window.location.hash,
                  }}
                  state={buttonState}
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
            {/* See #105 */}
            {/* {allowFavorite && ( */}
            {/*   <FavoriteButton */}
            {/*     entryId={entry.id} */}
            {/*     state={buttonState} */}
            {/*     className="z-0" */}
            {/*     favoriteIconClassName="hidden group-hover:block" */}
            {/*   /> */}
            {/* )} */}
          </FloatingDelayGroup>

          {allowExpanding && (
            <Button
              variant="iconSmall"
              onClick={() => setExpanded((expanded) => !expanded)}
              state={buttonState}
              className={twMerge("z-0", expanded && "rotate-180")}
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
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </Button>
          )}
        </div>
        {showLoader && (
          <div className="py-2 bg-gray-100">
            <Spinner className="mx-auto" />
          </div>
        )}
        {expanded && fullEntry && (
          <StickyEntryRow.Provider value={updatedStickEntryRowContext}>
            <div
              className={twJoin(
                "px-3 py-2 bg-gray-100",
                !fullEntry.text && "text-gray-500",
              )}
            >
              <EntryBodyText body={fullEntry.text} showEmptyLabel />
              <EntryFigureList attachments={fullEntry.attachments} />
            </div>
            {showFollowUps && fullEntry.followUps.length > 0 && (
              <div className="pt-3 last:pb-3 pr-2 pl-3 bg-gray-50">
                <EntryList
                  header="Follow Ups"
                  entries={fullEntry.followUps}
                  showDate
                  showFollowUps
                  showReferences={showReferences}
                  allowExpanding={allowExpanding}
                  allowFollowUp={allowFollowUp}
                  allowSupersede={allowSupersede}
                  allowSpotlight={allowSpotlightForFollowUps}
                />
              </div>
            )}
            {showReferences &&
              fullEntry.referencedBy &&
              fullEntry.referencedBy.length > 0 && (
                <div className="pt-3 last:pb-3 pr-2 pl-3 bg-gray-50">
                  <EntryList
                    header="Referenced By"
                    entries={fullEntry.referencedBy}
                    showDate
                    showFollowUps={showFollowUps}
                    showReferences
                    allowExpanding={allowExpanding}
                    allowFollowUp={allowFollowUp}
                    allowSupersede={allowSupersede}
                    allowSpotlight={allowSpotlightForFollowUps}
                  />
                </div>
              )}
          </StickyEntryRow.Provider>
        )}
      </div>
    );
  }),
);

export default EntryRow;
