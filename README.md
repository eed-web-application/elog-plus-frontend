# ELog Plus Frontend

This is a pretty run of the mill React app. It's written in TypeScript with Vite for bundling and uses React Router for routing.

#### Start development server

```bash
# Install dependencies
$ npm install # or yarn or pnpm install

# Start dev server
$ npm run dev # or yarn dev or pnpm dev
```

### Philosophy

Keep it simple until it needs to be complicated! Don't over-engineer things, but don't be afraid to refactor when things get messy.

### Components

Few component libraries are used, because they cause a **lot** of bloat and most of the time don't integrate well with each other (UI/UX wise). For these reasons, most components are custom built. If complex functionality is needed, a lightweight hook is preferred over a component library. For example, [Floating UI](https://floating-ui.com/) is used as a floating primitive that is used for all floating functionality, such as dialogs, tooltips, dropdowns, etc.

Most components expose the props of their root element, so that the component can be styled with `className` and also helps to reduce the number of elements in the DOM (see styling section).

### Styling

Styling is done with [Tailwind](https://tailwindcss.com/). Right now, there are little reusable abstractions and most of the styling is done inline. This is because the app is still in active development and it's hard to know what will be reused and what won't. As the app grows, more abstractions will be made. However, for the few necessary reusable styles `base.ts` contains a few styles that are used throughout the app (though see #40). Most components expose and merge (using [`tailwind-merge`](https://www.npmjs.com/package/tailwind-merge)) `className`, which should be used over wrapping in a `div` and styling that.

#### Icons

Besides the following expectations, all icons are from [Hero Icons](https://heroicons.com/) and are just used as inlined SVGs:

- Attachment file icons are from FontAwesome
- Editor menu icons are from [Remix Icon](https://remixicon.com/), where only the contents of the d attribute were copied over to the format used by Hero Icons.

### State Management

State is saved where ever it is most convenient (i.e., no big nasty Redux store 🎉):

- UI state is managed by components themselves as the state is most likely be hierarchical and thus there is no need for a global state manager. However, some state is used in multiple places deep in the hierarchical and doesn't change often, so contexts are used to prevent prop drilling.
- Server state (entries, logbooks, tags, etc.) is managed by [`react-query`](https://react-query.tanstack.com/), which is more like a cache than a state manager. It is usually used through a hook that wraps a `useQuery` call (see `src/hooks/useLogbooks.ts` for example). However, cache invalidation is a little bit more complicated ([big surpise](https://twitter.com/secretGeek/status/7269997868)) and is not directly handled by the hook. Instead, when something invalidates a query, it calls `queryClient.invalidateQueries` with the appropriate key.
- Complex local state is managed by a thin [`zustand`](https://github.com/pmndrs/zustand) store. This is useful for domain specific state that is not related to the server, but is too complex to be managed by a component. For example, the draft storage is managed by a zustand store. This is because the draft is used in multiple places and is too complex to be managed by a component. However, it is not related to the server, so it doesn't make sense to use `react-query`. It is also not hierarchical, so it doesn't make sense to use a context. Thus, zustand is used.

### Routing

Routing is done with React Router. There are two main pages: `Home` and `Admin`. However, within these pages there are different routes that change the `SideSheet`. For example, the route `/:entryId` shows the entry with id `entryId` in the side sheet along side the the main `Home` entry list as well as the navbar.

### Error Handling

There are two types of errors: critical and noncritical. Critical errors cause the page to crash and shows an error page. Noncritical errors are recoverable and thus just display a toast. All unhandled errors are critical and cause the page to cash.
