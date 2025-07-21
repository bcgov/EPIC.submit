# Copyright © 2019 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Generate account statements.

This module will create statement records for each account.
"""
import os
import sys

from flask import Flask

from utils.logger import setup_logging
from datetime import datetime

from submit_api.models.project import  Project

import config

setup_logging(os.path.join(os.path.abspath(os.path.dirname(__file__)), 'logging.conf'))  # important to do this first


def create_app(run_mode=os.getenv('FLASK_ENV', 'production')):
    """Return a configured Flask App using the Factory method."""
    from submit_cron.models import db
    from submit_cron.models import ma

    app = Flask(__name__)
    print(f'>>>>> Creating app in run_mode: {run_mode}')
    print(f'>>>>> Creating app in run_mode: {config.get_named_config(run_mode)}')


    app.config.from_object(config.get_named_config(run_mode))
    # Configure Sentry
    app.logger.info(f'<<<< Starting Jobs >>>>')
    db.init_app(app)
    ma.init_app(app)



    register_shellcontext(app)

    return app


def register_shellcontext(app):
    """Register shell context objects."""

    def shell_context():
        """Shell context objects."""
        return {
            'app': app
        }  # pragma: no cover

    app.shell_context_processor(shell_context)


def run(job_name):
    from tasks.submit_mail import SubmitMailer
    from tasks.sync_approved_condition import SyncApprovedCondition
    application = create_app()
    from submit_cron.models import db
    from submit_cron.models import ma

    with application.app_context():

        print('Requested Job:', job_name)
        if job_name == 'EMAIL':
            print('Starting Email Sending At ', datetime.now())

            SubmitMailer.send_mail()
            application.logger.info(f'<<<< Completed Submit Email Task >>>>')
        elif job_name == 'SYNC_CONDITION':
            SyncApprovedCondition.sync_approved_condition()
            application.logger.info(f'<<<< Completed Sync Approved Condition >>>>')



if __name__ == "__main__":
    run(sys.argv[1])

