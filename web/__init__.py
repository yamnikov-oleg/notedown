from flask import Flask

from . import api, pages

app = Flask(__name__)
app.register_blueprint(pages.pages)
app.register_blueprint(api.apiv1)
