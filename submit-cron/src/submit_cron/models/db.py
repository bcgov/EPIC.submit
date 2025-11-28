"""Initilizations for db, migration and marshmallow."""

from contextlib import contextmanager

from flask import current_app
from flask_marshmallow import Marshmallow
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


# DB initialize in __init__ file
# db variable use for create models from here
db = SQLAlchemy()

# Migrate initialize in __init__ file
# Migrate database config
migrate = Migrate()

# Marshmallow for database model schema
ma = Marshmallow()


def create_session(engine_uri):
    """Create a sessionmaker for the given database engine URI."""
    engine = create_engine(engine_uri)
    return sessionmaker(bind=engine)


def init_centre_db(app):
    """Initialize the session for the Compliance database."""
    print("Initializing Compliance database...")
    return create_session(app.config['CENTRE_DATABASE_URI'])


def init_submit_db(current_app):
    """Initialize the session for the Submit database."""
    print("Initializing Submit database...")
    app = current_app._get_current_object()
    db.init_app(app)
    return
