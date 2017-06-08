#!/usr/bin/env python3
import fire

from notedown import web, migrations, models, config


class NotedownCLI:
    """CLI to manage Notedown distribution"""

    def __init__(self):
        if config.DEBUG:
            print("Debug mode is enabled")

    def _prepare_models(self):
        models.connect(**config.DATABASE)

    def server(self, host=None, port=None):
        """Run local Notedown server"""
        self._prepare_models()

        if not host:
            host = config.HOST

        if not port:
            port = config.PORT

        web.app.run(host=host, port=port)

    def migrate(self):
        self._prepare_models()
        migrations.migrate_db()

    def createuser(self):
        self._prepare_models()

        from getpass import getpass
        user = models.User()
        user.username = input("Username: ")
        user.set_password(getpass("Password: "))
        user.save()
        print("User is created!")

    def test(self):
        print("Creating an in-memory test database...")
        models.connect(BACKEND="sqlite", NAME=":memory:")
        migrations.migrate_db()

        import unittest
        suite = unittest.TestSuite()
        suite.addTest(unittest.defaultTestLoader.loadTestsFromNames([
            'notedown.web.tests',
        ]))
        unittest.TextTestRunner(verbosity=2).run(suite)

    def shell(self):
        self._prepare_models()
        from IPython import embed
        embed()


if __name__ == '__main__':
    fire.Fire(NotedownCLI)
