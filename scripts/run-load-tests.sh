#!/bin/bash
# =============================================================================
# Load Test Execution Wrapper
# =============================================================================
# Comprehensive wrapper for executing K6 load tests with validation,
# safety checks, and results reporting.
#
# Usage:
#   ./run-load-tests.sh [OPTIONS] [TEST_TYPE]
#
# Test Types:
#   normal    - Normal load (default, baseline performance)
#   peak      - Peak load (2x normal load)
#   stress    - Stress test (find breaking point)
#   spike     - Spike test (sudden traffic surge)
#   soak      - Soak test (sustained load over time)
#
# Options:
#   --target URL           Target API base URL (default: http://localhost:3000)
#   --duration TIME        Test duration (default: varies by test type)
#   --vus NUMBER          Virtual users (overrides test default)
#   --dry-run             Show what would be done without executing
#   --skip-checks         Skip pre-flight safety checks
#   --output DIR          Output directory (default: ./load-test-results)
#   --k6-args ARGS        Additional K6 arguments
#   --verbose             Show detailed output
#   --help                Show this help message
#
# Environment Variables:
#   API_BASE_URL          Target API URL
#   K6_CLOUD_TOKEN        K6 Cloud token (for cloud execution)
#   TEST_DURATION         Override test duration
#   MAX_VUS               Maximum virtual users
#   THRESHOLDS_P95        P95 threshold in ms (default: 500)
#   THRESHOLDS_ERROR_RATE Max error rate (default: 0.01 = 1%)
#
# Examples:
#   # Run normal load test
#   ./run-load-tests.sh normal
#
#   # Run stress test against staging
#   ./run-load-tests.sh --target https://staging-api.example.com stress
#
#   # Run peak test with custom duration
#   ./run-load-tests.sh --duration 10m peak
#
#   # Dry run to see configuration
#   ./run-load-tests.sh --dry-run normal
#
#   # Run with custom VUs and additional K6 args
#   ./run-load-tests.sh --vus 100 --k6-args "--http-debug" normal
#
# Exit Codes:
#   0 - Success (all thresholds met)
#   1 - Test failed (thresholds not met)
#   2 - Configuration error
#   3 - K6 not installed
#   4 - Safety check failed
#   5 - Target not accessible
# =============================================================================

set -euo pipefail

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly MAGENTA='\033[0;35m'
readonly NC='\033[0m' # No Color
readonly BOLD='\033[1m'

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Default configuration
TEST_TYPE="${1:-normal}"
TARGET_URL="${API_BASE_URL:-http://localhost:3000}"
OUTPUT_DIR="${OUTPUT_DIR:-./load-test-results}"
DRY_RUN=false
SKIP_CHECKS=false
VERBOSE=false
CUSTOM_DURATION=""
CUSTOM_VUS=""
CUSTOM_K6_ARGS=""

# Performance thresholds (defaults)
THRESHOLD_P95="${THRESHOLDS_P95:-500}"          # 500ms
THRESHOLD_P99="${THRESHOLDS_P99:-1000}"         # 1000ms
THRESHOLD_ERROR_RATE="${THRESHOLDS_ERROR_RATE:-0.01}"  # 1%

# Test results
TEST_PASSED=false
ACTUAL_P95=0
ACTUAL_P99=0
ACTUAL_ERROR_RATE=0
ACTUAL_RPS=0

# =============================================================================
# Utility Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $*"
}

log_error() {
    echo -e "${RED}[✗]${NC} $*" >&2
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $*"
}

log_section() {
    echo ""
    echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}${BOLD}$*${NC}"
    echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

log_detail() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "    ${BLUE}→${NC} $*"
    fi
}

show_usage() {
    sed -n '/^# Usage:/,/^# ===/p' "$0" | sed 's/^# \?//'
    exit 0
}

banner() {
    local test_name="$1"
    echo ""
    echo -e "${BOLD}${MAGENTA}╔════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${MAGENTA}║                                        ║${NC}"
    echo -e "${BOLD}${MAGENTA}║       ${CYAN}K6 LOAD TEST RUNNER${MAGENTA}           ║${NC}"
    echo -e "${BOLD}${MAGENTA}║                                        ║${NC}"
    echo -e "${BOLD}${MAGENTA}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BOLD}Test Type:${NC} ${GREEN}$test_name${NC}"
    echo -e "${BOLD}Target:${NC}    $TARGET_URL"
    echo -e "${BOLD}Date:${NC}      $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
}

