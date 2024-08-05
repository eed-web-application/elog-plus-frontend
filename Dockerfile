FROM node:20-alpine AS builder

ARG MODE=production
ENV MODE=$MODE

ARG API_ENDPOINT
ENV API_ENDPOINT=$API_ENDPOINT

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

# Need git for including the current commit hash in the build
RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

COPY . ./app
COPY .git ./app/.git
WORKDIR /app

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

RUN pnpm vite build --mode $MODE

FROM nginx:alpine

COPY ./.nginx/nginx.conf /etc/nginx/nginx.conf

## Remove default nginx index page
RUN rm -rf /usr/share/nginx/html/*

# Copy from the stahg 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]


