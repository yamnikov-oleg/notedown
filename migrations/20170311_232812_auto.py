import datetime

import peewee
from playhouse import migrate as pmigrate

def migrate(database, migrator):
    class User(peewee.Model):
        username = peewee.CharField(max_length=64, unique=True)
        password = peewee.CharField(max_length=32)
        salt = peewee.CharField(max_length=32)
        creation_time = peewee.DateTimeField(default=datetime.datetime.now)

    query = User.select()
    query.database = database
    backup = query.execute()

    pmigrate.migrate(
        migrator.drop_column('user', 'password'),
        migrator.add_column('user', 'password', peewee.CharField(max_length=64, default="")),
        migrator.drop_column('user', 'salt'),
        migrator.add_column('user', 'salt', peewee.CharField(max_length=64, default="")),
    )

    for user in backup:
        query = User.update(password=user.password, salt=user.salt).where(User.id == user.id)
        query.database = database
        query.execute()
