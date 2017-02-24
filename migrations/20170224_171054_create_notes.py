import datetime

import peewee
from playhouse import migrate as pmigrate

class Note(peewee.Model):
    text = peewee.TextField(verbose_name="Text")
    creation_time = peewee.DateTimeField(default=datetime.datetime.now)

def migrate(database, migrator):
    database.create_table(Note)
