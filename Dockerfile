FROM node:8-alpine
MAINTAINER kekonen

WORKDIR /home/node/bnptesting

RUN apk add --no-cache curl

RUN chown -Rf node:node .

COPY --chown=node:node package.json .
COPY --chown=node:node ./src ./src
# COPY --chown=node:node ./test ./test

USER node
RUN npm install && npm cache clean --force

ARG CI="false"
RUN if $CI -eq "true"; then yarn run build:client ; fi

# A container must expose a port if it wants to be registered in Consul by Registrator.
# The port is fed both to node express server and Consul => DRY principle is observed with ENV VAR.
# NOTE: a port can be any, not necessarily different from exposed ports of other containers.

# HEALTHCHECK --interval=15s --timeout=3s --retries=24 \
#   CMD curl --silent --fail http://localhost:3002/api/health/check || exit 1

EXPOSE 3002
CMD [ "npm", "start" ]