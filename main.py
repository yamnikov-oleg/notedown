#!/usr/bin/env python3
import sys

import web
import migrations
import models
import config

if __name__ == '__main__':
    if config.DEBUG:
        print("Debug mode is enabled")

    if sys.argv[1] == "server":
        models.connect(**config.DATABASE)
        web.app.run()
    elif sys.argv[1] == "migrate":
        models.connect()
        migrations.migrate_db()
    elif sys.argv[1] == "createuser":
        from getpass import getpass
        models.connect()
        user = models.User()
        user.username = input("Username: ")
        user.set_password(getpass("Password: "))
        user.save()
        print("User is created!")
    elif sys.argv[1] == "test":
        print("Creating an in-memory test database...")
        models.connect(BACKEND="sqlite", NAME=":memory:")
        migrations.migrate_db()

        import unittest
        suite = unittest.TestSuite()
        suite.addTest(unittest.defaultTestLoader.loadTestsFromNames([
            'web.tests',
        ]))
        unittest.TextTestRunner(verbosity=2).run(suite)
