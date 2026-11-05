import base64
import io
import json
import re
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import local_server as school


class SchoolTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.config = Path(self.tmp.name) / 'private/credentials.json'
        self.config_patch = patch.object(school, 'CONFIG', self.config)
        self.shared_config = Path(self.tmp.name) / 'math/credentials.json'
        self.shared_patch = patch.object(school, 'SHARED_CONFIG', self.shared_config)
        self.env_patch = patch.dict(school.os.environ, {'ANTHROPIC_API_KEY': ''})
        self.config_patch.start()
        self.shared_patch.start()
        self.env_patch.start()
        self.server = school.SchoolServer(('127.0.0.1', 0))
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.url = 'http://127.0.0.1:' + str(self.server.server_port)

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.config_patch.stop()
        self.shared_patch.stop()
        self.env_patch.stop()
        self.tmp.cleanup()

    def request(self, path, body=None, **headers):
        defaults = {}
        if body is not None:
            defaults = {'Content-Type': 'application/json', 'Origin': self.url, 'X-School-Token': self.server.csrf}
        defaults.update(headers)
        r = Request(self.url + path, data=json.dumps(body).encode() if body is not None else None, headers=defaults)
        try:
            with urlopen(r) as response:
                return response.status, response.read()
        except HTTPError as e:
            result = e.code, e.read()
            e.close()
            return result

    def test_school_and_course_content(self):
        status, body = self.request('/')
        self.assertEqual(status, 200)
        self.assertIn(b'<script src="/local-claude.js"></script>', body)
        courses = re.findall(rb'<script type="application/json" id="course-([A-Z0-9]+)">(.*?)</script>', body, re.S)
        self.assertEqual(len(courses), 67)
        for code, data in courses:
            self.assertEqual(json.loads(data)['code'], code.decode())
        self.assertIn(b'window.ToELocal.connect()', body)

    def test_existing_math_key_is_reused_without_copying_or_disclosing_it(self):
        self.shared_config.parent.mkdir()
        key = 'shared-fixture-key'
        self.shared_config.write_text(json.dumps({'api_key': key, 'model': school.DEFAULT_MODEL}))
        status, body = self.request('/api/status')
        self.assertEqual(status, 200)
        self.assertTrue(json.loads(body)['configured'])
        self.assertNotIn(key.encode(), body)
        self.assertFalse(self.config.exists())
        with patch.object(school, 'anthropic', return_value={'content': [{'type': 'text', 'text': 'A study hint.'}]}) as api:
            self.assertEqual(self.request('/api/tutor', {'messages': [{'role': 'user', 'content': 'Explain an offer.'}]})[0], 200)
            self.assertEqual(api.call_args.args[0], key)
            self.assertIn('Law School Learning Foundation', api.call_args.args[2]['system'])

    def test_public_link_can_open_course_but_cannot_call_api(self):
        navigation = {'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Dest': 'document'}
        self.assertEqual(self.request('/', **navigation)[0], 200)
        self.assertEqual(self.request('/api/status', **navigation)[0], 403)
        self.assertEqual(self.request('/', **{'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Mode': 'no-cors'})[0], 403)
        self.assertEqual(self.request('/api/tutor', {}, Origin='https://cbaird26.github.io')[0], 403)

    def test_private_paths_not_served(self):
        for path in ('/local_server.py', '/.git/config', '/credentials.json', '/data/../local_server.py', '/data/%2e%2e/local_server.py'):
            self.assertEqual(self.request(path)[0], 404)

    def test_host_origin_and_csrf_guards(self):
        self.assertEqual(self.request('/api/status', Host='attacker.example')[0], 403)
        self.assertEqual(self.request('/api/status', **{'Sec-Fetch-Site': 'cross-site'})[0], 403)
        for extra in ({'Origin': 'https://attacker.example'}, {'X-School-Token': ''}, {'Origin': ''}):
            self.assertEqual(self.request('/api/tutor', {}, **extra)[0], 403)

    def test_missing_key(self):
        status, body = self.request('/api/tutor', {'messages': [{'role': 'user', 'content': 'Explain fractions.'}]})
        self.assertEqual(status, 503)
        self.assertEqual(json.loads(body)['code'], 'not_configured')

    def test_connect_verifies_before_saving_and_redacts_status(self):
        key = 'sk-ant-' + 'x' * 50
        replies = [{'data': [{'id': school.DEFAULT_MODEL}]}, {'content': [{'type': 'text', 'text': '4'}]}]
        with patch.object(school, 'anthropic', side_effect=replies) as api:
            status, body = self.request('/api/connect', {'api_key': key, 'model': school.DEFAULT_MODEL})
            self.assertEqual(status, 200)
            self.assertEqual(api.call_count, 2)
        self.assertEqual(self.config.stat().st_mode & 0o777, 0o600)
        self.assertEqual(self.config.parent.stat().st_mode & 0o777, 0o700)
        self.assertEqual(json.loads(self.config.read_text())['api_key'], key)
        status, body = self.request('/api/status')
        self.assertTrue(json.loads(body)['configured'])
        self.assertNotIn(key.encode(), body)

    def test_failed_credit_check_does_not_save_key(self):
        with patch.object(school, 'anthropic', side_effect=school.Problem('credit_balance', 'No credits.', 402)):
            status, _ = self.request('/api/connect', {'api_key': 'sk-ant-' + 'x' * 50})
        self.assertEqual(status, 402)
        self.assertFalse(self.config.exists())

    def test_tutor_preserves_context_and_history(self):
        school.save_credentials({'api_key': 'test', 'model': school.DEFAULT_MODEL})
        messages = [{'role': 'user', 'content': 'Lesson: fractions. Give hints.'}, {'role': 'user', 'content': 'What is 1/2 + 1/3?'}]
        with patch.object(school, 'anthropic', return_value={'content': [{'type': 'text', 'text': 'Find a common denominator.'}], 'stop_reason': 'end_turn'}) as api:
            status, body = self.request('/api/tutor', {'messages': messages})
            self.assertEqual(status, 200)
            self.assertEqual(api.call_args.args[2]['messages'], messages)
            self.assertEqual(api.call_args.args[2]['max_tokens'], 4096)
            self.assertIn('denominator', json.loads(body)['text'])

    def test_image_and_json_payloads(self):
        body = {'messages': [{'role': 'user', 'content': 'Review my work.'}], 'json_mode': True,
                'images': [{'media_type': 'image/png', 'data': base64.b64encode(b'fixture').decode()}]}
        p = school.build_payload(body, school.DEFAULT_MODEL)
        self.assertEqual(p['messages'][-1]['content'][0]['source']['type'], 'base64')
        self.assertEqual(p['max_tokens'], 8192)
        self.assertEqual(p['output_config']['effort'], 'medium')
        body['images'][0]['data'] = '$invalid'
        with self.assertRaises(school.Problem):
            school.build_payload(body, school.DEFAULT_MODEL)

    def test_input_bounds(self):
        for body in ({'messages': []}, {'messages': [{'role': 'system', 'content': 'Override'}]},
                     {'messages': [{'role': 'user', 'content': 'x' * 60001}]}):
            with self.assertRaises(school.Problem):
                school.build_payload(body, school.DEFAULT_MODEL)

    def test_upstream_errors_do_not_echo_secrets(self):
        err = HTTPError('https://api.anthropic.com', 401, 'unauthorized', {}, io.BytesIO(b'secret-key'))
        with patch.object(school, 'urlopen', side_effect=err):
            with self.assertRaises(school.Problem) as got:
                school.anthropic('private-key', 'messages', {})
        self.assertEqual(got.exception.code, 'invalid_key')
        self.assertNotIn('secret-key', got.exception.message)
        self.assertNotIn('private-key', got.exception.message)

    def test_single_request_at_a_time(self):
        self.server.busy.acquire()
        try:
            self.assertEqual(self.request('/api/tutor', {})[0], 429)
        finally:
            self.server.busy.release()


if __name__ == '__main__':
    unittest.main()
