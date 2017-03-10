import datetime
import hashlib
import json
import random
import string
import uuid

import peewee

import markdown

database = peewee.Proxy()

class Session(peewee.Model):
    id = peewee.CharField(primary_key=True, max_length=255)
    dict_json = peewee.TextField()
    update_time = peewee.DateTimeField(default=datetime.datetime.now)

    @classmethod
    def create(cls, *args, **kwargs):
        return super().create(id=cls.random_id())

    @classmethod
    def random_id(cls):
        return uuid.uuid4().hex

    def encode(self):
        self.dict_json = json.dumps(self.dict)

    def decode(self):
        self._dict = json.loads(self.dict_json or "{}")

    @property
    def dict(self):
        if not hasattr(self, '_dict'):
            self.decode()
        return self._dict

    def setval(self, key, value, save=False):
        self.dict[key] = value
        if save:
            self.save()

    def getval(self, key, default=None):
        return self.dict.get(key, default)

    def delval(self, key, save=False):
        try:
            del self.dict[key]
        except KeyError:
            pass

        if save:
            self.save()

    def save(self, *args, **kwargs):
        self.encode()
        self.update_time = datetime.datetime.now()
        super().save(*args, **kwargs)

    class Meta:
        database = database

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

def connect(**config):
    if config['BACKEND'] == "sqlite":
        db = peewee.SqliteDatabase(config['NAME'])
    else:
        raise ValueError('undefined DB backend: {}'.format(config['BACKEND']))

    database.initialize(db)
