FROM python:3.10-slim-bookworm as build
WORKDIR /app
RUN apt update && apt install -y cron 
COPY ./requirements.txt .
RUN pip install -r requirements.txt
COPY . .
ENTRYPOINT ["bash","setup.sh"]