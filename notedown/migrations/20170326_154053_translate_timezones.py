import datetime

import peewee
from playhouse import migrate as pmigrate

def utcnow_with_tz():
    return datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc)

def migrate(database, migrator):
    class Note(peewee.Model):
        creation_time = peewee.DateTimeField()
        update_time = peewee.DateTimeField()

    query = Note.select()
    query.database = database
    notes = query.execute()

    local = datetime.datetime.now()
    utc = datetime.datetime.utcnow()
    offset = local - utc
    # Round the offset by half an hour
    offset = datetime.timedelta(hours=round(offset.seconds/(30*60))/2)

    def updatetz(dt):
        dt -= offset
        return dt.replace(tzinfo=datetime.timezone.utc)

    for note in notes:
        query = Note.update(
            creation_time=updatetz(note.creation_time),
            update_time=updatetz(note.update_time)
        ).where(Note.id == note.id)
        query.database = database
        query.execute()
