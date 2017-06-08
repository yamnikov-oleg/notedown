import datetime

import peewee
from playhouse import migrate as pmigrate

def utcnow_with_tz():
    return datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc)

def migrate(database, migrator):
    class Session(peewee.Model):
        id = peewee.CharField(primary_key=True, max_length=255)
        update_time = peewee.DateTimeField(default=utcnow_with_tz)

    class User(peewee.Model):
        creation_time = peewee.DateTimeField(default=utcnow_with_tz)

    local = datetime.datetime.now()
    utc = datetime.datetime.utcnow()
    offset = local - utc
    # Round the offset by half an hour
    offset = datetime.timedelta(hours=round(offset.seconds/(30*60))/2)

    def updatetz(dt):
        dt -= offset
        return dt.replace(tzinfo=datetime.timezone.utc)

    # Update Session.update_time

    query = Session.select()
    query.database = database
    sessions = query.execute()

    for session in sessions:
        query = Session.update(
            update_time=updatetz(session.update_time)
        ).where(Session.id == session.id)
        query.database = database
        query.execute()

    # Update User.creation_time

    query = User.select()
    query.database = database
    users = query.execute()

    for user in users:
        query = User.update(
            creation_time=updatetz(user.creation_time)
        ).where(User.id == user.id)
        query.database = database
        query.execute()
