#!/bin/bash

# Run up the web server (it hosts the tests page)
./main.py server &
# Wait for the server to be operational
sleep 1

# Get and run the tests page
mocha-phantomjs http://localhost:5000/test
# Remember the exit code
EXITCODE=$?

# Shut down the server
kill %%
#Forward the exit code
exit $EXITCODE
