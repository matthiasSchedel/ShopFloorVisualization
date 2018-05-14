FROM node:latest
#/nodejs:latest

WORKDIR ./app

#/app

ADD ./ ./app/

#EXPOSE 3000

#RUN
CMD npm i -g npm-check-updates && npm-check-updates -u && npm install && npm start
# using array notation causes node to be PID1 and will not exit properly. Without the array notation the shell forwards the sigterm correctly. 
# CMD ["node", "index.js"]
