#!/usr/bin/env node

/**
 * KDS Debugging Automation System
 * Multi-agent debugging for complex UI issues
 */

const { execSync } = require('child_process');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class KDSDebugAutomation {
  constructor() {
    this.browser = null;
    this.page = null;
    this.debugData = {};
  }

  async initialize() {
    console.log('🤖 Initializing KDS Debug Automation...');
    
    try {
      this.browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: { width: 1920, height: 1080 }
      });
      this.page = await this.browser.newPage();
      
      // Capture console logs
      this.page.on('console', (msg) => {
        if (msg.text().includes('🔥')) {
          console.log(`[BROWSER] ${msg.text()}`);
          this.parseDebugLog(msg.text());
        }
      });
      
      console.log('✅ Browser automation ready');
    } catch (error) {
      console.error('❌ Failed to initialize browser:', error.message);
    }
  }

  parseDebugLog(logText) {
    // Extract debug data from console logs
    if (logText.includes('TableGroupedView DEBUG')) {
      const match = logText.match(/inputOrders: (\d+), tableGroups: (\d+)/);
      if (match) {
        this.debugData.inputOrders = parseInt(match[1]);
        this.debugData.tableGroups = parseInt(match[2]);
      }
    }
    
    if (logText.includes('KDSMainContent Render DEBUG')) {
      const match = logText.match(/actualOrders: (\d+)/);
      if (match) {
        this.debugData.actualOrders = parseInt(match[1]);
      }
    }
  }

  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `debug-${name}-${timestamp}.png`;
    await this.page.screenshot({ path: filename, fullPage: true });
    console.log(`📸 Screenshot saved: ${filename}`);
    return filename;
  }

  async checkElementExists(selector) {
    try {
      await this.page.waitForSelector(selector, { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  async analyzeKDSPage() {
    console.log('🔍 Analyzing KDS page...');
    
    await this.page.goto('http://localhost:3000/kitchen/kds');
    await this.page.waitForTimeout(3000); // Wait for data to load

    const analysis = {
      timestamp: new Date().toISOString(),
      screenshots: [],
      elements: {},
      debugData: this.debugData,
      issues: []
    };

    // Take screenshot
    analysis.screenshots.push(await this.takeScreenshot('initial'));

    // Check for debug boxes
    analysis.elements.redBox = await this.checkElementExists('[style*="background-color: red"]');
    analysis.elements.greenBox = await this.checkElementExists('[style*="background-color: green"]');
    analysis.elements.blueBox = await this.checkElementExists('[style*="background-color: blue"]');

    // Check for actual order content
    analysis.elements.orderCards = await this.checkElementExists('[data-testid="order-card"]');
    analysis.elements.tableGroups = await this.checkElementExists('[data-testid="table-group"]');

    // Analyze issues
    if (this.debugData.inputOrders > 0 && this.debugData.tableGroups === 0) {
      analysis.issues.push('Table grouping hook not creating groups from orders');
    }

    if (analysis.elements.redBox && analysis.elements.greenBox && !analysis.elements.orderCards) {
      analysis.issues.push('Components render but no order content appears');
    }

    // Save analysis
    fs.writeFileSync(`debug-analysis-${Date.now()}.json`, JSON.stringify(analysis, null, 2));
    
    console.log('📊 Analysis complete:', analysis);
    return analysis;
  }

  async runMultiAgentDiagnosis() {
    console.log('🤖 Running multi-agent diagnosis...');
    
    // Agent 1: Data Flow Analysis
    console.log('Agent 1: Analyzing data flow...');
    // This would trigger Claude Code agents to investigate data pipeline
    
    // Agent 2: Component Analysis  
    console.log('Agent 2: Analyzing component structure...');
    // This would trigger agents to investigate React components
    
    // Agent 3: Database Analysis
    console.log('Agent 3: Analyzing database queries...');
    // This would trigger agents to investigate database queries
    
    // Coordinate findings
    console.log('🧠 Coordinating agent findings...');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// CLI interface
async function main() {
  const automation = new KDSDebugAutomation();
  
  try {
    await automation.initialize();
    
    const command = process.argv[2] || 'analyze';
    
    switch (command) {
      case 'analyze':
        await automation.analyzeKDSPage();
        break;
      case 'multi-agent':
        await automation.runMultiAgentDiagnosis();
        break;
      default:
        console.log('Usage: node debug-automation.js [analyze|multi-agent]');
    }
  } catch (error) {
    console.error('❌ Automation failed:', error);
  } finally {
    await automation.cleanup();
  }
}

if (require.main === module) {
  main();
}

module.exports = KDSDebugAutomation;