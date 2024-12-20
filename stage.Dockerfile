FROM node:20-alpine AS base

RUN apk add python3 \
pkgconfig \
pixman-dev \
cairo-dev \
pango-dev \
build-base \
npm
WORKDIR /app
COPY package.json yarn.lock ./
# Echo the value of the ENV_FILE argument
# 
FROM base AS build


# install all dependencies, including devDependencies
RUN yarn 
# copy app sources
COPY . .
# build for production
RUN yarn build
# install production dependencies
RUN yarn --production 

# 
# release stage
# 
FROM base AS release
# copy production dependencies
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/.env ./.env
COPY --from=build /app/package.json ./

EXPOSE 80 56397

ENTRYPOINT ["node", "dist/server.js"]