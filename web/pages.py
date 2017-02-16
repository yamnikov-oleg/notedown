from flask import Blueprint, send_file

from models import Note
from . import api

pages = Blueprint('pages', __name__)

@pages.route('/', methods=['GET'])
def index():
    return send_file('static/index.html')
