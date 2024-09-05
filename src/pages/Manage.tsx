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
  Collapse,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import StopIcon from "@mui/icons-material/Stop";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";
import { ExpandMore, ExpandLess } from "@mui/icons-material";

import { CommandStatus } from "../models/CommandStatus";
import { SnapshotObject, FloodObject } from "../models/Models";
import {
  refreshHostState,
  commandRequest,
  getDeamonVersion,
  getCommandStatus,
} from "../services/api";
import { useSelectedHostContext } from "../contexts/SelectedHostContext";
import { CommandBody } from "../models/CommandBody";

const MAX_ERROR_BUFFER_LENGTH = 10;
const MAX_NUM_BUFFER_REQUEST = 60;

function Manage() {
  const selectedHost = useSelectedHostContext();

  const [snapshotInput, setSnapshotInput] = useState<string>("");
  const [snapMethod, setSnapMethod] = useState<string>("ON_THE_FLY");
  const [floodInput, setFloodInput] = useState<string>("");
  const [floodMethod, setFloodMethod] = useState<string>("RANDOM");

  const [snapshotList, setSnapshotList] = useState<SnapshotObject[]>([]);
  const [floodList, setFloodList] = useState<FloodObject[]>([]);

  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [reqTimeout, setReqTimeout] = useState<number>(10);
  const [deamonVersion, setDeamonVersion] = useState<string>("");

  const [errors, setErrors] = useState<string[]>([]);
  const [snapshotHistory, setSnapshotHistory] = useState<CommandStatus[]>([]);
  const [floodingHistory, setFloodingHistory] = useState<CommandStatus[]>([]);

  const [openItemsSnap, setOpenItemsSnap] = useState<boolean[]>([]);
  const [openItemsFlood, setOpenItemsFlood] = useState<boolean[]>([]);

  const handleToggle = (
    index: number,
    setOpenItems: (value: React.SetStateAction<boolean[]>) => void
  ) => {
    setOpenItems((prevOpenItems) => {
      const newOpenItems = [...prevOpenItems];
      newOpenItems[index] = !newOpenItems[index];
      return newOpenItems;
    });
  };

  const handleSetTimeout = (newTimeout: string) => {
    const t = parseInt(newTimeout);
    setReqTimeout(t);
  };

  const pollCommandStatus = async (
    item: CommandStatus,
    setHistory: React.Dispatch<React.SetStateAction<CommandStatus[]>>
  ) => {
    let requestCount = 0;

    const updateStatus = async () => {
      if (!selectedHost) throw new Error("Need to select a host");

      requestCount++;

      const updatedItem = await getCommandStatus(
        selectedHost.url,
        item.id,
        reqTimeout * 1000,
        handleNewError
      );
      if (updatedItem === undefined) {
        handleNewError(
          "Error getting command status for command id: " + item.id
        );
        return;
      }

      if (updatedItem.status === "in progress" && requestCount < 20) {
        setTimeout(updateStatus, 1000);
      } else if (requestCount >= MAX_NUM_BUFFER_REQUEST) {
        updatedItem.errorMsg = "Timeout";
        updatedItem.status = "error";
        //aggiorno l'oggetto
        setHistory((prev) => {
          return prev.map((h) => (h.id === updatedItem.id ? updatedItem : h));
        });
        handleNewError(
          `Polling stopped after ${MAX_NUM_BUFFER_REQUEST} requests for command: ${item.command} ${item.subcommand} with id: ${item.id}`
        );
      } else {
        //aggiorno l'oggetto
        setHistory((prev) => {
          return prev.map((h) => (h.id === updatedItem.id ? updatedItem : h));
        });
      }
    };

    updateStatus();
  };

  const addCommandToSnapshotHistory = (command: CommandStatus) => {
    setSnapshotHistory((prev) => [command, ...prev]);
    if (command.status === "in progress") {
      pollCommandStatus(command, setSnapshotHistory);
    }
  };

  const addCommandToFloodingHistory = (command: CommandStatus) => {
    setFloodingHistory((prev) => [command, ...prev]);
    if (command.status === "in progress") {
      pollCommandStatus(command, setFloodingHistory);
    }
  };

  const handleNewError = (error: string) => {
    if (errors.length >= MAX_ERROR_BUFFER_LENGTH) {
      setErrors((prevErrors) => [
        error,
        ...prevErrors.slice(0, MAX_ERROR_BUFFER_LENGTH - 1),
      ]);
    } else {
      setErrors((prev) => [error, ...prev]);
    }
  };

  const handleTakeSnap = async () => {
    if (!selectedHost) throw new Error("Need to select a host");

    try {
      const commandBody: CommandBody = {
        command: "snapshot",
        subcommand: "add",
        parameters: {
          method: snapMethod,
          path: snapshotInput,
        },
      };
      const id = await commandRequest(
        selectedHost.url,
        commandBody,
        reqTimeout * 1000
      );
      if (id)
        addCommandToSnapshotHistory({
          command: "snapshot",
          subcommand: "add",
          status: "in progress",
          id,
          parameters: {
            method: snapMethod,
            path: snapshotInput,
          },
        });
      setSnapshotInput("");
    } catch (error) {
      console.error("Error:", error);
      handleNewError("Failed to take snapshot for " + snapshotInput);
    }
  };

  const handleRemoveSnap = async (item: SnapshotObject) => {
    if (!selectedHost) throw new Error("Need to select a host");

    try {
      const commandBody: CommandBody = {
        command: "snapshot",
        subcommand: "remove",
        parameters: {
          method: item.method,
          path: item.path,
        },
      };

      const id = await commandRequest(
        selectedHost.url,
        commandBody,
        reqTimeout * 1000
      );
      if (id) {
        addCommandToSnapshotHistory({
          command: "snapshot",
          subcommand: "remove",
          status: "in progress",
          id,
          parameters: {
            method: item.method,
            path: item.path,
          },
        });
      }
    } catch (error) {
      console.error("Error:", error);
      handleNewError("Failed to remove snapshot for " + item.path);
    }
  };

  const handleStartFlood = async () => {
    if (!selectedHost) throw new Error("Need to select a host");

    try {
      const commandBody: CommandBody = {
        command: "flood",
        subcommand: "start",
        parameters: {
          method: floodMethod,
          path: floodInput,
        },
      };

      const id = await commandRequest(
        selectedHost.url,
        commandBody,
        reqTimeout * 1000
      );
      if (id)
        addCommandToFloodingHistory({
          command: "flood",
          subcommand: "start",
          status: "in progress",
          id,
          parameters: {
            method: floodMethod,
            path: floodInput,
          },
        });

      setFloodInput("");
    } catch (error) {
      console.error("Error:", error);
      handleNewError("Failed to start flooding for " + floodInput);
    }
  };

  const handleStopFlood = async (item: FloodObject) => {
    if (!selectedHost) throw new Error("Need to select a host");

    try {
      const commandBody: CommandBody = {
        command: "flood",
        subcommand: "stop",
        parameters: {
          method: item.method,
          id: item.id,
        },
      };

      const id = await commandRequest(
        selectedHost.url,
        commandBody,
        reqTimeout * 1000
      );
      if (id)
        addCommandToFloodingHistory({
          command: "flood",
          subcommand: "stop",
          status: "in progress",
          id,
          parameters: {
            method: item.method,
            id: item.id,
          },
        });
    } catch (error) {
      console.error("Error:", error);
      handleNewError("Failed to stop flooding " + item.id);
    }
  };

  const removeError = (index: number) => {
    setErrors((prevErrors) => {
      if (index < 0 || index >= prevErrors.length) {
        return prevErrors;
      }
      return [...prevErrors.slice(0, index), ...prevErrors.slice(index + 1)];
    });
  };

  const fetchData = async () => {
    await refreshHostState(
      selectedHost!.url,
      setSnapshotList,
      setFloodList,
      reqTimeout * 1000,
      handleNewError
    );
  };

  // gestisce quando refreshare snapshot e flooding
  useEffect(() => {
    if (isPolling && selectedHost) {
      getDeamonVersion(selectedHost.url, setDeamonVersion);
      fetchData();

      const interval = setInterval(() => {
        fetchData();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [selectedHost, isPolling]);

  return (
    <Box>
      {errors?.length ? (
        <Box sx={{ width: "100%" }}>
          {errors.map((error, index) => (
            <Collapse key={index} in={errors[index] !== null}>
              <Alert
                action={
                  <IconButton
                    aria-label="close"
                    color="inherit"
                    size="small"
                    onClick={() => {
                      removeError(index);
                    }}
                  >
                    <CloseIcon fontSize="inherit" />
                  </IconButton>
                }
                sx={{ mb: 2 }}
                severity="error"
              >
                {error}
              </Alert>
            </Collapse>
          ))}
        </Box>
      ) : null}
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
              {selectedHost.label}
            </Typography>
            <Box sx={{ mb: "0.5rem", ml: "0.5rem" }}>
              <IconButton aria-label="refresh" onClick={fetchData}>
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
            <Typography variant="subtitle1" noWrap component="div">
              URL: {selectedHost.url}
            </Typography>
            <Typography variant="subtitle1" noWrap component="div">
              Deamon Version: {deamonVersion}
            </Typography>
            <TextField
              size="small"
              label="Requests Timeout (seconds)"
              variant="outlined"
              value={reqTimeout}
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
                            onClick={() => handleRemoveSnap(item)}
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
                  onClick={handleTakeSnap}
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
                            onClick={() => handleStopFlood(item)}
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
                  onClick={handleStartFlood}
                >
                  Start
                </Button>
              </Box>
            </Box>
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
              {snapshotHistory?.length ? (
                <Box sx={{ display: "flex", gap: 2 }}>
                  <List sx={{ width: "100%" }}>
                    {snapshotHistory.map((item, index) => (
                      <ListItem key={index}>
                        <Box display="flex" flexDirection="column" width="100%">
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <ListItemText
                              primary={`${item.command} ${item.subcommand} ${item.parameters.method} ${item.parameters.path}`}
                            />
                            <Box display="flex" alignItems="center">
                              <Typography
                                variant="body2"
                                color={
                                  item.status === "success"
                                    ? "green"
                                    : item.status === "error"
                                    ? "red"
                                    : "orange"
                                }
                              >
                                {item.status}
                              </Typography>
                              {item.errorMsg && (
                                <IconButton
                                  onClick={() =>
                                    handleToggle(index, setOpenItemsSnap)
                                  }
                                  size="small"
                                >
                                  {openItemsSnap[index] ? (
                                    <ExpandLess />
                                  ) : (
                                    <ExpandMore />
                                  )}
                                </IconButton>
                              )}
                            </Box>
                          </Box>
                          {openItemsSnap[index] && item.errorMsg && (
                            <Typography
                              variant="body2"
                              color="red"
                              sx={{ marginTop: 1 }}
                            >
                              {item.errorMsg}
                            </Typography>
                          )}
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ) : null}
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
              {floodingHistory?.length ? (
                <Box sx={{ display: "flex", gap: 2 }}>
                  <List sx={{ width: "100%" }}>
                    {floodingHistory.map((item, index) => (
                      <ListItem key={index}>
                        <Box display="flex" flexDirection="column" width="100%">
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <ListItemText
                              primary={`${item.command} ${item.subcommand} ${
                                item.parameters.method
                              } ${
                                item.parameters.path
                                  ? item.parameters.path
                                  : item.parameters.id
                              }  `}
                            />
                            <Box display="flex" alignItems="center">
                              <Typography
                                variant="body2"
                                color={
                                  item.status === "success"
                                    ? "green"
                                    : item.status === "error"
                                    ? "red"
                                    : "orange"
                                }
                              >
                                {item.status}
                              </Typography>
                              {item.errorMsg && (
                                <IconButton
                                  onClick={() =>
                                    handleToggle(index, setOpenItemsFlood)
                                  }
                                  size="small"
                                >
                                  {openItemsFlood[index] ? (
                                    <ExpandLess />
                                  ) : (
                                    <ExpandMore />
                                  )}
                                </IconButton>
                              )}
                            </Box>
                          </Box>
                          {openItemsFlood[index] && item.errorMsg && (
                            <Typography
                              variant="body2"
                              color="red"
                              sx={{ marginTop: 1 }}
                            >
                              {item.errorMsg}
                            </Typography>
                          )}
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ) : null}
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
