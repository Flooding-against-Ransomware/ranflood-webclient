import React, { useContext, useEffect, useState } from "react";
import { styled, useTheme } from "@mui/material/styles";
import Drawer from "@mui/material/Drawer";

import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ListItemText from "@mui/material/ListItemText";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";

import { WebSocketContext } from "../contexts/WebSocketProvider";

import { Group, Host } from "../models/GroupHost";
import { CommandStatus } from "../models/CommandStatus";
import { getMachinesFromLocalStorage } from "../services/localStorageService";

const drawerWidth = 300;

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

interface Props {
  open: boolean;
  handleDrawerClose: () => void;
  setSelectedHost: (host: Host) => void;
}

export default function SideBar({
  open,
  handleDrawerClose,
  setSelectedHost,
}: Props) {
  const theme = useTheme();

  const webSocketContext = useContext(WebSocketContext);

  const [newGroupName, setNewGroupName] = useState<string>("");
  const [newHostLabel, setNewHostLabel] = useState<string>("");
  const [newHostInput, setNewHostInput] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [hostList, setHostList] = useState<Group[]>(() => {
    const DEFAULTHOST = [
      {
        groupName: "Group1",
        hosts: [{ label: "localhost", url: "ws://localhost:8080/websocket" }],
      },
    ];
    // Recupera la lista dal local storage al caricamento iniziale dell'app
    const savedHostList = localStorage.getItem("hostList");
    return savedHostList ? JSON.parse(savedHostList) : DEFAULTHOST;
  });

  const handleNewGroup = () => {
    if (
      newGroupName.trim() &&
      !hostList.some((group) => group.groupName === newGroupName)
    ) {
      setHostList([...hostList, { groupName: newGroupName, hosts: [] }]);
      setNewGroupName("");
    }
  };

  const handleNewMachine = async () => {
    const status = await checkHostConnection({
      label: newHostLabel,
      url: newHostInput,
    });
    const updatedHostList = hostList.map((group) => {
      if (group.groupName === selectedGroup) {
        return {
          ...group,
          hosts: [
            ...group.hosts,
            { label: newHostLabel, url: newHostInput, status },
          ],
        };
      }
      return group;
    });

    setHostList(updatedHostList);
    setSelectedGroup("");
    setNewHostLabel("");
    setNewHostInput("");
  };

  const removeHost = (groupName: string, hostToRemove: Host) => {
    const updatedHostList = hostList.map((group) => {
      if (group.groupName === groupName) {
        return {
          ...group,
          hosts: group.hosts.filter((host) => host !== hostToRemove),
        };
      }
      return group;
    });

    setHostList(updatedHostList);
  };

  const removeGroup = (groupName: string) => {
    const updatedHostList = hostList.filter(
      (group) => group.groupName !== groupName
    );
    setHostList(updatedHostList);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "online":
        return "green";
      case "offline":
        return "red";
      case "working":
        return "orange";
      default:
        return "gray";
    }
  };

  const checkHostConnection = async (
    host: Host
  ): Promise<"online" | "offline" | "working"> => {
    return new Promise((resolve) => {
      const ws = new WebSocket(host.url);

      // nel caso l'url inserito non è valido la connessione rimarrebbe pending per un lungo periodo di tempo
      // e così facendo gli status non verrebbe settati correttamente
      const timeout = setTimeout(() => {
        ws.close();
        resolve("offline");
      }, 5000);

      ws.onopen = () => {
        const commandBody = {
          command: "flood",
          subcommand: "list",
        };
        ws.send(JSON.stringify(commandBody));
      };

      ws.onmessage = (event) => {
        clearTimeout(timeout);
        ws.close();
        const msg: CommandStatus = JSON.parse(event.data);

        if (msg.subcommand === "list" && msg.command === "flood") {
          const data = JSON.parse(msg.data || '{"list":[]}');

          data.list.length === 0 ? resolve("online") : resolve("working");
        } else {
          resolve("online");
        }
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        resolve("offline");
      };
    });
  };

  // Try to connect to every host
  const checkAllHosts = async () => {
    const updatedHostList = await Promise.all(
      hostList.map(async (group) => ({
        ...group,
        hosts: await Promise.all(
          group.hosts.map(async (host) => {
            const status = await checkHostConnection(host);
            return { ...host, status }; // Aggiorna lo stato del host
          })
        ),
      }))
    );

    setHostList(updatedHostList);
  };

  const handleDownload = () => {
    const machinesList = getMachinesFromLocalStorage();
    const blob = new Blob([JSON.stringify(machinesList, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "machinesList.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadHostList = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const newHostList = JSON.parse(e.target.result as string);
          setHostList(newHostList);
        }
      };
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    checkAllHosts();
  }, []);

  useEffect(() => {
    // Serve per non salvare lo status nello storage, non avrebbe senso
    const hostListWithoutStatus = hostList.map((group) => ({
      ...group,
      hosts: group.hosts.map(
        ({ status, ...hostWithoutStatus }) => hostWithoutStatus
      ),
    }));

    localStorage.setItem("hostList", JSON.stringify(hostListWithoutStatus));
  }, [hostList]);

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
      variant="persistent"
      anchor="left"
      open={open}
    >
      <DrawerHeader>
        <IconButton onClick={handleDrawerClose}>
          {theme.direction === "ltr" ? (
            <ChevronLeftIcon />
          ) : (
            <ChevronRightIcon />
          )}
        </IconButton>
      </DrawerHeader>

      {hostList.length ? (
        <List>
          {hostList.map((group) => (
            <React.Fragment key={group.groupName}>
              <Divider />
              <ListItem>
                <IconButton
                  edge="start"
                  aria-label="delete"
                  onClick={() => removeGroup(group.groupName)}
                >
                  <DeleteIcon />
                </IconButton>
                <ListItemText
                  primary={group.groupName}
                  primaryTypographyProps={{
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                    color: "primary",
                  }}
                />
              </ListItem>
              <List>
                {group.hosts.map((host, index) => (
                  <ListItem key={index} sx={{ pl: 5 }}>
                    <IconButton
                      edge="start"
                      aria-label="delete"
                      onClick={() => removeHost(group.groupName, host)}
                    >
                      <DeleteIcon />
                    </IconButton>
                    <ListItemButton
                      onClick={() => {
                        setSelectedHost(host);
                        webSocketContext?.setWebSocketUrl(host.url);
                      }}
                    >
                      <ListItemText
                        primary={host.label}
                        primaryTypographyProps={{
                          color: "textSecondary", // Colore diverso per differenziarlo ulteriormente
                        }}
                      />
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: getStatusColor(host.status),
                          ml: 2,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography variant="h6" noWrap component="div">
          Add a new machine
        </Typography>
      )}
      <Box
        sx={{
          mb: "20px",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <TextField
          size="small"
          label="New Group"
          variant="outlined"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          sx={{
            ml: "10px",
          }}
        />
        <IconButton
          aria-label="add"
          onClick={handleNewGroup}
          disabled={!newGroupName.trim()}
        >
          <AddCircleIcon color="primary" />
        </IconButton>
      </Box>
      <Divider />
      <Box
        sx={{
          m: "10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">Add New Machine</Typography>
        <FormControl sx={{ mx: 1, minWidth: 250, mb: 0.5 }} size="small">
          <InputLabel>Group</InputLabel>
          <Select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value as string)}
            label="Group"
          >
            {hostList.map((group) => (
              <MenuItem key={group.groupName} value={group.groupName}>
                {group.groupName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="Label"
          variant="outlined"
          value={newHostLabel}
          onChange={(e) => setNewHostLabel(e.target.value)}
          sx={{ mx: 1, minWidth: 250, mb: 0.5 }}
        />
        <TextField
          size="small"
          label="New machine"
          variant="outlined"
          value={newHostInput}
          onChange={(e) => setNewHostInput(e.target.value)}
          sx={{ mx: 1, minWidth: 250, mb: 0.5 }}
        />
        <Button
          aria-label="add"
          onClick={handleNewMachine}
          disabled={
            !newHostLabel.trim() || !newHostInput.trim() || !selectedGroup
          }
          variant="contained"
        >
          Add
        </Button>
      </Box>
      <Box
        sx={{
          m: "10px",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={handleDownload}
          sx={{
            minWidth: "155px",
            height: "40px",
          }}
        >
          Download list
        </Button>
        <input
          accept=".json"
          style={{ display: "none" }}
          id="upload-json"
          type="file"
          onChange={handleUploadHostList}
        />
        <label htmlFor="upload-json">
          <Button
            variant="contained"
            color="primary"
            component="span"
            sx={{
              minWidth: "130px",
              height: "40px",
            }}
          >
            Upload list
          </Button>
        </label>
      </Box>
    </Drawer>
  );
}
