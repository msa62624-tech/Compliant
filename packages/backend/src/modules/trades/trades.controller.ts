import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from "@nestjs/swagger";
import { TradesService } from "./trades.service";

@ApiTags("trades")
@Controller("trades")
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Get()
  @ApiOperation({ summary: "Get all construction trades" })
  @ApiResponse({
    status: 200,
    description: "Returns list of all construction trades",
  })
  getAllTrades() {
    return {
      trades: this.tradesService.getAllTrades(),
      count: this.tradesService.getTradesCount(),
    };
  }

  @Get("categorized")
  @ApiOperation({ summary: "Get construction trades organized by category" })
  @ApiResponse({ status: 200, description: "Returns categorized trades" })
  getCategorizedTrades() {
    return this.tradesService.getCategorizedTrades();
  }

  @Get("search")
  @ApiOperation({ summary: "Search construction trades" })
  @ApiQuery({ name: "q", required: true, description: "Search query" })
  @ApiResponse({ status: 200, description: "Returns matching trades" })
  searchTrades(@Query("q") query: string) {
    const results = this.tradesService.searchTrades(query);
    return {
      query,
      results,
      count: results.length,
    };
  }

  @Get("insurance-requirements")
  @ApiOperation({ summary: "Get insurance requirements for trades" })
  @ApiQuery({
    name: "trade",
    required: false,
    description: "Specific trade name",
  })
  @ApiResponse({ status: 200, description: "Returns insurance requirements" })
  getInsuranceRequirements(@Query("trade") trade?: string) {
    if (trade) {
      return {
        trade,
        requirements: this.tradesService.getInsuranceRequirements(trade),
      };
    }
    return this.tradesService.getAllInsuranceRequirements();
  }

  @Get("stats")
  @ApiOperation({ summary: "Get construction trades statistics" })
  @ApiResponse({ status: 200, description: "Returns statistics about trades" })
  getStatistics() {
    return this.tradesService.getStatistics();
  }

  @Get("validate")
  @ApiOperation({ summary: "Validate if a trade exists" })
  @ApiQuery({
    name: "trade",
    required: true,
    description: "Trade name to validate",
  })
  @ApiResponse({ status: 200, description: "Returns validation result" })
  validateTrade(@Query("trade") trade: string) {
    return {
      trade,
      isValid: this.tradesService.isValidTrade(trade),
      category: this.tradesService.getTradeCategory(trade),
    };
  }
}
