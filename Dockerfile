FROM node:16-alpine3.11

RUN apk add socat

COPY --chmod=744 bin/* /usr/bin

WORKDIR /app
COPY src .
RUN npm i

EXPOSE 80 443 22
CMD ["node", "index.js"]
