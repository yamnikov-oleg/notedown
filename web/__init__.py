from datetime import timedelta

from flask import Flask, session

import config
from . import api, pages

app = Flask(__name__)

if config.SECRET_KEY is None:
    raise ValueError("Please, set SECRET_KEY in the local config to a random string")

app.secret_key = config.SECRET_KEY

app.register_blueprint(pages.pages)
app.register_blueprint(api.apiv1)

app.config.update(
    PERMANENT_SESSION_LIFETIME = timedelta(days=365),
)

@app.before_request
def make_session_permanent():
    session.permanent = True