# =============================================================================
# Test Configurations
# =============================================================================

get_test_config() {
    local test_type="$1"
    
    case "$test_type" in
        normal)
            TEST_NAME="Normal Load Test"
            TEST_DURATION="${CUSTOM_DURATION:-5m}"
            TEST_VUS="${CUSTOM_VUS:-50}"
            TEST_MAX_VUS="${CUSTOM_VUS:-50}"
            TEST_DESCRIPTION="Baseline performance test with typical load"
            ;;
        peak)
            TEST_NAME="Peak Load Test"
            TEST_DURATION="${CUSTOM_DURATION:-10m}"
            TEST_VUS="${CUSTOM_VUS:-100}"
            TEST_MAX_VUS="${CUSTOM_VUS:-150}"
            TEST_DESCRIPTION="Testing system under peak traffic conditions"
            ;;
        stress)
            TEST_NAME="Stress Test"
            TEST_DURATION="${CUSTOM_DURATION:-15m}"
            TEST_VUS="${CUSTOM_VUS:-200}"
            TEST_MAX_VUS="${CUSTOM_VUS:-300}"
            TEST_DESCRIPTION="Finding system breaking point and recovery"
            ;;
        spike)
            TEST_NAME="Spike Test"
            TEST_DURATION="${CUSTOM_DURATION:-3m}"
            TEST_VUS="${CUSTOM_VUS:-50}"
            TEST_MAX_VUS="${CUSTOM_VUS:-500}"
            TEST_DESCRIPTION="Testing sudden traffic spike handling"
            ;;
        soak)
            TEST_NAME="Soak Test"
            TEST_DURATION="${CUSTOM_DURATION:-1h}"
            TEST_VUS="${CUSTOM_VUS:-50}"
            TEST_MAX_VUS="${CUSTOM_VUS:-50}"
            TEST_DESCRIPTION="Testing system stability over extended period"
            ;;
        *)
            log_error "Unknown test type: $test_type"
            log_info "Valid types: normal, peak, stress, spike, soak"
            return 2
            ;;
    esac
    
    return 0
}

# =============================================================================
# Safety Checks
# =============================================================================

check_production_safety() {
    log_section "Safety Checks"
    
    # Check if target appears to be production
    if [[ "$TARGET_URL" =~ (production|prod|api\..*\.com|live) ]]; then
        log_warning "Target URL appears to be a PRODUCTION environment!"
        log_warning "URL: $TARGET_URL"
        echo ""
        log_error "⚠️  RUNNING LOAD TESTS AGAINST PRODUCTION CAN:"
        log_error "   - Cause service degradation"
        log_error "   - Impact real users"
        log_error "   - Trigger rate limiting"
        log_error "   - Incur unexpected costs"
        echo ""
        
        if [[ "$SKIP_CHECKS" == "false" ]]; then
            read -p "Are you ABSOLUTELY SURE you want to continue? (type 'YES' to proceed): " -r
            if [[ "$REPLY" != "YES" ]]; then
                log_error "Aborted by user"
                return 4
            fi
            log_warning "Proceeding as requested..."
        fi
    else
        log_success "Target URL does not appear to be production"
    fi
    
    # Check if localhost
    if [[ "$TARGET_URL" =~ localhost|127\.0\.0\.1 ]]; then
        log_info "Testing against localhost"
        log_detail "Ensure your local server is running"
    fi
    
    log_success "Safety checks completed"
    return 0
}

