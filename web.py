from flask import Flask, abort, render_template, redirect, request, url_for

from models import Note

app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    notes = Note.select()
    edit_note = Note.select().where(Note.id == request.args.get('edit')).first()
    return render_template("index.html", notes=notes, edit_note=edit_note)

@app.route('/create', methods=['POST'])
def save():
    text = request.form.get('text')
    if not text:
        return redirect(url_for('index'))

    nid = request.form.get('id')
    if nid:
        note = Note.get(Note.id == nid)

    if not nid or not note:
        note = Note()

    note.text = text
    note.save()
    return redirect(url_for('index'))

@app.route('/delete', methods=['POST'])
def delete():
    nid = request.form.get('id')
    Note.delete().where(Note.id == nid).execute()
    return redirect(url_for('index'))
