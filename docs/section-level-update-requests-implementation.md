# Section-Level Update Requests - Implementation Summary

## Overview
This document summarizes the implementation of the section-level update request feature that allows EAO staff to flag specific submission item types for updates and send requests with notes to proponents.

## Implementation Date
December 2024

## Key Changes

### 1. New Components Created

#### SectionUpdateRequestPanel
**Location:** `submit-web/src/components/App/SubmissionItem/SectionUpdateRequestPanel/`

**Files:**
- `index.tsx` - Main panel component
- `PendingRequestCollapsible.tsx` - Displays pending (unsent) update requests
- `SentRequestCollapsible.tsx` - Displays sent update requests
- `types.ts` - TypeScript type definitions

**Purpose:** 
Replaces the centralized `UpdateRequestWidget` for staff views of IPD, Engagement Plan, and Geospatial submissions. Displays pending and sent update requests in collapsible panels with color-coded styling.

**Features:**
- Pending requests: Orange border (#f5a623), warm background (#fffdf5)
- Sent requests: Gray border (#e0e0e0), light gray background (#fafafa)
- Individual "Remove" links for pending requests
- Text area for request notes
- "Send Request to Proponent" button

#### Staff Views
**Location:** `submit-web/src/components/App/SubmissionItem/`

**New Files:**
- `IPDSubmission/IPDStaffView/index.tsx`
- `EPSubmission/EPStaffView/index.tsx`
- `GeoSpatialInformation/GeoSpatialStaffView.tsx`

**Purpose:**
Dedicated staff views for IPD, Engagement Plan, and Geospatial Information submission types that integrate the new section-level update request functionality.

**Features:**
- Display document upload sections using `GenericDocumentUploadSection`
- Manage pending and sent update requests state
- Handle flagging sections, removing flags, updating notes, and sending requests
- Integrate with existing API hooks for creating update requests

### 2. Modified Components

#### GenericDocumentUploadSection
**Location:** `submit-web/src/components/App/DocumentUpload/GenericDocumentUploadSection.tsx`

**Changes:**
- Added optional props: `onRequestUpdate`, `itemTypeId`, `itemTypeName`
- Added "Request Update" link with refresh icon to section headers (staff views only)
- Link appears on the right side of section headers when props are provided

**Purpose:**
Enable staff to flag individual sections for update requests directly from the document upload interface.

#### StaffItemForm
**Location:** `submit-web/src/components/App/SubmissionItem/ItemForm/StaffItemForm.tsx`

**Changes:**
- Added imports for new staff views
- Added routing cases for IPD, Engagement Plan, and Geospatial Information

**Purpose:**
Route staff users to the appropriate staff view based on submission item type.

### 3. Backend Integration

**No backend changes required.** The existing `update_requests` table and API endpoints work as-is:
- `submission_item_types` column (array of integers) stores the item type IDs
- One update request is created per flagged section
- Each request includes the item type ID and a note

**API Endpoint Used:**
- `POST /packages/{package_id}/update-request`
- Payload: `{ submission_item_types: [itemTypeId], note: "..." }`

### 4. Status Badges

**No changes required.** The existing status badge system already supports:
- `UPDATE_REQUESTED` status in `SubmissionStatusChip`
- `UPDATE_REQUESTED` status in `PackageStatusChip`
- Logic in `StaffStatusCell` to display badges based on active update requests

## User Flow

### Staff Workflow
1. Navigate to a submission item (IPD, Engagement Plan, or Geospatial)
2. Click "Request Update" link next to a section header
3. Section appears in the "Update Requests" panel below with orange styling
4. Enter a note explaining what needs to be revised
5. Optionally flag additional sections
6. Click "Send Request to Proponent" to send all pending requests
7. Sent requests collapse and change to gray styling
8. Status badges automatically update to show "Update Requested"

### Proponent Workflow
1. Receive notification of update request
2. View submission package with "Update Requested" badge
3. Navigate to flagged submission item
4. See update request details in existing `UpdateRequestWidget`
5. Upload revised documents
6. Resubmit package

## Technical Details

### State Management
- Pending requests managed in component state (`useState`)
- Sent requests derived from `submissionPackage.update_requests`
- Automatic cache invalidation after sending requests

### Data Flow
1. Staff flags section → Added to `pendingRequests` state
2. Staff sends requests → API calls to create update requests
3. Cache invalidated → Fresh data fetched
4. Sent requests appear in panel → Derived from package data

### Styling
- Uses `BCDesignTokens` from `epic.theme` for consistent styling
- Color scheme matches Figma design specifications
- Responsive layout using Material-UI Grid system

## Testing Considerations

### Unit Tests
- Test `SectionUpdateRequestPanel` rendering with pending/sent requests
- Test `PendingRequestCollapsible` note updates and remove functionality
- Test `SentRequestCollapsible` display of request details

### Integration Tests
- Test staff view integration with `GenericDocumentUploadSection`
- Test API integration for creating update requests
- Test cache invalidation and data refresh

### E2E Tests
- Test complete staff workflow: flag → note → send
- Test proponent view of received update requests
- Test status badge updates
- Test multiple section flagging and sending

## Files Modified

### Created
- `submit-web/src/components/App/SubmissionItem/SectionUpdateRequestPanel/index.tsx`
- `submit-web/src/components/App/SubmissionItem/SectionUpdateRequestPanel/PendingRequestCollapsible.tsx`
- `submit-web/src/components/App/SubmissionItem/SectionUpdateRequestPanel/SentRequestCollapsible.tsx`
- `submit-web/src/components/App/SubmissionItem/SectionUpdateRequestPanel/types.ts`
- `submit-web/src/components/App/SubmissionItem/IPDSubmission/IPDStaffView/index.tsx`
- `submit-web/src/components/App/SubmissionItem/EPSubmission/EPStaffView/index.tsx`
- `submit-web/src/components/App/SubmissionItem/GeoSpatialInformation/GeoSpatialStaffView.tsx`

### Modified
- `submit-web/src/components/App/DocumentUpload/GenericDocumentUploadSection.tsx`
- `submit-web/src/components/App/SubmissionItem/ItemForm/StaffItemForm.tsx`

## Known Limitations

1. **Section Granularity**: The implementation treats each submission item type as a single "section". For IPD, which has multiple document folders (IPD and Supporting Documents), the entire item type is flagged, not individual folders.

2. **Optional Sections**: The current implementation does not distinguish between optional and required sections. All sections show the "Request Update" link.

3. **Bulk Operations**: Staff can only remove pending requests individually, not in bulk.

## Future Enhancements

1. Add ability to edit notes on sent requests
2. Support for sub-section level requests (e.g., individual document folders within IPD)
3. Bulk remove functionality for pending requests
4. Email notifications to proponents when requests are sent
5. Activity logging for update request actions

## Related JIRA Tickets
- [Original JIRA ticket reference]

## Related Figma Designs
- https://www.figma.com/design/FNwV0IZ0XKPLrcHeEfobd0/EPIC.submit-v2.0-Jira---EAO---EE-IPD?node-id=155-8680&m=dev
