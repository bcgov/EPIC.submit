import { PackageType } from "@/models/Package";
import { Box, Link, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { AppConfig } from "@/utils/config";
import { Fragment } from "react";

type SubmissionSuccessBoxProps = {
  submissionPackageType: PackageType;
  contactEmail?: string;
};

export const SubmissionSuccessBox = ({
  submissionPackageType,
  contactEmail,
}: SubmissionSuccessBoxProps) => {
  const email = contactEmail || AppConfig.supportMpEmail;
  const paragraphs = submissionPackageType.success_message
    ? submissionPackageType.success_message.split("\n")
    : [];

  const renderParagraph = (text: string, index: number) => {
    // Replace {{contact_email}} placeholder with a clickable link
    if (text.includes("{{contact_email}}")) {
      const parts = text.split("{{contact_email}}");
      return (
        <Typography
          key={index}
          variant="body1"
          color="black"
          mt={index > 0 ? "20px" : undefined}
        >
          {parts[0]}
          <Link href={`mailto:${email}`}>{email}</Link>
          {parts[1]}
        </Typography>
      );
    }

    return (
      <Typography
        key={index}
        variant="body1"
        color="black"
        mt={index > 0 ? "20px" : undefined}
      >
        {text}
      </Typography>
    );
  };

  return (
    <Box
      sx={{
        background: BCDesignTokens.supportSurfaceColorSuccess,
        border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
        borderRadius: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          padding: "8px",
        }}
      >
        {paragraphs.map((paragraph, index) => (
          <Fragment key={index}>
            {renderParagraph(paragraph, index)}
          </Fragment>
        ))}
      </Box>
    </Box>
  );
};
