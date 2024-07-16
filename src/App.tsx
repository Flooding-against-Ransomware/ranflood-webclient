import { useState } from "react";
import { Toolbar, Typography, Box, IconButton, Button } from "@mui/material";

import SideBar from "./components/SideBar";

import MenuIcon from "@mui/icons-material/Menu";
import { styled } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import { Link, Outlet } from "react-router-dom";
import { SelectedHostContext } from "./contexts/SelectedHostContext";

const drawerWidth = 300;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const pages = ["Manage", "Strategies"];

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

const StyledLink = styled(Link)(({ theme }) => ({
  color: "white",
  textDecoration: "none",
  padding: theme.spacing(1, 2),
  borderRadius: theme.shape.borderRadius,
  transition: "background-color 0.3s",
  backgroundColor: true ? "rgba(255, 255, 255, 0.2)" : "transparent",
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
}));

function App() {
  const [open, setOpen] = useState(true);
  const [selectedHost, setSelectedHost] = useState("");

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <SelectedHostContext.Provider value={selectedHost}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar position="fixed" open={open}>
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
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
            </Box>
            <Box>
              {pages.map((page) => (
                <Button key={page}>
                  <StyledLink
                    to={`/${page.toLowerCase()}`}
                    // isActive={currentPage === page.toLowerCase()}
                  >
                    {page}
                  </StyledLink>
                </Button>
              ))}
            </Box>
          </Toolbar>
        </AppBar>
        <SideBar
          open={open}
          handleDrawerClose={handleDrawerClose}
          setSelectedHost={setSelectedHost}
        ></SideBar>
        <Main open={open}>
          <DrawerHeader />
          <>
            <Outlet />
          </>
        </Main>
      </Box>
    </SelectedHostContext.Provider>
  );
}

export default App;
