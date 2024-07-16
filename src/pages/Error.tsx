import { Box, Typography, Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

function NotFound() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
    >
      <Typography variant="h1" color="primary" gutterBottom>
        404
      </Typography>
      <Typography variant="h4" gutterBottom>
        Page Not Found
      </Typography>
      <Typography variant="body1" marginBottom={2}>
        The page you're looking for doesn't exist or has been moved.
      </Typography>
      <Button variant="contained" color="primary" component={RouterLink} to="/">
        Go to Home
      </Button>
    </Box>
  );
}

export default NotFound;
