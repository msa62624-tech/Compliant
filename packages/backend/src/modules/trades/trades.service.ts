import { Injectable } from "@nestjs/common";
import {
  CONSTRUCTION_TRADES,
  CONSTRUCTION_TRADES_ARRAY,
  CONSTRUCTION_TRADE_CATEGORIES,
  TRADE_INSURANCE_REQUIREMENTS,
  getTradeInsuranceRequirements,
  searchTrades,
  getTradeCategoryName,
} from "@compliant/shared";

/**
 * Service for managing construction trades
 * Provides access to comprehensive trade list and related utilities
 */
@Injectable()
export class TradesService {
  /**
   * Get all construction trades as an array
   */
  getAllTrades(): string[] {
    return CONSTRUCTION_TRADES_ARRAY;
  }

  /**
   * Get all construction trades as an object with keys
   */
  getAllTradesObject() {
    return CONSTRUCTION_TRADES;
  }

  /**
   * Get categorized construction trades
   */
  getCategorizedTrades() {
    return CONSTRUCTION_TRADE_CATEGORIES;
  }

  /**
   * Search trades by query string
   */
  searchTrades(query: string): string[] {
    return searchTrades(query);
  }

  /**
   * Get insurance requirements for a specific trade
   */
  getInsuranceRequirements(trade: string) {
    return getTradeInsuranceRequirements(trade);
  }

  /**
   * Get all trade insurance requirements
   */
  getAllInsuranceRequirements() {
    return TRADE_INSURANCE_REQUIREMENTS;
  }

  /**
   * Get category name for a trade
   */
  getTradeCategory(trade: string): string | null {
    return getTradeCategoryName(trade);
  }

  /**
   * Get trades count
   */
  getTradesCount(): number {
    return CONSTRUCTION_TRADES_ARRAY.length;
  }

  /**
   * Validate if a trade exists
   */
  isValidTrade(trade: string): boolean {
    return (CONSTRUCTION_TRADES_ARRAY as string[]).includes(trade);
  }

  /**
   * Get trades statistics
   */
  getStatistics() {
    const categories = CONSTRUCTION_TRADE_CATEGORIES;
    const categoryCounts = Object.entries(categories).map(
      ([category, trades]) => ({
        category,
        count: (trades as string[]).length,
      }),
    );

    return {
      totalTrades: CONSTRUCTION_TRADES_ARRAY.length,
      totalCategories: Object.keys(categories).length,
      categoryCounts,
    };
  }
}
