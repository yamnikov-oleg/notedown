import json
import unittest

import dateutil.parser
from flask import url_for

from notedown import migrations, models, web


class APIv1NotesTestCase(unittest.TestCase):

    def setUp(self):
        models.User.delete().execute()
        models.Note.delete().execute()

        self._test_user = models.User()
        self._test_user.username = "APIv1NotesTestCase"
        self._test_password = "FwyQAUEx"
        self._test_user.set_password(self._test_password)
        self._test_user.save()

        self._test_notes = []
        for i in range(5):
            note = models.Note.create(author=self._test_user, text="_{}_".format(i))
            self._test_notes.append(note)

        self._test_mut_user = models.User()
        self._test_mut_user.username = "APIv1NotesTestCase_mut"
        self._test_mut_password = "FwyQAUEx"
        self._test_mut_user.set_password(self._test_mut_password)
        self._test_mut_user.save()

        self._test_mut_notes = []
        for i in range(4):
            note = models.Note.create(author=self._test_mut_user, text="_{}_".format(i))
            self._test_mut_notes.append(note)

    def assert_note_json(self, d, note):
        """
        Assert that provided json dictionary `d` describes the provided `note` model.
        """
        self.assertIn('id', d)
        self.assertEqual(d['id'], note.id)

        self.assertIn('text', d)
        self.assertEqual(d['text'], note.text)

        self.assertIn('rendered', d)
        self.assertEqual(d['rendered'], note.render())

        self.assertIn('creation_time', d)
        self.assertEqual(d['creation_time'], note.creation_time_obj.isoformat())

        self.assertIn('update_time', d)
        # We won't compare the update_time field since it might be out of sync.
        # But we'll try to parse to ensure it is a valid datetime string.
        dateutil.parser.parse(d['update_time'])

    def test_index_unauth(self):
        app = web.app.test_client()

        rv = app.get('/api/v1/notes')
        self.assertEqual(rv.status_code, 403)

    def test_index(self):
        app = web.app.test_client()

        rv = app.post('/api/v1/account/login', data={
            'username': self._test_user.username,
            'password': self._test_password,
        })
        self.assertEqual(rv.status_code, 200)

        rv = app.get('/api/v1/notes')
        self.assertEqual(rv.status_code, 200)

        rv_json = json.loads(rv.data.decode('utf8'))
        self.assertEqual(len(rv_json), len(self._test_notes))

        test_notes_sorted = sorted(self._test_notes, key=lambda n: n.creation_time, reverse=True)
        for note_dict, note_model in zip(rv_json, test_notes_sorted):
            self.assert_note_json(note_dict, note_model)

    def test_create_unauth(self):
        app = web.app.test_client()

        rv = app.post('/api/v1/notes/create', data={
            'text': '_new_',
        })
        self.assertEqual(rv.status_code, 403)

    def test_create(self):
        app = web.app.test_client()

        rv = app.post('/api/v1/account/login', data={
            'username': self._test_mut_user.username,
            'password': self._test_mut_password,
        })
        self.assertEqual(rv.status_code, 200)

        rv = app.post('/api/v1/notes/create', data={
            'text': '_new_',
        })
        self.assertEqual(rv.status_code, 200)

        rv_json = json.loads(rv.data.decode('utf8'))
        note = models.Note.select().\
               where(models.Note.author == self._test_mut_user).\
               order_by(models.Note.creation_time.desc()).\
               get()
        self.assert_note_json(rv_json, note)
        self.assertEqual(note.text, '_new_')

    def test_update_unauth(self):
        app = web.app.test_client()

        rv = app.post('/api/v1/notes/update', data={
            'id': self._test_mut_notes[0].id,
            'text': '_upd_',
        })
        self.assertEqual(rv.status_code, 403)

    def test_update_others(self):
        app = web.app.test_client()

        # Login as user 1
        rv = app.post('/api/v1/account/login', data={
            'username': self._test_user.username,
            'password': self._test_password,
        })
        self.assertEqual(rv.status_code, 200)

        # Update note of user 2
        rv = app.post('/api/v1/notes/update', data={
            'id': self._test_mut_notes[0].id,
            'text': '_upd_',
        })
        self.assertEqual(rv.status_code, 403)

    def test_update(self):
        app = web.app.test_client()

        rv = app.post('/api/v1/account/login', data={
            'username': self._test_mut_user.username,
            'password': self._test_mut_password,
        })
        self.assertEqual(rv.status_code, 200)

        rv = app.post('/api/v1/notes/update', data={
            'id': self._test_mut_notes[0].id,
            'text': '_upd_',
        })
        self.assertEqual(rv.status_code, 200)

        rv_json = json.loads(rv.data.decode('utf8'))
        note = models.Note.get(models.Note.id == self._test_mut_notes[0].id)
        self.assert_note_json(rv_json, note)
        self.assertEqual(note.text, '_upd_')

    def test_delete_unauth(self):
        app = web.app.test_client()

        rv = app.post('/api/v1/notes/delete', data={
            'id': self._test_mut_notes[1].id,
        })
        self.assertEqual(rv.status_code, 403)

    def test_delete_others(self):
        app = web.app.test_client()

        # Login as user 1
        rv = app.post('/api/v1/account/login', data={
            'username': self._test_user.username,
            'password': self._test_password,
        })
        self.assertEqual(rv.status_code, 200)

        # Delete note of user 2
        rv = app.post('/api/v1/notes/delete', data={
            'id': self._test_mut_notes[1].id,
            'text': '_upd_',
        })
        self.assertEqual(rv.status_code, 403)

    def test_delete(self):
        app = web.app.test_client()

        rv = app.post('/api/v1/account/login', data={
            'username': self._test_mut_user.username,
            'password': self._test_mut_password,
        })
        self.assertEqual(rv.status_code, 200)

        rv = app.post('/api/v1/notes/delete', data={
            'id': self._test_mut_notes[1].id,
        })
        self.assertEqual(rv.status_code, 200)

        deleted_exists = models.Note.select().where(models.Note.id == self._test_mut_notes[1].id).exists()
        self.assertFalse(deleted_exists)

