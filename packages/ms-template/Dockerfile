FROM node:18-alpine
RUN apk --no-cache add curl
WORKDIR /app
COPY . /app
RUN npm install
RUN npm run build
EXPOSE 9999
CMD ["npm", "run", "serve"]