FROM node:20.19-bullseye AS build
WORKDIR /app

# Copy source
COPY . .

RUN npm ci
RUN npm run build

FROM nginx:stable-alpine AS runtime
RUN apk add --no-cache curl
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
