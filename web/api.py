from flask import Blueprint, jsonify, request, url_for

from models import Note

def jsonify_status(code, *args, **kwargs):
    resp = jsonify(*args, **kwargs)
    resp.status_code = code
    return resp

def serialize_note(note):
    return {
        'id': note.id,
        'text': note.text,
        'rendered': note.render(),
    }

apiv1 = Blueprint('api_v1', __name__, url_prefix='/api/v1')

@apiv1.route('/notes', methods=['GET'])
def notes_index():
    notes = Note.select().order_by(Note.creation_time.desc())
    notes_data = [ serialize_note(n) for n in notes ]
    return jsonify(notes_data)

@apiv1.route('/notes/update', methods=['POST'])
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

    note.text = text
    note.save()
    return jsonify(serialize_note(note))

@apiv1.route('/notes/create', methods=['POST'])
def notes_create():
    text = request.form.get('text')
    if text is None:
        return jsonify_status(400, message="Text is not provided")

    note = Note.create(text=text)
    return jsonify(serialize_note(note))

@apiv1.route('/notes/delete', methods=['POST'])
def notes_delete():
    nid = request.form.get('id')
    if not nid:
        return jsonify_status(400, message="ID is not provided")

    try:
        note = Note.get(Note.id == nid)
    except Note.DoesNotExist:
        return jsonify_status(404, message="Note with ID {} was not found".format(nid))

    note.delete_instance()
    return jsonify(message="ok")
