import { TableBox } from "@/components/Shared/Layouts/TableBox";
import { Box, Container, Divider, Skeleton, Stack } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

export default function NewUserFormSkeleton() {
  return (
    <TableBox mainLabel={<Skeleton width={200} height={32} />}>
      <Box
        flexDirection={"column"}
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "flex-start",
        }}
      >
        <Container
          maxWidth="sm"
          sx={{
            pt: BCDesignTokens.layoutPaddingMedium,
            pb: BCDesignTokens.layoutPaddingSmall,
            alignSelf: "flex-start",
            m: 0,
          }}
        >
          <Skeleton variant="text" width={180} height={40} />
          <Divider
            sx={{
              backgroundColor: BCDesignTokens.themeGold100,
              height: 1,
              my: 1,
            }}
          />
          <Skeleton variant="text" width={250} height={28} />
          <Skeleton variant="text" width={320} height={20} sx={{ mb: 2 }} />
          <Skeleton
            variant="rectangular"
            width="100%"
            height={56}
            sx={{ mt: 2 }}
          />
        </Container>
        <Container
          maxWidth="sm"
          sx={{
            pb: BCDesignTokens.layoutPaddingSmall,
            alignSelf: "flex-start",
            m: 0,
          }}
        >
          <Skeleton variant="text" width={200} height={40} />
          <Divider
            sx={{
              backgroundColor: BCDesignTokens.themeGold100,
              height: 1,
              my: 1,
            }}
          />
          <Skeleton variant="text" width={250} height={28} />
          <Skeleton
            variant="rectangular"
            width="100%"
            height={80}
            sx={{ my: 2 }}
          />
          <Skeleton
            variant="rectangular"
            width="100%"
            height={56}
            sx={{ my: 2 }}
          />
          <Stack
            direction="row"
            spacing={2}
            sx={{ mt: BCDesignTokens.layoutMarginXlarge }}
          >
            <Skeleton variant="rectangular" width={120} height={40} />
            <Skeleton variant="rectangular" width={80} height={40} />
          </Stack>
        </Container>
      </Box>
    </TableBox>
  );
}
