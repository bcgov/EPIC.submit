"""Banner configuration enums.

Manages the banner type options used to style dynamic welcome-page banners.
"""
from __future__ import annotations

import enum


class BannerType(enum.Enum):
    """Enum for banner types.

    Each type maps to a surface/border colour pair in the web app
    (except NONE, which renders with no background or border).
    """

    INFO = 'Info'
    SUCCESS = 'Success'
    WARNING = 'Warning'
    FAILURE = 'Failure'
    NONE = 'None'
