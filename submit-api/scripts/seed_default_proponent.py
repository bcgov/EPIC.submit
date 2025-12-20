#!/usr/bin/env python3
"""Seed the default E2E proponent user."""
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from submit_api import create_app
from seed_e2e_data import seed_proponent_user

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        seed_proponent_user(
            guid='71cb238c-147e-4d6b-85d1-de7f8659f049',
            proponent_id=8888,
            first_name='E2E',
            last_name='Proponent',
            position='Test Administrator',
            work_email='e2e.proponent@test.example.com',
            work_phone='555-0100',
            extension='101',
            role_name='PROJECT_ADMIN'
        )
