FROM node:16.17.1
ADD . ./
RUN npm install
CMD ["node", "index.js"]
