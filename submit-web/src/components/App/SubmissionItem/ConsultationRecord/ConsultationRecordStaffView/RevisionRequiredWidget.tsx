import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { BCDesignTokens } from "epic.theme";
import { useFormContext, Controller } from "react-hook-form";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { getStaffSubmissionPackageQueryOptions } from "@/hooks/api/usePackages";
import { SubmissionPackage } from "@/models/Package";
import { SUBMISSION_ITEM_TYPE } from "@/models/SubmissionItem";

type RevisionRequiredWidgetProps = {
  readonly disabled?: boolean;
};

/** Section definition for the CC review revision widget. */
interface SectionDef {
  typeId: number;
  name: string;
}

export default function RevisionRequiredWidget({
  disabled = false,
}: RevisionRequiredWidgetProps) {
  const { submissionPackageId } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const queryClient = useQueryClient();
  const submissionPackage = queryClient.getQueryData<SubmissionPackage>(
    getStaffSubmissionPackageQueryOptions({
      packageId: Number(submissionPackageId),
    }).queryKey,
  );

  const { control, setValue, getValues, formState: { errors } } = useFormContext();

  // Determine the Consultation Record item type_id from the package items
  const consultationRecordTypeId = useMemo(() => {
    const ccItem = submissionPackage?.items.find(
      (item) => item.type.name === SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD,
    );
    return ccItem?.type_id ?? 2;
  }, [submissionPackage]);

  // Determine the Management Plan item type_id from the package items
  const managementPlanTypeId = useMemo(() => {
    const mpItem = submissionPackage?.items.find(
      (item) => item.type.name === SUBMISSION_ITEM_TYPE.MANAGEMENT_PLAN,
    );
    return mpItem?.type_id ?? 3;
  }, [submissionPackage]);

  // Track whether the MP section has been added
  const [mpSectionAdded, setMpSectionAdded] = useState<boolean>(() => {
    // Initialize from form state if already present
    const sectionNotes = getValues("update_request.section_notes") || {};
    return String(managementPlanTypeId) in sectionNotes;
  });

  // Expanded state for accordions
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    () => {
      const initial = new Set<number>([consultationRecordTypeId]);
      const sectionNotes = getValues("update_request.section_notes") || {};
      if (String(managementPlanTypeId) in sectionNotes) {
        initial.add(managementPlanTypeId);
      }
      return initial;
    },
  );

  const sections: SectionDef[] = useMemo(() => {
    const result: SectionDef[] = [
      { typeId: consultationRecordTypeId, name: "Consultation Check" },
    ];
    if (mpSectionAdded) {
      result.push({ typeId: managementPlanTypeId, name: "Management Plan" });
    }
    return result;
  }, [consultationRecordTypeId, managementPlanTypeId, mpSectionAdded]);

  const handleToggle = (typeId: number) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(typeId)) {
        newSet.delete(typeId);
      } else {
        newSet.add(typeId);
      }
      return newSet;
    });
  };

  const handleAddMPSection = () => {
    setMpSectionAdded(true);
    setExpandedSections((prev) => new Set(prev).add(managementPlanTypeId));
    // Initialize the note field for MP section
    const currentNotes = getValues("update_request.section_notes") || {};
    setValue("update_request.section_notes", {
      ...currentNotes,
      [String(managementPlanTypeId)]: "",
    });
    // Add to submission_item_types
    const currentTypes =
      getValues("update_request.submission_item_types") || [];
    if (!currentTypes.includes(managementPlanTypeId)) {
      setValue("update_request.submission_item_types", [
        ...currentTypes,
        managementPlanTypeId,
      ]);
    }
  };

  const handleRemoveMPSection = () => {
    setMpSectionAdded(false);
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      newSet.delete(managementPlanTypeId);
      return newSet;
    });
    // Remove MP note from form
    const currentNotes = getValues("update_request.section_notes") || {};
    const { [String(managementPlanTypeId)]: _, ...rest } = currentNotes;
    setValue("update_request.section_notes", rest);
    // Remove from submission_item_types
    const currentTypes =
      getValues("update_request.submission_item_types") || [];
    setValue(
      "update_request.submission_item_types",
      currentTypes.filter((t: number) => t !== managementPlanTypeId),
    );
  };

  // Get nested error for a given section note
  const getSectionNoteError = (typeId: number): string | undefined => {
    const sectionNotesErrors = (errors as any)?.update_request?.section_notes;
    if (sectionNotesErrors && sectionNotesErrors[String(typeId)]) {
      return sectionNotesErrors[String(typeId)]?.message;
    }
    return undefined;
  };

  return (
    <Box
      sx={{
        border: `1px solid ${BCDesignTokens.supportBorderColorWarning}`,
        borderRadius: "4px",
        mt: 2,
        mb: 2,
        overflow: "hidden",
      }}
      data-testid="revision-required-widget"
    >
      {/* Header bar - matches SectionUpdateRequestPanel style */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          backgroundColor: "#fcf8e3",
          px: "20px",
          py: 1,
          borderBottom: `1px solid #f5a623`,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: "#2d2d2d",
            fontWeight: 700,
            fontSize: "18px",
            lineHeight: "30.6px",
          }}
        >
          Revision Required for
        </Typography>
      </Box>

      {/* Content area */}
      <Box sx={{ p: 2, backgroundColor: "white" }}>
        {sections.map((section) => {
          const error = getSectionNoteError(section.typeId);
          return (
            <Accordion
              key={section.typeId}
              expanded={expandedSections.has(section.typeId)}
              onChange={() => handleToggle(section.typeId)}
              sx={{
                border: "1px solid #f5a623",
                background: "#fffdf5",
                borderRadius: "4px",
                mb: 2,
                "&:before": { display: "none" },
                boxShadow: "none",
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  flexDirection: "row-reverse",
                  "& .MuiAccordionSummary-expandIconWrapper": {
                    marginRight: 1,
                  },
                  "& .MuiAccordionSummary-content": {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  },
                }}
              >
                <Typography
                  sx={{
                    color: "#2D2D2D",
                    fontSize: "14px",
                    fontWeight: 700,
                    lineHeight: "21px",
                  }}
                >
                  {section.name}
                </Typography>
                {section.typeId === managementPlanTypeId && (
                  <Link
                    component="button"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleRemoveMPSection();
                    }}
                    sx={{
                      color: BCDesignTokens.themeBlue90,
                      cursor: "pointer",
                      fontSize: "14px",
                      textDecoration: "none",
                    }}
                  >
                    Remove
                  </Link>
                )}
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Typography
                  sx={{
                    color: "#2D2D2D",
                    fontSize: "13px",
                    fontWeight: 700,
                    lineHeight: "19.5px",
                    mb: 0.5,
                  }}
                >
                  Request Note
                </Typography>
                  <Typography
                  sx={{
                    color: "#909090",
                    fontSize: "12px",
                    fontWeight: 400,
                    lineHeight: "18px",
                    mb: 1,
                  }}
                >
                  This note will be shared with the proponent.
                </Typography>
                  <Controller
                    name={`update_request.section_notes.${section.typeId}`}
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <TextField
                        {...field}
                        multiline
                        rows={4}
                        fullWidth
                        placeholder={`Describe what needs to be updated or added for ${section.name}...`}
                        variant="outlined"
                        disabled={disabled}
                        error={!!error}
                        helperText={error || ""}
                        sx={{
                          "& .MuiInputBase-input::placeholder": {
                            color: "#9CA3AF",
                            fontSize: "14px",
                            fontWeight: 400,
                            lineHeight: "21px",
                            opacity: 1,
                          },
                        }}
                      />
                    )}
                  />
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}

        {!mpSectionAdded && (
          <Link
            component="button"
            onClick={handleAddMPSection}
            disabled={disabled}
            sx={{
              color: "#255A90",
              cursor: disabled ? "not-allowed" : "pointer",
              fontSize: "12px",
              fontWeight: 400,
              lineHeight: "18px",
              textDecoration: "none",
              display: "block",
              mb: 2,
            }}
            data-testid="add-mp-section-link"
          >
            + Add Management Plan section
          </Link>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            padding: "8px",
            gap: "10px",
            borderRadius: "4px",
            border: "1px solid #F8BB47",
            background: "#FEF1D8",
          }}
        >
          <Typography
            sx={{
              color: "#2D2D2D",
              fontSize: "14px",
              fontWeight: 400,
              lineHeight: "21px",
            }}
          >
            This request, including the EAO Comment, will be sent to the
            holder after a Manager confirms the decision.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
