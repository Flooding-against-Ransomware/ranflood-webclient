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
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";

import { WebSocketContext } from "../contexts/WebSocketProvider";

import { Group, Host } from "../models/GroupHost";

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

  const handleNewMachine = () => {
    const updatedHostList = hostList.map((group) => {
      if (group.groupName === selectedGroup) {
        return {
          ...group,
          hosts: [...group.hosts, { label: newHostLabel, url: newHostInput }],
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

  // Aggiorna il local storage ogni volta che hostList cambia
  useEffect(() => {
    localStorage.setItem("hostList", JSON.stringify(hostList));
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
      <Divider />
      {hostList.length ? (
        <List>
          {hostList.map((group) => (
            <React.Fragment key={group.groupName}>
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
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
              <Divider />
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
          bottom: 0,
          m: "5px",
        }}
      >
        <Typography variant="h6">Create New Group</Typography>
        <TextField
          size="small"
          label="Group Name"
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
          bottom: 0,
          m: "5px",
        }}
      >
        <Typography variant="h6">Add New Machine</Typography>
        <FormControl sx={{ mx: 1, minWidth: 250 }} size="small">
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
          sx={{ mx: 1, minWidth: 250 }}
        />
        <TextField
          size="small"
          label="New machine"
          variant="outlined"
          value={newHostInput}
          onChange={(e) => setNewHostInput(e.target.value)}
          sx={{ mx: 1, minWidth: 250 }}
        />
        <IconButton
          aria-label="add"
          onClick={handleNewMachine}
          disabled={!newHostLabel.trim() || !newHostInput.trim()}
        >
          <AddCircleIcon color="primary" />
        </IconButton>
      </Box>
    </Drawer>
  );
}
