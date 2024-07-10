import { useState } from "react";
import {
  Toolbar,
  Typography,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  TextField,
  ListItemButton,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";

const drawerWidth = 240;

interface Props {
  setSelectedHost: (name: string) => void;
}

function SideBar({ setSelectedHost }: Props) {
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
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: "auto", flex: 1, mx: "auto", my: "1rem" }}>
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
                <ListItemButton
                  key={text}
                  onClick={() => setSelectedHost(text)}
                >
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
      </Box>
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          // width: drawerWidth,
          padding: "16px",
        }}
      >
        <TextField
          size="small"
          fullWidth
          label="New machine"
          variant="outlined"
          value={newHostInput}
          onChange={(e) => setNewHostInput(e.target.value)}
          sx={{
            mb: "5px",
          }}
        />
        <Button variant="contained" onClick={handleNewMachine}>
          Add
        </Button>
      </Box>
    </Drawer>
  );
}

export default SideBar;
