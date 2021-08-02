FROM node:16-alpine3.11

RUN apk --no-cache add socat

RUN echo 'echo "$@" | socat -,ignoreeof TCP:aws:$AWS_PORT' > /usr/bin/aws && chmod +x /usr/bin/aws
RUN echo 'echo "$@" | socat -,ignoreeof TCP:hunmorph-foma:$HUNMORPH_FOMA_PORT' > /usr/bin/hunmorph-foma && chmod +x /usr/bin/hunmorph-foma

COPY . .
RUN npm i

EXPOSE 80 443 22
CMD ["node", "src/index.js"]
