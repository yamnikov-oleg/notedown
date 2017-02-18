#!/bin/bash -e
./main.py server &
sleep 1
mocha-phantomjs http://localhost:5000/test
kill %%
