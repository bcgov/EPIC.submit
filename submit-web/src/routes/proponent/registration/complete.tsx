import { GridContainer } from "@/components/registration/GridContainer";
import {
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/proponent/registration/complete")({
  component: Complete,
});

function Complete() {
  const navigate = useNavigate();
  return (
    <GridContainer yellowBar>
      <Grid item xs={12}>
        <Typography variant="h4" fontWeight={600}>
          Your account is successfully set up.
        </Typography>
      </Grid>

      <Grid item xs={12} mt={"30px"}>
        <FormControl>
          <FormLabel sx={{ fontWeight: 700 }}>
            What would you like to do now?
          </FormLabel>
          <RadioGroup name="navChoice">
            <FormControlLabel
              value="home"
              control={<Radio />}
              label="Go to the home page"
            />
            <FormControlLabel
              value="userManagement"
              control={<Radio />}
              label="Go to the User Management page to add other users to the account"
            />
          </RadioGroup>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            navigate({ to: "/proponent/projects" });
          }}
        >
          Go
        </Button>
      </Grid>
    </GridContainer>
  );
}
