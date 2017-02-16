from flask import Flask, request, abort

import models

app = Flask(__name__)

@app.route('/')
def root():
    text_iter = models.Note.select(models.Note.text).tuples().execute()
    texts = []
    for (t,) in text_iter:
        texts.append(t)
    return "\n".join(texts)

@app.route('/create')
def create():
    text = request.args.get('text')
    if not text:
        abort(400)
    models.Note.create(text=text)
    return "Created:\n" + text
