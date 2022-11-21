FROM node:18-alpine
RUN apk --no-cache add curl
WORKDIR /app
COPY . /app
RUN npm install
EXPOSE 80
ENTRYPOINT ["./entrypoint.sh"]
CMD ["npm", "run", "serve"]