import { useState } from "react";
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
import { Box, TextField, Typography } from "@mui/material";

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
  setSelectedHost: (name: string) => void;
}

export default function SideBar({
  open,
  handleDrawerClose,
  setSelectedHost,
}: Props) {
  const theme = useTheme();

  const [newHostInput, setNewHostInput] = useState<string>("");
  const [hostList, setHostList] = useState<string[]>([
    "http://localhost:8080/command",
  ]);

  const handleNewMachine = () => {
    setHostList((list) => [...list, newHostInput]);
    setNewHostInput("");
  };

  const removeHost = async (name: string) => {
    const updatedHostList = hostList.filter((host) => host !== name);
    setHostList(updatedHostList);
  };
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
          {hostList.map((text) => (
            <ListItem key={text}>
              <IconButton
                edge="start"
                aria-label="delete"
                onClick={() => removeHost(text)}
              >
                <DeleteIcon />
              </IconButton>
              <ListItemButton key={text} onClick={() => setSelectedHost(text)}>
                <ListItemText primary={text} />
              </ListItemButton>
            </ListItem>
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
        <TextField
          size="small"
          label="New machine"
          variant="outlined"
          value={newHostInput}
          onChange={(e) => setNewHostInput(e.target.value)}
          sx={{
            ml: "10px",
          }}
        />
        <IconButton
          aria-label="add"
          onClick={handleNewMachine}
          disabled={!newHostInput.trim()}
        >
          <AddCircleIcon color="primary" />
        </IconButton>
      </Box>
    </Drawer>
  );
}
