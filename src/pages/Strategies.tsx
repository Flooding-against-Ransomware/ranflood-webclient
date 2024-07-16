import { Box, Typography, Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

function NotFound() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="70vh"
    >
      <Typography variant="h1" color="primary" gutterBottom>
        Planned action
      </Typography>
      <Typography variant="h4" gutterBottom>
        Work in progress
      </Typography>
      <Button variant="contained" color="primary" component={RouterLink} to="/">
        Go to Home
      </Button>
    </Box>
  );
}

export default NotFound;
