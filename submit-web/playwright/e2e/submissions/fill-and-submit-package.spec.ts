/**
 * Submission Package Fill & Submit E2E Test
 *
 * Tests the complete submission package workflow:
 * 1. Start with pre-seeded package (with items ready to fill)
 * 2. Fill Contact Information form
 * 3. Fill Consultation Record form with file uploads
 * 4. Fill Management Plan form with file uploads
 * 5. Submit package to EAO
 * 6. Verify submission success
 *
 * Prerequisites (handled by fixtures):
 * - Seeded proponent user with account
 * - Seeded project linked to account
 * - Seeded package with items (Contact Info, Consultation Record, Management Plan)
 * - Authenticated session
 * - Navigated to package page
 */

import { test, expect } from "../../fixtures/db.fixtures";
import {
  SubmissionPackagePage,
  ContactInformationPage,
  ConsultationRecordPage,
  ManagementPlanPage,
} from "../../pages/submissions";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const testDataDir = path.join(__dirname, "..", "..", "test-data");

test.describe("Submission Package Fill & Submit", () => {
  test("proponent can fill and submit a complete Management Plan package", async ({
    authenticatedProponentWithPackage,
  }) => {
    const { page, accountProjectId, packageId } =
      authenticatedProponentWithPackage;

    // Initialize Page Objects
    const packagePage = new SubmissionPackagePage(page);
    const contactPage = new ContactInformationPage(page);
    const consultationPage = new ConsultationRecordPage(page);
    const managementPlanPage = new ManagementPlanPage(page);

    console.log("\n🧪 [Test] Starting fill and submit package test...");

    // STEP 1: Verify we're on package page
    console.log("\n✓ [Step 1] Verify on package page");
    await packagePage.verifyOnSubmissionPackage();
    await expect(page).toHaveURL(
      `/proponent/projects/${accountProjectId}/submission-packages/${packageId}`,
    );

    // STEP 2: Fill Contact Information
    console.log("\n✓ [Step 2] Filling Contact Information");
    await packagePage.clickItem("Submission Contact Information");

    await contactPage.fillContactInformation({
      primaryContact: {
        givenName: "John",
        surname: "Doe",
        company: "Test Corp",
        position: "Project Manager",
        phone: "(250) 555-1234",
        extension: "101",
        email: "john.doe@testcorp.com",
      },
      secondaryContact: {
        givenName: "Jane",
        surname: "Smith",
        company: "Test Corp",
        position: "Environmental Lead",
        phone: "(250) 555-5678",
        extension: "102",
        email: "jane.smith@testcorp.com",
      },
    });

    await contactPage.verifySaved();
    console.log("  ✓ Contact Information saved successfully");

    // Navigate back to package
    await packagePage.navigateToPackage(accountProjectId, packageId);

    // STEP 3: Fill Consultation Record
    console.log("\n✓ [Step 3] Filling Consultation Record");
    await packagePage.clickItem("Consultation Record");

    await consultationPage.fillConsultationRecord({
      consultedParties: ["First Nations Group A", "Local Community B"],
      allPartiesConsulted: true,
      planWasReviewed: true,
      writtenExplanationsToParties: true,
      writtenExplanationsToCommenters: true,
      notes:
        "All consultation requirements have been met. Comprehensive engagement was conducted with all affected parties.",
    });

    // Upload consultation record files
    const consultationFile = path.join(
      testDataDir,
      "test-consultation-record.pdf",
    );
    console.log("  - Uploading consultation record file...");
    await consultationPage.uploadFiles([consultationFile]);

    await consultationPage.saveAndComplete();
    await consultationPage.verifySaved();
    console.log("  ✓ Consultation Record saved successfully");

    // Navigate back to package
    await packagePage.navigateToPackage(accountProjectId, packageId);

    // STEP 4: Fill Management Plan
    console.log("\n✓ [Step 4] Filling Management Plan");
    await packagePage.clickItem("Management Plan");

    await managementPlanPage.fillManagementPlan({
      conditionSatisfied: true,
      allRequirementsAddressed: true,
      informationAccurate: true,
      notes:
        "This management plan fully addresses all EA Certificate conditions and requirements.",
    });

    // Upload management plan and supporting documents
    const managementPlanFile = path.join(
      testDataDir,
      "test-management-plan.pdf",
    );
    const supportingDoc1 = path.join(
      testDataDir,
      "test-supporting-doc-1.pdf",
    );
    const supportingDoc2 = path.join(
      testDataDir,
      "test-supporting-doc-2.docx",
    );

    console.log("  - Uploading management plan file...");
    await managementPlanPage.uploadManagementPlan(managementPlanFile);

    console.log("  - Uploading supporting documents...");
    await managementPlanPage.uploadSupportingDocuments([
      supportingDoc1,
      supportingDoc2,
    ]);

    await managementPlanPage.saveAndComplete();
    await managementPlanPage.verifySaved();
    console.log("  ✓ Management Plan saved successfully");

    // Navigate back to package
    await packagePage.navigateToPackage(accountProjectId, packageId);

    // STEP 5: Submit Package
    console.log("\n✓ [Step 5] Submitting package to EAO");
    await packagePage.submitPackage();

    // STEP 6: Verify Submission Success
    console.log("\n✓ [Step 6] Verifying submission success");
    await packagePage.verifySubmissionSuccess();

    // Verify we're still on package page (or redirected to success page)
    await expect(page).toHaveURL(
      new RegExp(
        `/proponent/projects/${accountProjectId}/submission-packages/${packageId}`,
      ),
    );

    console.log("\n✅ [Test] Package filled and submitted successfully!");
  });

  test("package form navigation works correctly", async ({
    authenticatedProponentWithPackage,
  }) => {
    const { page, accountProjectId, packageId } =
      authenticatedProponentWithPackage;

    const packagePage = new SubmissionPackagePage(page);
    const contactPage = new ContactInformationPage(page);

    console.log("\n🧪 [Test] Testing package form navigation...");

    // Verify on package page
    await packagePage.verifyOnSubmissionPackage();

    // Click to Contact Information
    await packagePage.clickItem("Submission Contact Information");
    await contactPage.verifyOnContactInformationPage();

    // Navigate back to package
    await packagePage.navigateToPackage(accountProjectId, packageId);
    await packagePage.verifyOnSubmissionPackage();

    console.log("✅ [Test] Navigation works correctly!");
  });
});
