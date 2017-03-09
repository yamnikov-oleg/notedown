from flask import session

from models import Session

def get_session():
    try:
        sid = session['sid']
        return Session.get(Session.id == sid)
    except (KeyError, Session.DoesNotExist):
        sobj = Session.create()
        session['sid'] = sobj.id
        session.modified = True
        return sobj
