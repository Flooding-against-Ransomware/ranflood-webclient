import { Group } from "../models/GroupHost";
import { Strategy } from "../models/Strategy";

export const getStrategiesFromLocalStorage = (): Strategy[] => {
  const data = localStorage.getItem("strategies");
  if (data) {
    return JSON.parse(data) as Strategy[];
  }
  return [];
};

export const getMachinesFromLocalStorage = (): Group[] => {
  const data = localStorage.getItem("hostList");
  if (data) {
    return JSON.parse(data) as Group[];
  }
  return [];
};

export const setStrategiesToLocalStorage = (newStrategies: Strategy[]) => {
  const existingStrategies = getStrategiesFromLocalStorage();

  // Create a map to merge existing and new strategies
  const strategyMap = new Map<string, Strategy>();

  existingStrategies.forEach((strategy) => {
    strategyMap.set(strategy.name, strategy);
  });

  newStrategies.forEach((strategy) => {
    strategyMap.set(strategy.name, strategy);
  });

  const mergedStrategies = Array.from(strategyMap.values());

  localStorage.setItem("strategies", JSON.stringify(mergedStrategies));
};

export const removeStrategyFromLocalStorage = (strategyName: string) => {
  const existingStrategies = getStrategiesFromLocalStorage();

  const updatedStrategies = existingStrategies.filter(
    (strategy) => strategy.name !== strategyName
  );

  localStorage.setItem("strategies", JSON.stringify(updatedStrategies));
};
