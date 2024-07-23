import { useEffect, useState } from "react";
import {
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

import { SnapshotObject, FloodObject } from "../models/Models";
import {
  refreshHostState,
  takeSnapshot,
  removeSnapshot,
  startFlooding,
  stopFlooding,
  getDeamonVersion,
} from "../services/api";
import { useSelectedHostContext } from "../contexts/SelectedHostContext";

function Manage() {
  const selectedHost = useSelectedHostContext();

  const [snapshotInput, setSnapshotInput] = useState<string>("");
  const [snapMethod, setSnapMethod] = useState<string>("ON_THE_FLY");
  const [floodInput, setFloodInput] = useState<string>("");
  const [floodMethod, setFloodMethod] = useState<string>("RANDOM");

  const [snapshotList, setSnapshotList] = useState<SnapshotObject[]>([]);
  const [floodList, setFloodList] = useState<FloodObject[]>([]);

  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [timeout, setTimeout] = useState<number>(10);
  const [deamonVersion, setDeamonVersion] = useState<string>("");

  const handleSetTimeout = (newTimeout: string) => {
    const t = parseInt(newTimeout);
    setTimeout(t);
  };

  // gestisce quando refreshare snapshot e flooding
  useEffect(() => {
    if (isPolling) {
      if (selectedHost) {
        refreshHostState(
          selectedHost,
          setSnapshotList,
          setFloodList,
          timeout * 1000
        );
        getDeamonVersion(selectedHost, setDeamonVersion);
      }

      const interval = setInterval((): void => {
        refreshHostState(
          selectedHost,
          setSnapshotList,
          setFloodList,
          timeout * 1000
        );
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [selectedHost, isPolling]);

  return (
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
                    setFloodList,
                    timeout * 1000
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

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "10rem",
            }}
          >
            <Typography
              variant="subtitle1"
              noWrap
              component="div"
              // sx={{ fontSize: "1rem" }}
            >
              Deamon Version: {deamonVersion}
            </Typography>
            <TextField
              size="small"
              label="Requests Timeout (seconds)"
              variant="outlined"
              value={timeout}
              onChange={(e) => handleSetTimeout(e.target.value)}
              inputProps={{ min: 1 }}
              type="number"
              sx={{
                m: "10px",
                width: "12rem",
              }}
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
                        key={item.path + item.method}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => {
                              removeSnapshot(
                                selectedHost,
                                item.path,
                                item.method,
                                timeout * 1000
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
                    takeSnapshot(
                      selectedHost,
                      snapshotInput,
                      snapMethod,
                      timeout * 1000
                    );
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
                        key={item.id}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            aria-label="stop"
                            onClick={() =>
                              stopFlooding(
                                selectedHost,
                                item.id,
                                item.method,
                                timeout * 1000
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
                    startFlooding(
                      selectedHost,
                      floodInput,
                      floodMethod,
                      timeout * 1000
                    );
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
            alignItems: "center",
          }}
        >
          <Typography variant="h4" noWrap component="div" sx={{ mt: "5rem" }}>
            Choose a host
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default Manage;
