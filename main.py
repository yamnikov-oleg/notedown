#!/usr/bin/env python3
import sys

import web
import models
import config

if __name__ == '__main__':
    if config.DEBUG:
        print("Debug mode is enabled")

    if sys.argv[1] == "server":
        models.connect()
        web.app.run()
    elif sys.argv[1] == "initdb":
        models.connect()
        models.initdb()
    elif sys.argv[1] == "test":
        import unittest
        suite = unittest.TestSuite()
        suite.addTest(unittest.defaultTestLoader.loadTestsFromNames([
            # 'module_test',
        ]))
        unittest.TextTestRunner(verbosity=2).run(suite)
