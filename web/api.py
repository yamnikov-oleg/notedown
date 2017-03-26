from functools import wraps

from flask import Blueprint, jsonify, request, url_for

from .auth import get_user, is_authenticated, login, logout
from models import Note

apiv1 = Blueprint('api_v1', __name__, url_prefix='/api/v1')

def jsonify_status(code, *args, **kwargs):
    resp = jsonify(*args, **kwargs)
    resp.status_code = code
    return resp

def require_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not is_authenticated():
            return jsonify_status(403, message="Please, authenticate with /api/v1/account/login")
        else:
            return f(*args, **kwargs)
    return wrapper

def serialize_note(note):
    return {
        'id': note.id,
        'text': note.text,
        'rendered': note.render(),
        'creation_time': note.creation_time_obj.isoformat(),
        'update_time': note.creation_time_obj.isoformat(),
    }

@apiv1.route('/notes', methods=['GET'])
@require_auth
def notes_index():
    user = get_user()
    notes = Note.select().where(Note.author == user).order_by(Note.creation_time.desc())
    notes_data = [ serialize_note(n) for n in notes ]
    return jsonify(notes_data)

@apiv1.route('/notes/update', methods=['POST'])
@require_auth
def notes_update():
    nid = request.form.get('id')
    if not nid:
        return jsonify_status(400, message="ID is not provided")

    text = request.form.get('text')
    if text is None:
        return jsonify_status(400, message="Text is not provided")

    try:
        note = Note.get(Note.id == nid)
    except Note.DoesNotExist:
        return jsonify_status(404, message="Note with ID {} was not found".format(nid))

    if note.author.id != get_user().id:
        return jsonify_status(403, message="Note with ID {} does not belong to current user".format(nid))

    note.text = text
    note.save()
    return jsonify(serialize_note(note))

@apiv1.route('/notes/create', methods=['POST'])
@require_auth
def notes_create():
    text = request.form.get('text')
    if text is None:
        return jsonify_status(400, message="Text is not provided")

    note = Note.create(text=text, author=get_user())
    return jsonify(serialize_note(note))

@apiv1.route('/notes/delete', methods=['POST'])
@require_auth
def notes_delete():
    nid = request.form.get('id')
    if not nid:
        return jsonify_status(400, message="ID is not provided")

    try:
        note = Note.get(Note.id == nid)
    except Note.DoesNotExist:
        return jsonify_status(404, message="Note with ID {} was not found".format(nid))

    if note.author.id != get_user().id:
        return jsonify_status(403, message="Note with ID {} does not belong to current user".format(nid))

    note.delete_instance()
    return jsonify(message="ok")

def serialize_account(user):
    return {
        'username': user.username,
    }

@apiv1.route('/account', methods=['GET', 'POST'])
def account_index():
    if is_authenticated():
        user = get_user()
        return jsonify(account=serialize_account(user))
    else:
        return jsonify(account=None)

@apiv1.route('/account/login', methods=['POST'])
def account_login():
    username = request.form.get('username')
    password = request.form.get('password')

    user = login(username, password)
    if user is None:
        return jsonify_status(403, account=None)

    return jsonify(account=serialize_account(user))

@apiv1.route('/account/logout', methods=['POST'])
def account_logout():
    logout()
    return jsonify(account=None)
