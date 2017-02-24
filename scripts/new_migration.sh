#!/bin/bash
NAME=${1-auto}
touch migrations/`date +%Y%m%d_%H%M%S`_$NAME.py
