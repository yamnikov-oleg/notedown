import datetime

import peewee
from playhouse import migrate as pmigrate

def migrate(database, migrator):
    pmigrate.migrate(
        migrator.add_column('note', 'update_time', peewee.DateTimeField(default=datetime.datetime.now)),
    )
