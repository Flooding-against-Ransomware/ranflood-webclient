import { Box, Typography } from "@mui/material";

function Home() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="70vh"
    >
      <Typography variant="h1" color="primary" gutterBottom>
        Ranflood Webclient
      </Typography>
      <Typography variant="h4" gutterBottom>
        You can manually control a Ranflood deamon or start a planned action
      </Typography>
    </Box>
  );
}

export default Home;
