import React, { useContext, useEffect, useState } from "react";
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
import StopIcon from "@mui/icons-material/Stop";
import { useSelectedHostContext } from "../contexts/SelectedHostContext";
import {
  setStrategiesToLocalStorage,
  getStrategiesFromLocalStorage,
  removeStrategyFromLocalStorage,
} from "../services/localStorageService";
import { Strategy } from "../models/Strategy";
import { WebSocketContext } from "../contexts/WebSocketProvider";

import { StrategiesEngine } from "../services/strategiesEngine";

function Strategies() {
  const selectedHost = useSelectedHostContext();
  const webSocketContext = useContext(WebSocketContext);

  //gestisce lo stato della strategia attualmente attiva
  const [commandStatus, setCommandStatus] = useState(new Map());
  const updateCommandStatus = (key: string, value: string) => {
    setCommandStatus((map) => new Map(map.set(key, value)));
  };

  const [fileName, setFileName] = useState<string>("");
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [activeStrategy, setActiveStrategy] = useState<string | undefined>(
    undefined
  );
  const [isStratRunning, setIsStratRunning] = useState<boolean>(false);
  const [strategyEngine, setStrategyEngine] = useState<StrategiesEngine | null>(
    null
  );

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

  const handleRunStrategy = (strategy: Strategy) => {
    if (!webSocketContext) throw new Error("Need to connect to a host");

    try {
      setActiveStrategy(strategy.name);
      strategyEngine?.runStrategy(strategy);
    } catch (error) {
      console.error("Errore durante l'esecuzione della strategia:", error);
    }
  };

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

  useEffect(() => {
    if (webSocketContext) {
      const newstrategyEngine = new StrategiesEngine(
        webSocketContext.sendMessage,
        updateCommandStatus,
        webSocketContext.registerMessageHandler,
        setIsStratRunning
      );

      setStrategyEngine(newstrategyEngine);
    }
  }, [webSocketContext]);

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
                      {strategy.name === activeStrategy && isStratRunning ? (
                        <Button
                          color="warning"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            strategyEngine?.stopExecution();
                          }}
                        >
                          <StopIcon />
                        </Button>
                      ) : (
                        <Button
                          color="success"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRunStrategy(strategy);
                          }}
                        >
                          <PlayArrowIcon />
                        </Button>
                      )}
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {strategy.commands.map((cmd, cmdIndex) => (
                    <Paper key={cmdIndex} sx={{ mb: 2, p: 2 }}>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        <strong>Action {cmdIndex + 1}</strong>
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={3}>
                          <Typography variant="body1">
                            <strong>Command:</strong>{" "}
                            {cmd.command + " " + cmd.subcommand}
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="body1">
                            <strong>Method:</strong> {cmd.method}
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="body1">
                            <strong>Path:</strong> {cmd.path}
                          </Typography>
                        </Grid>
                        {strategy.name === activeStrategy ? (
                          <Grid item xs={3}>
                            <Typography variant="body1">
                              <strong>Status:</strong>{" "}
                              {commandStatus.get(cmd.id)}
                            </Typography>
                          </Grid>
                        ) : null}
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
