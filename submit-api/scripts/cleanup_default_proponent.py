#!/usr/bin/env python3
"""Cleanup the default E2E proponent user."""
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from submit_api import create_app
from seed_e2e_data import cleanup_test_data

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        cleanup_test_data(guid='71cb238c-147e-4d6b-85d1-de7f8659f049')
