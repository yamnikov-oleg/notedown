import os

DEBUG = True

HOST = 'localhost'
PORT = 5000

DATABASE = {
    'BACKEND': "sqlite",
    'NAME': "dev.db",
}

SECRET_KEY = os.getenv('SECRET_KEY')
