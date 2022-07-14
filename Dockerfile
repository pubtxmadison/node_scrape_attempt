FROM amazon/aws-lambda-nodejs:14
# Alternatively, you can pull the base image from Docker Hub: amazon/aws-lambda-nodejs:12
#public.ecr.aws/lambda/nodejs:14

# Assumes your function is named "app.js", and there is a package.json file in the app directory 
COPY handler.js ${LAMBDA_TASK_ROOT}
COPY package.json ${LAMBDA_TASK_ROOT}
#COPY doHL.js ${LAMBDA_TASK_ROOT}
COPY jquery-3.2.1.min.js ${LAMBDA_TASK_ROOT}
#COPY .npmrc ${LAMBDA_TASK_ROOT}

#COPY ./node_modules ${LAMBDA_TASK_ROOT}/node_modules

# Install NPM dependencies for function
RUN yum -y install git
RUN npm install

#ENV DEBUG=puppeteer:* # uncomment to enable debugging, prefer setting in lambda function's environment variables

#blanked out the below variables, they are used in handler.js - but obviously not in github
ENV AWS_ACCESS_KEY_ID=
ENV AWS_SECRET_ACCESS_KEY=
ENV AWS_DEFAULT_REGION=

ENV proxy_address=
ENV proxy_username=
ENV proxy_password=

ENV mysql_host=
ENV mysql_userid=
ENV mysql_passwd=
ENV mysql_port=
ENV mysql_db=

ENV slack_token=


# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "handler.scrape" ]  
