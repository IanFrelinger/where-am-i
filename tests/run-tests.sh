#!/bin/bash

# Playwright Test Runner for where-am-i
# This script runs different types of tests with various configurations

set -e

echo "🧪 Starting Playwright Test Suite for where-am-i"
echo "=================================================="

# Function to run tests with specific configuration
run_tests() {
    local test_type=$1
    local browser=$2
    local parallel=$3
    
    echo ""
    echo "🚀 Running $test_type tests on $browser..."
    echo "----------------------------------------"
    
    if [ "$parallel" = "true" ]; then
        echo "📊 Running tests in parallel mode"
        npx playwright test --project=$browser --reporter=html,line
    else
        echo "📊 Running tests sequentially"
        npx playwright test --project=$browser --workers=1 --reporter=html,line
    fi
    
    echo "✅ $test_type tests completed on $browser"
}

# Function to run specific test files
run_test_file() {
    local test_file=$1
    local browser=${2:-chromium}
    
    echo ""
    echo "🎯 Running $test_file on $browser..."
    echo "----------------------------------------"
    
    npx playwright test $test_file --project=$browser --reporter=html,line
    
    echo "✅ $test_file completed on $browser"
}

# Function to show test results
show_results() {
    echo ""
    echo "📊 Test Results Summary"
    echo "======================="
    
    if [ -d "test-results" ]; then
        echo "📁 Test results directory: test-results/"
        echo "📈 HTML report: test-results/index.html"
        echo "📋 JSON results: test-results/results.json"
        echo "📋 JUnit results: test-results/results.xml"
    fi
    
    if [ -d "playwright-report" ]; then
        echo "🌐 Playwright report: playwright-report/index.html"
    fi
}

# Main execution
case "${1:-all}" in
    "smoke")
        echo "🔥 Running Smoke Tests Only"
        run_test_file "tests/smoke.spec.ts"
        ;;
    "map")
        echo "🗺️  Running Map Tests Only"
        run_test_file "tests/map.spec.ts"
        ;;
    "e2e")
        echo "🔄 Running End-to-End Tests Only"
        run_test_file "tests/e2e.spec.ts"
        ;;
    "quick")
        echo "⚡ Running Quick Tests (Smoke + Map)"
        run_test_file "tests/smoke.spec.ts"
        run_test_file "tests/map.spec.ts"
        ;;
    "browser")
        browser=${2:-chromium}
        echo "🌐 Running All Tests on $browser"
        run_tests "All" $browser "false"
        ;;
    "parallel")
        echo "🚀 Running All Tests in Parallel"
        npx playwright test --reporter=html,line
        ;;
    "debug")
        echo "🐛 Running Tests in Debug Mode (headed)"
        npx playwright test --debug
        ;;
    "headed")
        echo "🖥️  Running Tests in Headed Mode"
        npx playwright test --headed
        ;;
    "ui")
        echo "🖥️  Opening Playwright UI"
        npx playwright test --ui
        ;;
    "install")
        echo "📦 Installing Playwright Browsers"
        npx playwright install
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [test_type] [browser]"
        echo ""
        echo "Test Types:"
        echo "  smoke     - Run smoke tests only"
        echo "  map       - Run map functionality tests only"
        echo "  e2e       - Run end-to-end tests only"
        echo "  quick     - Run smoke + map tests"
        echo "  browser   - Run all tests on specific browser (default: chromium)"
        echo "  parallel  - Run all tests in parallel"
        echo "  debug     - Run tests in debug mode (headed)"
        echo "  headed    - Run tests in headed mode"
        echo "  ui        - Open Playwright UI"
        echo "  install   - Install Playwright browsers"
        echo "  help      - Show this help message"
        echo ""
        echo "Browsers: chromium, firefox, webkit, 'Mobile Chrome', 'Mobile Safari'"
        echo ""
        echo "Examples:"
        echo "  $0                    # Run all tests on all browsers"
        echo "  $0 smoke              # Run smoke tests only"
        echo "  $0 browser firefox    # Run all tests on Firefox"
        echo "  $0 quick              # Run quick test suite"
        exit 0
        ;;
    *)
        echo "🌍 Running All Tests on All Browsers"
        npx playwright test --reporter=html,line
        ;;
esac

# Show results summary
show_results

echo ""
echo "🎉 Test execution completed!"
echo "📊 Check the reports above for detailed results"
