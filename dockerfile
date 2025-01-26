FROM node:alpine
COPY . /inpx-web
WORKDIR /inpx-web
RUN apk add zip && npm i && npm run build:client && node build/prepkg.js linux 
RUN rm ./server/config/application_env; exit 0
EXPOSE 12380
CMD node server --app-dir=.inpx-web