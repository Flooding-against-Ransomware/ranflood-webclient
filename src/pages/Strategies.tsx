import React, { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Grid,
  Paper,
  Typography,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useSelectedHostContext } from "../contexts/SelectedHostContext";
import {
  setStrategiesToLocalStorage,
  getStrategiesFromLocalStorage,
  removeStrategyFromLocalStorage,
} from "../services/jsonService";
import { Strategy } from "../models/Strategy";

function Strategies() {
  let selectedHost = useSelectedHostContext();

  const [fileName, setFileName] = useState<string>("");
  const [strategies, setStrategies] = useState<Strategy[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const strategies = JSON.parse(e.target.result as string);
          setStrategiesToLocalStorage(strategies);
          setStrategies(getStrategiesFromLocalStorage());
          setFileName(file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRemoveStrategy = (strategyName: string) => {
    removeStrategyFromLocalStorage(strategyName);
    setStrategies(getStrategiesFromLocalStorage());
  };

  const handleRunStrategy = (strategyName: string) => {};

  const handleDownload = () => {
    const strategies = getStrategiesFromLocalStorage();
    const blob = new Blob([JSON.stringify(strategies, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "strategies.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const fetchedStrategies = getStrategiesFromLocalStorage();
    setStrategies(fetchedStrategies);
  }, []);

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
              {selectedHost.label}
            </Typography>
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
          </Box>
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <input
              accept=".json"
              style={{ display: "none" }}
              id="upload-json"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="upload-json">
              <Button variant="contained" component="span">
                Upload Strategies
              </Button>
            </label>
            <Button variant="contained" sx={{ ml: 2 }} onClick={handleDownload}>
              Download Strategies
            </Button>
            {fileName && (
              <Typography variant="body1" sx={{ mt: 2 }}>
                File Uploaded: {fileName}
              </Typography>
            )}
          </Box>
          <Box sx={{ mt: 4 }}>
            {strategies.map((strategy, index) => (
              <Accordion key={index}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`panel${index}-content`}
                  id={`panel${index}-header`}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <Typography variant="h5">{strategy.name}</Typography>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 1,
                        mr: 2,
                      }}
                    >
                      <Button
                        color="error"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveStrategy(strategy.name);
                        }}
                      >
                        <DeleteIcon />
                      </Button>
                      <Button
                        color="success"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRunStrategy(strategy.name);
                        }}
                      >
                        <PlayArrowIcon />
                      </Button>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {strategy.actions.map((action, actionIndex) => (
                    <Paper key={actionIndex} sx={{ mb: 2, p: 2 }}>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        <strong>Action {actionIndex + 1}</strong>
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={3}>
                          <Typography variant="body1">
                            <strong>Command:</strong> {action.command}
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="body1">
                            <strong>Subcommand:</strong> {action.subcommand}
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="body1">
                            <strong>Method:</strong> {action.method}
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="body1">
                            <strong>Path:</strong> {action.path}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
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

export default Strategies;
