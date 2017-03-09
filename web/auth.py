from flask import session

from models import Session, User

def get_session():
    try:
        sid = session['sid']
        return Session.get(Session.id == sid)
    except (KeyError, Session.DoesNotExist):
        sobj = Session.create()
        session['sid'] = sobj.id
        session.modified = True
        return sobj

USER_ID_KEY = 'user_id'

def is_authenticated():
    session = get_session()
    uid = session.getval(USER_ID_KEY)
    return uid and User.select().where(User.id == uid).exists()

def get_user():
    session = get_session()

    uid = session.getval(USER_ID_KEY)
    if not uid:
        return None

    try:
        return User.get(User.id == uid)
    except User.DoesNotExist:
        return None

def login_with_model(user):
    session = get_session()
    session.setval(USER_ID_KEY, user.id, save=True)
    return True

def login_with_uid(uid):
    if not User.select().where(User.id == uid).exists():
        return False

    session = get_session()
    session.setval(USER_ID_KEY, uid, save=True)
    return True

def login_with_creds(username, password):
    try:
        user = User.get(username=username)
    except User.DoesNotExist:
        return False

    if not user.check_password(password):
        return False

    return login_with_model(user)

def login(*args):
    if len(args) == 1:
        arg = args[0]
        if isinstance(arg, User):
            return login_with_model(arg)
        else:
            return login_with_uid(arg)
    elif len(args) == 2:
        return login_with_creds(*args)
    else:
        raise ValueError("login() expects 1 or 2 arguments")

def logout():
    session = get_session()
    session.delval(USER_ID_KEY, save=True)
