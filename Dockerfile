FROM python:3.5

RUN mkdir /app
WORKDIR /app

COPY ./requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000

CMD ./main.py migrate && \
    uwsgi --http :5000 \
          --wsgi-file wsgi.py --callable app
