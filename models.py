import datetime
import hashlib
import random
import string

import peewee

import config
import markdown

database = peewee.Proxy()

def hash_password(pwd, salt):
    sha256 = hashlib.sha256()
    sha256.update(pwd.encode('utf8'))
    sha256.update(salt.encode('utf8'))
    return sha256.hexdigest()

class User(peewee.Model):
    username = peewee.CharField(max_length=64, unique=True)
    password = peewee.CharField(max_length=32)
    salt = peewee.CharField(max_length=32)
    creation_time = peewee.DateTimeField(default=datetime.datetime.now)

    def reset_salt(self):
        def random_char():
            return random.choice(string.ascii_letters + string.digits)

        self.salt = "".join([ random_char() for _ in range(32) ])
        return self.salt

    def set_password(self, password):
        if not self.salt:
            self.reset_salt()
        self.password = hash_password(password, self.salt)

    def check_password(self, password):
        if not self.salt:
            self.reset_salt()

        hashed = hash_password(password, self.salt)
        return hashed == self.password

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
