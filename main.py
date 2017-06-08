#!/usr/bin/env python3
import sys
import os.path
from datetime import datetime

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
        from multiprocessing import Process

        print("Performing full testing of the project.")

        print("=== BACKEND TESTS ===")
        backend_tests = Process(target=self.test_backend)
        backend_tests.start()
        backend_tests.join()
        backend_code = backend_tests.exitcode
        print("EXIT CODE:", backend_code)

        print("=== FRONTEND TESTS ===")
        frontend_tests = Process(target=self.test_frontend)
        frontend_tests.start()
        frontend_tests.join()
        frontend_code = frontend_tests.exitcode
        print("EXIT CODE:", frontend_code)

        if backend_code == 0 and frontend_code == 0:
            print("TESTS SUCCEEDED.")
        else:
            print("TESTS FAILED.")
            sys.exit(1)

    def test_backend(self):
        print("Creating an in-memory test database...")
        models.connect(BACKEND="sqlite", NAME=":memory:")
        migrations.migrate_db()

        import unittest
        suite = unittest.TestSuite()
        suite.addTest(unittest.defaultTestLoader.loadTestsFromNames([
            'notedown.web.tests',
        ]))
        unittest.TextTestRunner(verbosity=2).run(suite)

    def test_frontend(self):
        from multiprocessing import Process
        from subprocess import call

        server_proc = Process(target=self.server, args=('localhost', 5000))
        server_proc.start()

        exit_code = call(["mocha-phantomjs", "http://localhost:5000/test"])

        server_proc.terminate()
        sys.exit(exit_code)

    def shell(self):
        self._prepare_models()
        from IPython import embed
        embed()

    def new_migration(self, name='auto'):
        stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = "{}_{}.py".format(stamp, name)
        filepath = os.path.join("notedown", "migrations", filename)
        print("Creating file '{}'".format(filepath))
        open(filepath, 'w').close()


if __name__ == '__main__':
    fire.Fire(NotedownCLI)
