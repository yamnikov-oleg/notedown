import datetime

import peewee
from playhouse import migrate as pmigrate

class Session(peewee.Model):
    id = peewee.CharField(primary_key=True, max_length=255)
    dict_json = peewee.TextField()
    update_time = peewee.DateTimeField(default=datetime.datetime.now)

def migrate(database, migrator):
    database.create_table(Session)
