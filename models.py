import datetime

import peewee

import config
import markdown

database = peewee.Proxy()

class User(peewee.Model):
    username = peewee.CharField(max_length=64, unique=True)
    password = peewee.CharField(max_length=32)
    salt = peewee.CharField(max_length=32)
    creation_time = peewee.DateTimeField(default=datetime.datetime.now)

    class Meta:
        database = database

class Note(peewee.Model):
    author = peewee.ForeignKeyField(User, related_name='notes')
    text = peewee.TextField(verbose_name="Text")
    creation_time = peewee.DateTimeField(default=datetime.datetime.now)

    def render(self):
        return markdown.render(self.text)

    class Meta:
        database = database

def connect():
    if config.DATABASE['BACKEND'] == "sqlite":
        db = peewee.SqliteDatabase(config.DATABASE['NAME'])
    else:
        raise ValueError('undefined DB backend: {}'.format(config.DATABASE['BACKEND']))

    database.initialize(db)
