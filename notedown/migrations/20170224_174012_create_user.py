import datetime

import peewee
from playhouse import migrate as pmigrate

class User(peewee.Model):
    username = peewee.CharField(max_length=64, unique=True)
    password = peewee.CharField(max_length=32)
    salt = peewee.CharField(max_length=32)
    creation_time = peewee.DateTimeField(default=datetime.datetime.now)

class Note(peewee.Model):
    author = peewee.ForeignKeyField(User, related_name='notes')
    text = peewee.TextField(verbose_name="Text")
    creation_time = peewee.DateTimeField(default=datetime.datetime.now)

def migrate(database, migrator):
    database.create_table(User)
    # We have to recreate model, because we added non-nullable foreign key (author)
    database.drop_table(Note)
    database.create_table(Note)
