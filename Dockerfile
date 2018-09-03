FROM node:8
WORKDIR /app
COPY package.json /app
COPY /src /app/src
RUN ls -al -R; \
    cd /app; \
    chmod -R a+rw /app; \
    node -v && npm -v; \
    npm install; \
    npm -g dedupe; \
    npm cache clean --force
VOLUME ["/app"]
CMD ["npm","start"]
