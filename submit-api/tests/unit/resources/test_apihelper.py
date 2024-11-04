# Copyright © 2024 Province of British Columbia
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
"""Meta information about the test.

to test api helper functions
"""
import pytest

from src.submit_api.resources.apihelper import Api


@pytest.fixture(scope="session")
def app(app):
    """Defining app test fixture"""
    api = Api(app)
    app.api = api
    return app


def test_specs_url_http(app):
    """Test that the specs_url uses http scheme when port 3200 is in base_url."""
    with app.test_request_context(base_url='http://localhost:3200/'):
        print(app.extensions)
        api = app.api
        # api = Api(app)
        assert api.specs_url == 'http://localhost:3200/swagger.json'


def test_specs_url_https(app):
    """Test that the specs_url uses https scheme when port 3200 is not in base_url."""
    with app.test_request_context(base_url='https://example.com/'):
        # api = Api(app)
        api = app.api
        assert api.specs_url == 'https://example.com/swagger.json'
