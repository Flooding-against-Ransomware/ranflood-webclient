import { useEffect, useState } from "react";
import {
  Toolbar,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import StopIcon from "@mui/icons-material/Stop";
import RefreshIcon from "@mui/icons-material/Refresh";

import { SnapshotObject, FloodObject } from "./models/Models";
import SideBar from "./components/SideBar";
import {
  refreshHostState,
  takeSnapshot,
  removeSnapshot,
  startFlooding,
  stopFlooding,
} from "./services/api";

import MenuIcon from "@mui/icons-material/Menu";
import { styled } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";

const drawerWidth = 300;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));
const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, open }) => ({
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

function App() {
  const [snapshotInput, setSnapshotInput] = useState<string>("");
  const [snapMethod, setSnapMethod] = useState<string>("ON_THE_FLY");
  const [floodInput, setFloodInput] = useState<string>("");
  const [floodMethod, setFloodMethod] = useState<string>("RANDOM");

  const [selectedHost, setSelectedHost] = useState<string>("");
  const [snapshotList, setSnapshotList] = useState<SnapshotObject[]>([]);
  const [floodList, setFloodList] = useState<FloodObject[]>([]);

  const [isPolling, setIsPolling] = useState<boolean>(true);

  const [open, setOpen] = useState(true);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  // gestisce quando refreshare snapshot e flooding
  useEffect(() => {
    if (isPolling) {
      refreshHostState(selectedHost, setSnapshotList, setFloodList);

      const interval = setInterval((): void => {
        refreshHostState(selectedHost, setSnapshotList, setFloodList);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [selectedHost, isPolling]);

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: "none" }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Ranflood-Webclient
          </Typography>
        </Toolbar>
      </AppBar>
      <SideBar
        open={open}
        handleDrawerClose={handleDrawerClose}
        setSelectedHost={setSelectedHost}
      ></SideBar>
      ;
      <Main open={open}>
        <DrawerHeader />
        <Box>
          {selectedHost ? (
            <Box
              component="main"
              sx={{
                bgcolor: "background.paper",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Typography variant="h4" gutterBottom>
                  {selectedHost}
                </Typography>
                <Box sx={{ mb: "0.5rem", ml: "0.5rem" }}>
                  <IconButton
                    aria-label="refresh"
                    onClick={() =>
                      refreshHostState(
                        selectedHost,
                        setSnapshotList,
                        setFloodList
                      )
                    }
                  >
                    <RefreshIcon
                      color="primary"
                      fontSize="large"
                      sx={{ cursor: "pointer" }}
                    />
                  </IconButton>
                </Box>
                <FormControlLabel
                  sx={{ mb: "0.5rem" }}
                  control={
                    <Switch
                      checked={isPolling}
                      onChange={() => setIsPolling(!isPolling)}
                    />
                  }
                  label={isPolling ? "Disattiva Polling" : "Attiva Polling"}
                />
              </Box>

              <Box sx={{ display: "flex", gap: 2 }}>
                <Box
                  sx={{
                    flex: 1,
                    bgcolor: "grey.300",
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Typography variant="h4">Snapshot</Typography>
                    {snapshotList.length ? (
                      <List>
                        {snapshotList.map((item) => (
                          <ListItem
                            key={item.path}
                            secondaryAction={
                              <IconButton
                                edge="end"
                                aria-label="delete"
                                onClick={() => {
                                  removeSnapshot(
                                    selectedHost,
                                    item.path,
                                    item.method
                                  );
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            }
                          >
                            <ListItemText
                              primary={item.path}
                              secondary={item.method}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="h6" sx={{ my: "1rem" }}>
                        No snapshot
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ minWidth: 120 }}>
                      <FormControl fullWidth>
                        <InputLabel id="select-snapshot-method-label">
                          Method
                        </InputLabel>
                        <Select
                          labelId="select-snapshot-method-label"
                          id="select-snapshot-method"
                          value={snapMethod}
                          label="Method"
                          onChange={(e) => setSnapMethod(e.target.value)}
                        >
                          <MenuItem value={"ON_THE_FLY"}>On the fly</MenuItem>
                          <MenuItem value={"SHADOW_COPY"}>Shadow copy</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <TextField
                      fullWidth
                      label="Snapshot Input"
                      variant="outlined"
                      value={snapshotInput}
                      onChange={(e) => setSnapshotInput(e.target.value)}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      disabled={!snapshotInput}
                      onClick={() => {
                        takeSnapshot(selectedHost, snapshotInput, snapMethod);
                        setSnapshotInput("");
                      }}
                    >
                      Take
                    </Button>
                  </Box>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    bgcolor: "grey.300",
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Typography variant="h4">Flood</Typography>
                    {floodList.length ? (
                      <List>
                        {floodList.map((item) => (
                          <ListItem
                            key={item.path}
                            secondaryAction={
                              <IconButton
                                edge="end"
                                aria-label="stop"
                                onClick={() =>
                                  stopFlooding(
                                    selectedHost,
                                    item.id,
                                    item.method
                                  )
                                }
                              >
                                <StopIcon />
                              </IconButton>
                            }
                          >
                            <ListItemText
                              primary={item.path}
                              secondary={item.method}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="h6" sx={{ my: "1rem" }}>
                        No flooding
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ minWidth: 120 }}>
                      <FormControl fullWidth>
                        <InputLabel id="select-flood-method-label">
                          Method
                        </InputLabel>
                        <Select
                          labelId="select-flood-method-label"
                          id="select-flood-method"
                          value={floodMethod}
                          label="Method"
                          onChange={(e) => setFloodMethod(e.target.value)}
                        >
                          <MenuItem value={"RANDOM"}>Random</MenuItem>
                          <MenuItem value={"ON_THE_FLY"}>On the fly</MenuItem>
                          <MenuItem value={"SHADOW_COPY"}>Shadow copy</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <TextField
                      fullWidth
                      label="Flood Input"
                      variant="outlined"
                      value={floodInput}
                      onChange={(e) => setFloodInput(e.target.value)}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      disabled={!floodInput}
                      onClick={() => {
                        startFlooding(selectedHost, floodInput, floodMethod);
                        setFloodInput("");
                      }}
                    >
                      Start
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box
              component="main"
              sx={{
                display: "flex",
                justifyContent: "center",
                bgcolor: "background.paper",
                alignItems: "center", // Aggiunto per centrare verticalmente
              }}
            >
              <Typography
                variant="h4"
                noWrap
                component="div"
                sx={{ mt: "5rem" }}
              >
                Choose a host
              </Typography>
            </Box>
          )}
        </Box>
      </Main>
    </Box>
  );

  // <AppBar
  //       position="fixed"
  //       sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
  //     >
  //       <Toolbar>
  //         <Typography variant="h6" noWrap component="div">
  //           Ranflood Client
  //         </Typography>
  //       </Toolbar>
  //     </AppBar>
  //     <SideBar setSelectedHost={setSelectedHost}></SideBar>
}

export default App;