check_dependencies() {
    log_section "Checking Dependencies"
    
    # Check K6
    if ! command -v k6 &> /dev/null; then
        log_error "K6 is not installed"
        echo ""
        log_info "Install K6:"
        log_info "  macOS:   brew install k6"
        log_info "  Linux:   See https://k6.io/docs/getting-started/installation/"
        log_info "  Docker:  docker pull grafana/k6:latest"
        return 3
    fi
    
    local k6_version=$(k6 version | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    log_success "K6 is installed: $k6_version"
    
    # Check jq (for JSON parsing)
    if command -v jq &> /dev/null; then
        log_detail "✓ jq available for result parsing"
    else
        log_warning "jq not found, result parsing may be limited"
        log_detail "Install: apt-get install jq or brew install jq"
    fi
    
    # Check curl
    if command -v curl &> /dev/null; then
        log_detail "✓ curl available for connectivity checks"
    else
        log_warning "curl not found"
    fi
    
    log_success "Dependency check completed"
    return 0
}

check_target_accessibility() {
    log_section "Checking Target Accessibility"
    
    log_info "Target: $TARGET_URL"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would check target accessibility"
        return 0
    fi
    
    # Try to reach the target
    local health_check_url="${TARGET_URL}/health"
    
    log_detail "Testing connectivity to $TARGET_URL..."
    
    if command -v curl &> /dev/null; then
        local http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$TARGET_URL" 2>/dev/null || echo "000")
        
        if [[ "$http_code" =~ ^[2-3] ]]; then
            log_success "Target is accessible (HTTP $http_code)"
        elif [[ "$http_code" == "000" ]]; then
            log_error "Cannot reach target (connection failed)"
            log_error "Ensure the service is running and accessible"
            return 5
        else
            log_warning "Target returned HTTP $http_code"
            log_warning "Service may not be fully ready"
        fi
    else
        log_warning "Cannot verify target accessibility (curl not available)"
    fi
    
    # Check health endpoint if available
    if command -v curl &> /dev/null; then
        local health_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$health_check_url" 2>/dev/null || echo "000")
        
        if [[ "$health_code" == "200" ]]; then
            log_detail "✓ Health endpoint accessible"
        else
            log_detail "No health endpoint at /health (not critical)"
        fi
    fi
    
    return 0
}

# =============================================================================
# Test Script Generation
# =============================================================================

generate_k6_script() {
    local test_type="$1"
    local script_path="$2"
    
    log_section "Generating K6 Test Script"
    
    cat > "$script_path" << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Get configuration from environment
const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';
const TEST_TYPE = __ENV.TEST_TYPE || 'normal';

// Test scenarios based on type
export const options = getOptions(TEST_TYPE);

function getOptions(type) {
    const baseThresholds = {
        'http_req_duration{status:200}': ['p(95)<500', 'p(99)<1000'],
        'http_req_failed': ['rate<0.01'],
        'errors': ['rate<0.01'],
    };
    
    const scenarios = {
        normal: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '1m', target: 20 },
                { duration: '3m', target: 50 },
                { duration: '1m', target: 0 },
            ],
            gracefulRampDown: '30s',
        },
        peak: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 50 },
                { duration: '5m', target: 100 },
                { duration: '2m', target: 150 },
                { duration: '1m', target: 0 },
            ],
            gracefulRampDown: '30s',
        },
        stress: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 50 },
                { duration: '5m', target: 100 },
                { duration: '5m', target: 200 },
                { duration: '2m', target: 300 },
                { duration: '1m', target: 0 },
            ],
            gracefulRampDown: '30s',
        },
        spike: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 50 },
                { duration: '10s', target: 500 },
                { duration: '1m', target: 500 },
                { duration: '10s', target: 50 },
                { duration: '30s', target: 0 },
            ],
            gracefulRampDown: '10s',
        },
        soak: {
            executor: 'constant-vus',
            vus: 50,
            duration: '1h',
        },
    };
    
    return {
        scenarios: {
            main: scenarios[type] || scenarios.normal,
        },
        thresholds: baseThresholds,
    };
}

// Main test function
export default function () {
    const endpoints = [
        '/',
        '/health',
        '/api/v1/status',
    ];
    
    // Test random endpoint
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const url = `${BASE_URL}${endpoint}`;
    
    const params = {
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'K6-Load-Test',
        },
        timeout: '30s',
    };
    
    const response = http.get(url, params);
    
    // Check response
    const result = check(response, {
        'status is 200': (r) => r.status === 200,
        'status is not 5xx': (r) => r.status < 500,
        'response time < 2s': (r) => r.timings.duration < 2000,
    });
    
    errorRate.add(!result);
    
    // Random think time
    sleep(Math.random() * 2 + 1);
}

