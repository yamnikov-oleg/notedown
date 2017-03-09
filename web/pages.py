from flask import Blueprint, send_file

import config
from . import api
from models import Note

pages = Blueprint('pages', __name__)

@pages.route('/', methods=['GET'])
def index():
    return send_file('static/index.html')

if config.DEBUG:
    @pages.route('/test', methods=['GET'])
    def test():
        return send_file('static/test/runner.html')