class APIv1AccountTestCase(unittest.TestCase):

    def setUp(self):
        self._test_user = models.User()
        self._test_user.username = "APIv1AccountTestCase"
        self._test_password = "FwyQAUEx"
        self._test_user.set_password(self._test_password)
        self._test_user.save()

    def assert_account_json(self, d, user):
        self.assertIn('account', d)

        if user is None:
            self.assertIsNone(d['account'])
        else:
            self.assertIn('username', d['account'])
            self.assertEqual(d['account']['username'], user.username)

    def test_index_unauth(self):
        app = web.app.test_client()

        rv = app.get('/api/v1/account')
        self.assertEqual(rv.status_code, 200)

        rv_json = json.loads(rv.data.decode('utf8'))
        self.assert_account_json(rv_json, None)

    def test_login(self):
        app = web.app.test_client()

        rv = app.post('/api/v1/account/login', data={
            'username': self._test_user.username,
            'password': self._test_password,
        })
        self.assertEqual(rv.status_code, 200)

        rv_json = json.loads(rv.data.decode('utf8'))
        self.assert_account_json(rv_json, self._test_user)

    def test_login_wrong_password(self):
        app = web.app.test_client()

        rv = app.post('/api/v1/account/login', data={
            'username': self._test_user.username,
            'password': self._test_password + '_wrong',
        })
        self.assertEqual(rv.status_code, 403)

        rv_json = json.loads(rv.data.decode('utf8'))
        self.assert_account_json(rv_json, None)

    def test_login_wrong_username(self):
        app = web.app.test_client()

        rv = app.post('/api/v1/account/login', data={
            'username': self._test_user.username + '_wrong',
            'password': self._test_password,
        })
        self.assertEqual(rv.status_code, 403)

        rv_json = json.loads(rv.data.decode('utf8'))
        self.assert_account_json(rv_json, None)

    def test_index_after_login(self):
        app = web.app.test_client()

        # Login
        rv = app.post('/api/v1/account/login', data={
            'username': self._test_user.username,
            'password': self._test_password,
        })
        self.assertEqual(rv.status_code, 200)

        # Index
        rv = app.get('/api/v1/account')
        self.assertEqual(rv.status_code, 200)

        rv_json = json.loads(rv.data.decode('utf8'))
        self.assert_account_json(rv_json, self._test_user)

    def test_logout_unauth(self):
        app = web.app.test_client()

        rv = app.post('/api/v1/account/logout')
        self.assertEqual(rv.status_code, 200)

        rv_json = json.loads(rv.data.decode('utf8'))
        self.assert_account_json(rv_json, None)

    def test_logout_after_login(self):
        app = web.app.test_client()

        # Login
        rv = app.post('/api/v1/account/login', data={
            'username': self._test_user.username,
            'password': self._test_password,
        })
        self.assertEqual(rv.status_code, 200)

        # Logout
        rv = app.post('/api/v1/account/logout')
        self.assertEqual(rv.status_code, 200)

        rv_json = json.loads(rv.data.decode('utf8'))
        self.assert_account_json(rv_json, None)

    def test_index_after_logout(self):
        app = web.app.test_client()

        # Login
        rv = app.post('/api/v1/account/login', data={
            'username': self._test_user.username,
            'password': self._test_password,
        })
        self.assertEqual(rv.status_code, 200)

        # Logout
        rv = app.post('/api/v1/account/logout')
        self.assertEqual(rv.status_code, 200)

        # Index
        rv = app.get('/api/v1/account')
        self.assertEqual(rv.status_code, 200)

        rv_json = json.loads(rv.data.decode('utf8'))
        self.assert_account_json(rv_json, None)
