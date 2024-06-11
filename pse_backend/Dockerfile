FROM python:3.10-bookworm as build
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

COPY ./requirements.txt .
RUN pip install -r requirements.txt

RUN apt update && apt install -y cron 
RUN mkdir static

COPY . .

RUN python manage.py collectstatic --no-input
EXPOSE 8000
ENTRYPOINT ["bash","setup.sh"]