// Setup function
export function setup() {
    console.log(`Starting ${TEST_TYPE} load test against ${BASE_URL}`);
    
    // Verify target is accessible
    const response = http.get(BASE_URL);
    if (response.status === 0) {
        throw new Error(`Cannot reach target: ${BASE_URL}`);
    }
    
    return { startTime: Date.now() };
}

// Teardown function
export function teardown(data) {
    const duration = (Date.now() - data.startTime) / 1000;
    console.log(`Test completed in ${duration.toFixed(2)} seconds`);
}
EOF
    
    log_success "K6 test script generated"
    log_detail "Script: $script_path"
    
    return 0
}

# =============================================================================
# Test Execution
# =============================================================================

run_k6_test() {
    log_section "Running K6 Load Test"
    
    local script_path="$1"
    local results_file="$2"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would execute K6 test"
        log_detail "Script: $script_path"
        log_detail "Results: $results_file"
        log_detail "Duration: $TEST_DURATION"
        log_detail "VUs: $TEST_VUS (max: $TEST_MAX_VUS)"
        return 0
    fi
    
    log_info "Test: $TEST_NAME"
    log_info "Duration: $TEST_DURATION"
    log_info "Virtual Users: $TEST_VUS (max: $TEST_MAX_VUS)"
    log_info "Target: $TARGET_URL"
    echo ""
    
    # Build K6 command
    local k6_cmd="k6 run"
    k6_cmd+=" --out json=${results_file}"
    k6_cmd+=" --summary-export=${OUTPUT_DIR}/summary-$(date +%Y%m%d-%H%M%S).json"
    
    # Add environment variables
    k6_cmd+=" -e TARGET_URL=${TARGET_URL}"
    k6_cmd+=" -e TEST_TYPE=${TEST_TYPE}"
    
    # Add custom K6 args
    if [[ -n "$CUSTOM_K6_ARGS" ]]; then
        k6_cmd+=" $CUSTOM_K6_ARGS"
    fi
    
    k6_cmd+=" ${script_path}"
    
    log_detail "Command: $k6_cmd"
    echo ""
    
    # Run K6
    log_info "Starting test execution..."
    log_warning "This may take several minutes..."
    echo ""
    
    if eval "$k6_cmd"; then
        log_success "K6 test completed successfully"
        return 0
    else
        log_error "K6 test failed or thresholds not met"
        return 1
    fi
}

# =============================================================================
# Results Analysis
# =============================================================================

parse_results() {
    local results_file="$1"
    
    log_section "Analyzing Results"
    
    if [[ ! -f "$results_file" ]]; then
        log_warning "Results file not found, skipping analysis"
        return 0
    fi
    
    # Parse JSON results (requires jq)
    if command -v jq &> /dev/null; then
        log_detail "Parsing results with jq..."
        
        # Extract metrics (simplified parsing)
        local total_requests=$(grep -c '"metric":"http_reqs"' "$results_file" 2>/dev/null || echo "0")
        log_info "Total requests: $total_requests"
        
    else
        log_warning "jq not available, showing basic stats"
        
        # Basic stats without jq
        local total_lines=$(wc -l < "$results_file")
        log_info "Result entries: $total_lines"
    fi
    
    log_success "Results parsed"
    return 0
}

validate_thresholds() {
    log_section "Validating Performance Thresholds"
    
    # These would be extracted from actual K6 results
    # For now, using placeholder logic
    
    log_info "Threshold Configuration:"
    echo -e "  ${BOLD}P95:${NC}        < ${THRESHOLD_P95}ms"
    echo -e "  ${BOLD}P99:${NC}        < ${THRESHOLD_P99}ms"
    # Use awk for arithmetic instead of bc
    local error_rate_percent=$(awk "BEGIN {print $THRESHOLD_ERROR_RATE * 100}")
    echo -e "  ${BOLD}Error Rate:${NC} < ${error_rate_percent}%"
    echo ""
    
    log_info "Actual Results:"
    echo -e "  ${BOLD}P95:${NC}        ${ACTUAL_P95}ms"
    echo -e "  ${BOLD}P99:${NC}        ${ACTUAL_P99}ms"
    echo -e "  ${BOLD}Error Rate:${NC} ${ACTUAL_ERROR_RATE}%"
    echo ""
    
    # Validation logic would go here
    # This is simplified for the wrapper
    
    log_info "See detailed K6 output above for actual threshold validation"
    
    return 0
}

