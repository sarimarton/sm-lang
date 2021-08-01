FROM node:16-alpine3.11

ARG AWS_PORT
ENV AWS_PORT=${AWS_PORT}
ARG HUNMORPH_FOMA_PORT
ENV HUNMORPH_FOMA_PORT=${HUNMORPH_FOMA_PORT}

RUN apk --no-cache add socat

RUN echo 'echo "$@" | socat -,ignoreeof TCP:aws:$AWS_PORT' >/usr/bin/aws && chmod +x /usr/bin/aws
RUN echo 'echo "$@" | socat -,ignoreeof TCP:hunmorph-foma:$HUNMORPH_FOMA_PORT' >/usr/bin/hunmorph-foma && chmod +x /usr/bin/hunmorph-foma

COPY . .
RUN npm i

EXPOSE 80 443 22
CMD ["node", "src/index.js"]
