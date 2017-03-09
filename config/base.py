import os

DEBUG = True

DATABASE = {
    'BACKEND': "sqlite",
    'NAME': "dev.db",
}

SECRET_KEY = os.getenv('SECRET_KEY')
