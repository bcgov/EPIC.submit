"""Job-local CHES capture and deterministic Conditions boundary; no outbound calls."""
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlsplit

messages = []
condition = {
    'condition_number': 1, 'condition_name': 'Environmental Management',
    'plan_name': 'E2E Environmental Management Plan',
    'condition_text': 'Submit an environmental management plan for approval.',
    'condition_attributes': {
        'deliverable_name': ['E2E Environmental Management Plan'],
        'requires_management_plan': 'true', 'requires_iem_terms_of_engagement': 'false',
        'requires_consultation': 'true', 'parties_required_to_be_consulted': ['E2E Community'],
        'submitted_to_eao_for': 'Approval', 'milestone_related_to_plan_submission': 'Construction',
        'time_associated_with_submission_milestone': '30 days before',
    },
}


class Handler(BaseHTTPRequestHandler):
    def respond(self, status, body):
        payload = json.dumps(body).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', 'http://web:5173')
        self.send_header('Access-Control-Allow-Headers', 'Authorization,Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        self.end_headers()
        self.wfile.write(payload)

    def do_OPTIONS(self):
        self.respond(204, None)

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == '/health':
            self.respond(200, {'status': 'ok'})
        elif path == '/messages':
            self.respond(200, messages)
        elif path == '/api/conditions/project/e2e-coastal-project':
            self.respond(200, {'conditions': [condition]})
        elif path == '/api/users/groups/SUBMIT/members' and urlsplit(self.path).query == 'sub_group_name=MPT_MANAGER':
            self.respond(200, [{'email': 'manager@example.test'}])
        elif path == '/api/reports/project/e2e-coastal-project':
            self.respond(200, {'reports': []})
        else:
            self.respond(404, {'error': f'Unimplemented boundary: {path}'})

    def do_POST(self):
        body = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        if self.path == '/token':
            self.respond(200, {'access_token': 'e2e-ches-token', 'expires_in': 3600})
        elif self.path == '/api/v1/email':
            if self.headers.get('Authorization') != 'Bearer e2e-ches-token':
                return self.respond(401, {'error': 'Invalid test token'})
            message = json.loads(body)
            recipients = message['to'] + (message.get('cc') or []) + (message.get('bcc') or [])
            if not recipients or not all(address.endswith('@example.test') for address in recipients):
                return self.respond(400, {'error': 'Only synthetic recipients are allowed'})
            if not message.get('body') or not message.get('subject'):
                return self.respond(400, {'error': 'Missing rendered email content'})
            messages.append(message)
            self.respond(201, {'txId': f'e2e-{len(messages)}', 'messages': []})
        else:
            self.respond(404, {'error': f'Unimplemented boundary: {self.path}'})


HTTPServer(('0.0.0.0', 8090), Handler).serve_forever()