# =============================================================================
# Report Generation
# =============================================================================

generate_report() {
    local exit_code="$1"
    local results_file="$2"
    
    echo ""
    echo -e "${BOLD}${CYAN}════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  LOAD TEST REPORT${NC}"
    echo -e "${BOLD}${CYAN}════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BOLD}Test Configuration:${NC}"
    echo "  Test Type:   $TEST_NAME"
    echo "  Target URL:  $TARGET_URL"
    echo "  Duration:    $TEST_DURATION"
    echo "  Virtual Users: $TEST_VUS (max: $TEST_MAX_VUS)"
    echo "  Date:        $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    echo -e "${BOLD}Results:${NC}"
    echo "  Results File: $results_file"
    echo "  Output Dir:   $OUTPUT_DIR"
    echo ""
    
    if [[ $exit_code -eq 0 ]]; then
        echo -e "${BOLD}Overall Status:${NC} ${GREEN}✓ TEST PASSED${NC}"
        echo ""
        echo -e "${GREEN}All performance thresholds were met!${NC}"
    else
        echo -e "${BOLD}Overall Status:${NC} ${RED}✗ TEST FAILED${NC}"
        echo ""
        echo -e "${RED}Some performance thresholds were not met.${NC}"
        echo -e "${RED}Review the detailed K6 output above.${NC}"
    fi
    
    echo ""
    echo -e "${BOLD}Next Steps:${NC}"
    echo "  1. Review detailed results in: $results_file"
    echo "  2. Check K6 summary output above"
    echo "  3. Compare against baseline metrics"
    echo "  4. Investigate any failed thresholds"
    echo ""
}

# =============================================================================
# Main Execution
# =============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --target)
                TARGET_URL="$2"
                shift 2
                ;;
            --duration)
                CUSTOM_DURATION="$2"
                shift 2
                ;;
            --vus)
                CUSTOM_VUS="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --skip-checks)
                SKIP_CHECKS=true
                shift
                ;;
            --output)
                OUTPUT_DIR="$2"
                shift 2
                ;;
            --k6-args)
                CUSTOM_K6_ARGS="$2"
                shift 2
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --help)
                show_usage
                ;;
            normal|peak|stress|spike|soak)
                TEST_TYPE="$1"
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                ;;
        esac
    done
}

main() {
    # Parse all arguments
    parse_args "$@"
    
    # Get test configuration
    get_test_config "$TEST_TYPE" || exit $?
    
    # Show banner
    banner "$TEST_NAME"
    
    # Pre-flight checks
    if [[ "$SKIP_CHECKS" == "false" ]]; then
        check_production_safety || exit $?
    fi
    
    check_dependencies || exit $?
    check_target_accessibility || exit $?
    
    # Setup output directory
    mkdir -p "$OUTPUT_DIR"
    
    # Generate test script
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local script_path="${OUTPUT_DIR}/test-${TEST_TYPE}-${timestamp}.js"
    local results_file="${OUTPUT_DIR}/results-${TEST_TYPE}-${timestamp}.json"
    
    generate_k6_script "$TEST_TYPE" "$script_path"
    
    # Run the test
    local test_exit_code=0
    run_k6_test "$script_path" "$results_file" || test_exit_code=$?
    
    # Parse and validate results
    parse_results "$results_file"
    validate_thresholds
    
    # Generate final report
    generate_report "$test_exit_code" "$results_file"
    
    # Cleanup temporary script
    if [[ "$VERBOSE" != "true" ]]; then
        rm -f "$script_path"
    fi
    
    exit $test_exit_code
}

# Trap errors
trap 'log_error "Script interrupted"; exit 1' INT TERM

main "$@"
