import json
import unittest

from flask import url_for

import migrations
import models
import web

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
