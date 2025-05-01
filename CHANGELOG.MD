## April 30, 2025

- **Feature**: EAO/Entity - display text to inform which package version is the enforceable version
Description [🎟️SUBMIT-458](https://eao-dst.atlassian.net/browse/SUBMIT-458)
  - Display a notice on the current submission if a previous version was approved.
  - Highlight the most recently approved submission with a green badge and the message.
  - Applied the same green and orange color styles as the existing status badges for consistency.

- **Bug**: Fix - error page when registering new user [🎟️SUBMIT-519](https://eao-dst.atlassian.net/browse/SUBMIT-519)
  - Fixed an issue during new user registration where navigation to the error page occurred.

## April 29, 2025

- **Feature**: Entity - Creating submission -Content update [🎟️SUBMIT-403](https://eao-dst.atlassian.net/browse/SUBMIT-403)
  - Updated the "New Submission" page to match the new header style
  - Adjusted font weights and spacing between sections for consistency and readability.

- **Bug**: MP upload glitch [🎟️SUBMIT-516](https://eao-dst.atlassian.net/browse/SUBMIT-516)
  - Fixed issues with uploading multiple documents simultaneously.

- **Bug**: Error Message when User is booted out if they spend too long logged in [🎟️SUBMIT-430](https://eao-dst.atlassian.net/browse/SUBMIT-430)
  - Add a go home button in error page
  - Refresh session silently
  - Navigate to login page if unauthenticated and handle it

## April 25, 2025

- **Feature**: Entity - User Management - Table tweak & Regenerate Email Invite [🎟️SUBMIT-448](https://eao-dst.atlassian.net/browse/SUBMIT-448)
  - Changes on user management table
    - Renamed "User Name" column to "Name".
    - Made Name and Email fields plain text (not clickable).
    - Added "Actions" column with context-specific options:
        - "Resend Email Invite" – visible only if the user is invited but hasn't signed up.
        - "Revoke User" – visible only if the user is invited but hasn't signed up.
        - "View/Edit User Access" – visible only if the user is active.
    - For Collaborator - Specific Submissions, a tooltip now displays their assigned submissions.

- **Feature**: Status badge - Addition of 'Review' to the 'Submitted to EAO for' attribute [🎟️SUBMIT-508](https://eao-dst.atlassian.net/browse/SUBMIT-508)
  - Added a new 'REVIEWED' status badge to indicate when a plan has been submitted to EAO for review.

## April 24, 2025

- **Feature**: Verify Max File Size [🎟️SUBMIT-480](https://eao-dst.atlassian.net/browse/SUBMIT-480)
  - Max file size increased to 500 MB from existing 250MB.
  - UI updated to reflect the same.

- **Feature**: Set up the "Update Requested" email to be sent for a "Revision Required" (CC and MP) [🎟️SUBMIT-501](https://eao-dst.atlassian.net/browse/SUBMIT-501)
  - Made the EPIC.submit link the BC Gov blue (like in the User invite email) for "Update Requested" email. 
  - Added emails for failed consultation checks & failed management plans.

## April 22, 2025

- **Bug**: EAO logo | EPIC.submit should link back to home page (logged in and not logged in) + fix site name [🎟️SUBMIT-477](https://eao-dst.atlassian.net/browse/SUBMIT-477)
  - Clicking the EAO logo or EPIC.submit in the header now navigates to the homepage.
  - Chaged the text on header from EPIC.Submit to EPIC.submit

- **Bug**: Link to BCeId should wrap OR be shortened so it fits in the box [🎟️SUBMIT-511](https://eao-dst.atlassian.net/browse/SUBMIT-511)
  - Shorten link for BCeId on home page

## v1.0.0 - 2025-04-21

- App released to production
- Added changelog
