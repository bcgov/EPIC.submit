"""Messages shared by item and package document validation."""
from submit_api.utils.constants import GIS_ITEM_TYPE_NAME


def missing_main_document_message(section_name):
    """Use the same section label and message wherever submission is blocked."""
    label = {
        'Initial Project Description': 'IPD',
        GIS_ITEM_TYPE_NAME: 'GIS',
    }.get(section_name, section_name)
    return (
        'You must have at least one file uploaded in this section '
        f'(section/document name:  {label}) to be able to submit your package'
    )
