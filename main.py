#!/usr/bin/env python3
import sys

from notedown import web, migrations, models, config


if __name__ == '__main__':
    if config.DEBUG:
        print("Debug mode is enabled")

    if sys.argv[1] == "server":
        models.connect(**config.DATABASE)
        web.app.run(host=config.HOST, port=config.PORT)
    elif sys.argv[1] == "migrate":
        models.connect(**config.DATABASE)
        migrations.migrate_db()
    elif sys.argv[1] == "createuser":
        from getpass import getpass
        models.connect(**config.DATABASE)
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
            'notedown.web.tests',
        ]))
        unittest.TextTestRunner(verbosity=2).run(suite)
