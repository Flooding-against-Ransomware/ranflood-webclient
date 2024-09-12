import { useEffect, useState, useContext } from "react";
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

import { useSelectedHostContext } from "../contexts/SelectedHostContext";
import { CommandBody } from "../models/CommandBody";
import { WebSocketContext } from "../contexts/WebSocketProvider";

const MAX_ERROR_BUFFER_LENGTH = 10;

function Manage() {
  const selectedHost = useSelectedHostContext();
  const webSocketContext = useContext(WebSocketContext);

  const [snapshotInput, setSnapshotInput] = useState<string>("");
  const [snapMethod, setSnapMethod] = useState<string>("ON_THE_FLY");
  const [floodInput, setFloodInput] = useState<string>("");
  const [floodMethod, setFloodMethod] = useState<string>("RANDOM");

  const [snapshotList, setSnapshotList] = useState<SnapshotObject[]>([]);
  const [floodList, setFloodList] = useState<FloodObject[]>([]);

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
    if (!webSocketContext) throw new Error("Need to connect to a host");

    try {
      const commandBody: CommandBody = {
        command: "snapshot",
        subcommand: "add",
        parameters: {
          method: snapMethod,
          path: snapshotInput,
        },
      };

      webSocketContext.sendMessage(JSON.stringify(commandBody));

      setSnapshotInput("");
    } catch (error) {
      console.error("Error taking snapshot:", error);
      handleNewError("Error taking snapshot: " + snapshotInput);
    }
  };

  const handleRemoveSnap = async (item: SnapshotObject) => {
    if (!webSocketContext) throw new Error("Need to connect to a host");

    try {
      const commandBody: CommandBody = {
        command: "snapshot",
        subcommand: "remove",
        parameters: {
          method: item.method,
          path: item.path,
        },
      };

      webSocketContext.sendMessage(JSON.stringify(commandBody));
    } catch (error) {
      console.error("Error:", error);
      handleNewError("Failed to remove snapshot for " + item.path);
    }
  };

  const handleStartFlood = async () => {
    if (!webSocketContext) throw new Error("Need to connect to a host");

    try {
      const commandBody: CommandBody = {
        command: "flood",
        subcommand: "start",
        parameters: {
          method: floodMethod,
          path: floodInput,
        },
      };

      webSocketContext.sendMessage(JSON.stringify(commandBody));

      setFloodInput("");
    } catch (error) {
      console.error("Error:", error);
      handleNewError("Failed to start flooding for " + floodInput);
    }
  };

  const handleStopFlood = async (item: FloodObject) => {
    if (!webSocketContext) throw new Error("Need to connect to a host");

    try {
      const commandBody: CommandBody = {
        command: "flood",
        subcommand: "stop",
        parameters: {
          method: item.method,
          id: item.id,
        },
      };

      webSocketContext.sendMessage(JSON.stringify(commandBody));
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

  const handleRefreshList = () => {
    if (!webSocketContext) throw new Error("Need to connect to a host");

    const commandBody = {
      command: "snapshot",
      subcommand: "list",
    };
    webSocketContext.sendMessage(JSON.stringify(commandBody));
    commandBody.command = "flood";
    webSocketContext.sendMessage(JSON.stringify(commandBody));
  };

  useEffect(() => {
    const onOpenHandler = async () => {
      try {
        handleRefreshList();
        const commandBody = {
          command: "version",
          subcommand: "get",
        };
        webSocketContext!.sendMessage(JSON.stringify(commandBody));
      } catch (error) {
        console.error(error);
      }
    };

    if (webSocketContext && selectedHost) {
      webSocketContext.registerMessageHandler((message) => {
        console.log("Manage page received:", message);

        let msg: CommandStatus;
        try {
          msg = JSON.parse(message);

          switch (msg.command) {
            case "snapshot":
              if (msg.subcommand === "list") {
                const data = JSON.parse(msg.data || "[]");
                setSnapshotList(data.list);
              } else if (
                msg.subcommand === "add" ||
                msg.subcommand === "remove"
              ) {
                setSnapshotHistory((prev) => {
                  const messageIndex = prev.findIndex(
                    (item) => item.id === msg.id
                  );

                  if (messageIndex !== -1) {
                    const updatedMessages = [...prev];
                    updatedMessages[messageIndex] = msg;
                    return updatedMessages;
                  }

                  return [msg, ...prev]; // aggiungi in cima se non esiste già
                });
              }
              break;

            case "flood":
              if (msg.subcommand === "list") {
                const data = JSON.parse(msg.data || '{"list":[]}');
                setFloodList(data.list);
              } else if (
                msg.subcommand === "start" ||
                msg.subcommand === "stop"
              ) {
                setFloodingHistory((prev) => {
                  const messageIndex = prev.findIndex(
                    (item) => item.id === msg.id
                  );

                  if (messageIndex !== -1) {
                    const updatedMessages = [...prev];
                    updatedMessages[messageIndex] = msg;
                    return updatedMessages;
                  }

                  return [msg, ...prev]; // aggiungi in cima se non esiste già
                });
              }
              break;

            case "version":
              if (msg.subcommand === "get") {
                setDeamonVersion(msg.data || "");
              }
              break;
            default:
              break;
          }
        } catch (error) {
          console.error(error);
        }
      });
      webSocketContext.registerErrorHandler(handleNewError);

      // evita che vengano inviati messaggi quando il socket si sta connettendo
      webSocketContext.socket?.addEventListener("open", onOpenHandler);
      if (webSocketContext.socket?.readyState === WebSocket.OPEN) {
        onOpenHandler();
      }
    }

    return () => {
      if (webSocketContext) {
        webSocketContext.unregisterMessageHandler();
        webSocketContext.unregisterErrorHandler();
        webSocketContext.socket?.removeEventListener("open", onOpenHandler);
      }
    };
  }, [webSocketContext]);

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
              <IconButton aria-label="refresh" onClick={handleRefreshList}>
                <RefreshIcon
                  color="primary"
                  fontSize="large"
                  sx={{ cursor: "pointer" }}
                />
              </IconButton>
            </Box>
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
                              {item.data && (
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
                          {openItemsSnap[index] && item.data && (
                            <Typography
                              variant="body2"
                              color="red"
                              sx={{ marginTop: 1 }}
                            >
                              {item.data}
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
                              {item.data && (
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
                          {openItemsFlood[index] && item.data && (
                            <Typography
                              variant="body2"
                              color="red"
                              sx={{ marginTop: 1 }}
                            >
                              {item.data}
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
