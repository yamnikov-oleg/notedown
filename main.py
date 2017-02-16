#!/usr/bin/env python3
import sys

import web
import models

if __name__ == '__main__':
    models.connect()

    if sys.argv[1] == "server":
        web.app.run()
    elif sys.argv[1] == "initdb":
        models.initdb()
