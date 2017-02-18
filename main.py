#!/usr/bin/env python3
import sys

import web
import models
import config

if __name__ == '__main__':
    if config.DEBUG:
        print("Debug mode is enabled")

    models.connect()

    if sys.argv[1] == "server":
        web.app.run()
    elif sys.argv[1] == "initdb":
        models.initdb()
