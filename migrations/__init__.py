import datetime
import importlib
import os
import os.path

import peewee
from playhouse import migrate

import config
import models

def list_available():
    all_files = os.listdir(os.path.dirname(__file__))
    migr_files = [ f for f in all_files if f.endswith(".py") and f != "__init__.py" ]
    migr_names = [ f[:-3] for f in migr_files ]
    migr_names = sorted(migr_names)

    migr_tuples = []
    for name in migr_names:
        try:
            module = importlib.import_module('.' + name, package=__name__)
        except ImportError:
            print("Failed to import migration: " + name)
            continue

        migr_tuples.append((name, module))

    return migr_tuples

def Migrator():
    if config.DATABASE['BACKEND'] == "sqlite":
        return migrate.SqliteMigrator(models.database)
    else:
        raise ValueError('migrations are not supported for DB backend: {}'.format(config.DATABASE['BACKEND']))

class Migration(peewee.Model):
    name = peewee.CharField(max_length=255)
    time = peewee.DateTimeField(default=datetime.datetime.now)

    class Meta:
        database = models.database

def applied_migrations():
    def get():
        names = Migration.select(Migration.name).order_by(Migration.time).tuples()
        names = [ n[0] for n in names ]
        return names

    try:
        return get()
    except peewee.OperationalError:
        models.database.create_tables([Migration])
        return get()

def migrate_db():
    applied = applied_migrations()
    available = list_available()
    migrator = Migrator()

    for name, module in available:
        if name in applied:
            continue

        print("Applying {}...".format(name))
        try:
            module.migrate(models.database, migrator)
        except Exception as e:
            print("Failed to run migration {}: {} {}".format(name, type(e).__qualname__, str(e)))
            return

        Migration.create(name=name)
