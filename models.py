import datetime

import peewee

import config

database = peewee.Proxy()

class Note(peewee.Model):
    text = peewee.TextField(verbose_name="Text")
    creation_time = peewee.DateTimeField(default=datetime.datetime.now)

    class Meta:
        database = database

def initdb():
    database.create_tables([Note])

def connect():
    if config.DATABASE['BACKEND'] == "sqlite":
        db = peewee.SqliteDatabase(config.DATABASE['NAME'])
    else:
        raise ValueError('undefined DB backend: {}'.format(config.DATABASE['BACKEND']))

    database.initialize(db)
