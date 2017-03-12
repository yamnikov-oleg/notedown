FROM python:3.5

RUN mkdir /app
WORKDIR /app

COPY ./requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000

CMD ./main.py migrate && ./main.py server
