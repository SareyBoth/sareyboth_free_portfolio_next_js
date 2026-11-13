import "server-only";
import type { PortfolioConfig } from "@/types/portfolio";
import {
  loadCommittedPortfolioContent,
  type LoadedPortfolioContent,
} from "./load-node";

export function getPortfolioContent(): LoadedPortfolioContent {
  return loadCommittedPortfolioContent();
}

export function getPortfolioConfig(): PortfolioConfig {
  return loadCommittedPortfolioContent().config;
}
