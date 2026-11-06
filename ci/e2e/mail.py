"""Invoke the production email task, without importing unrelated cron jobs."""
from flask import Flask
from config import get_named_config
from epic_cron.models.db import db
from tasks.submit_mail import SubmitMailer

app = Flask(__name__)
app.config.from_object(get_named_config('production'))
db.init_app(app)
with app.app_context():
    SubmitMailer.send_mail()
