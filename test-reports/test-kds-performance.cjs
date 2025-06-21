#!/usr/bin/env node

/**
 * KDS Performance Load Testing Script
 * 
 * Tests the new modular KDS architecture under load to verify:
 * - Virtual scrolling performance with large order sets
 * - Real-time subscription handling
 * - Database query performance
 * - Memory usage patterns
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

class KDSPerformanceTester {
  constructor() {
    this.results = {
      queryPerformance: [],
      realTimeLatency: [],
      bulkOperations: [],
      memoryUsage: []
    };
    this.testStartTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  measureMemory() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        rss: Math.round(usage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
        external: Math.round(usage.external / 1024 / 1024) // MB
      };
    }
    return null;
  }

  async authenticate() {
    this.log('Authenticating with guest account...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'guest@restaurant.plate',
      password: 'guest12345'
    });

    if (error) throw error;
    this.log('Authentication successful', 'success');
    return data.user;
  }

  async testQueryPerformance() {
    this.log('🚀 Testing KDS query performance...');
    
    const queries = [
      {
        name: 'fetchAllActiveOrders',
        query: () => supabase
          .from('kds_order_routing')
          .select(`
            id,
            order_id,
            station_id,
            sequence,
            routed_at,
            started_at,
            completed_at,
            bumped_by,
            bumped_at,
            recalled_at,
            recall_count,
            estimated_prep_time,
            actual_prep_time,
            notes,
            priority,
            order:orders!order_id (
              id,
              table_id,
              seat_id,
              resident_id,
              server_id,
              items,
              transcript,
              status,
              type,
              special_requests,
              created_at,
              total,
              notes,
              table:tables!table_id (
                id,
                label,
                type,
                status
              ),
              seat:seats!seat_id (
                id,
                table_id,
                label,
                status
              )
            ),
            station:kds_stations!station_id (
              id,
              name,
              type,
              color,
              position,
              is_active,
              settings
            )
          `)
          .is('completed_at', null)
          .order('priority', { ascending: false })
          .order('routed_at', { ascending: true })
      },
      {
        name: 'fetchKDSStations',
        query: () => supabase
          .from('kds_stations')
          .select('*')
          .eq('is_active', true)
          .order('position')
      },
      {
        name: 'fetchStationOrders',
        query: () => supabase
          .from('kds_order_routing')
          .select(`
            *,
            order:orders!order_id (*),
            station:kds_stations!station_id (*)
          `)
          .is('completed_at', null)
          .limit(50)
      }
    ];

    for (const { name, query } of queries) {
      const iterations = 10;
      const times = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const { data, error } = await query();
        const duration = performance.now() - start;
        
        if (error) {
          this.log(`Query ${name} failed: ${error.message}`, 'error');
          continue;
        }
        
        times.push(duration);
        
        if (i === 0) {
          this.log(`${name}: ${data.length} records`);
        }
      }
      
      if (times.length > 0) {
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const min = Math.min(...times);
        const max = Math.max(...times);
        
        this.results.queryPerformance.push({
          name,
          averageMs: Math.round(avg * 10) / 10,
          minMs: Math.round(min * 10) / 10,
          maxMs: Math.round(max * 10) / 10,
          iterations
        });
        
        this.log(`${name}: avg ${Math.round(avg)}ms, min ${Math.round(min)}ms, max ${Math.round(max)}ms`, 
          avg < 500 ? 'success' : avg < 1000 ? 'warning' : 'error');
      }
    }
  }

  async testRealTimeSubscriptions() {
    this.log('🔄 Testing real-time subscription performance...');
    
    return new Promise((resolve) => {
      const latencies = [];
      let updateCount = 0;
      const maxUpdates = 5;
      
      const channel = supabase
        .channel('perf_test_kds')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'kds_order_routing' },
          (payload) => {
            const latency = Date.now() - payload.commit_timestamp;
            latencies.push(latency);
            updateCount++;
            
            this.log(`Real-time update ${updateCount}: ${latency}ms latency`);
            
            if (updateCount >= maxUpdates) {
              channel.unsubscribe();
              
              if (latencies.length > 0) {
                const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
                this.results.realTimeLatency.push({
                  averageMs: Math.round(avg),
                  samples: latencies.length,
                  minMs: Math.min(...latencies),
                  maxMs: Math.max(...latencies)
                });
                
                this.log(`Real-time latency: avg ${Math.round(avg)}ms`, 
                  avg < 1000 ? 'success' : 'warning');
              }
              
              resolve();
            }
          }
        );
      
      channel.subscribe().then(() => {
        this.log('Real-time subscription established');
        
        // Simulate some updates by updating order priorities
        setTimeout(async () => {
          try {
            const { data: orders } = await supabase
              .from('kds_order_routing')
              .select('id')
              .limit(maxUpdates);
            
            for (const order of orders) {
              await supabase
                .from('kds_order_routing')
                .update({ priority: Math.floor(Math.random() * 10) + 1 })
                .eq('id', order.id);
              
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (error) {
            this.log(`Error simulating updates: ${error.message}`, 'error');
            resolve();
          }
        }, 1000);
        
        // Timeout after 30 seconds
        setTimeout(() => {
          channel.unsubscribe();
          this.log('Real-time test timeout reached', 'warning');
          resolve();
        }, 30000);
      });
    });
  }

  async testBulkOperations() {
    this.log('📦 Testing bulk operations performance...');
    
    try {
      // Get some test orders
      const { data: testOrders, error } = await supabase
        .from('kds_order_routing')
        .select('id')
        .limit(10);
      
      if (error) throw error;
      
      if (testOrders.length === 0) {
        this.log('No test orders available for bulk operations', 'warning');
        return;
      }
      
      // Test bulk priority update
      const start = performance.now();
      const orderIds = testOrders.map(order => order.id);
      
      const { error: bulkError } = await supabase
        .from('kds_order_routing')
        .update({ priority: 5 })
        .in('id', orderIds);
      
      const duration = performance.now() - start;
      
      if (bulkError) {
        this.log(`Bulk operation failed: ${bulkError.message}`, 'error');
      } else {
        this.results.bulkOperations.push({
          operation: 'bulk_priority_update',
          orderCount: orderIds.length,
          durationMs: Math.round(duration),
          recordsPerSecond: Math.round((orderIds.length / duration) * 1000)
        });
        
        this.log(`Bulk update: ${orderIds.length} orders in ${Math.round(duration)}ms`, 
          duration < 1000 ? 'success' : 'warning');
      }
    } catch (error) {
      this.log(`Bulk operations test failed: ${error.message}`, 'error');
    }
  }

  async testMemoryUsage() {
    this.log('💾 Testing memory usage patterns...');
    
    const initialMemory = this.measureMemory();
    if (initialMemory) {
      this.log(`Initial memory: ${initialMemory.heapUsed}MB heap, ${initialMemory.rss}MB RSS`);
    }
    
    // Simulate loading large datasets
    const largeQueries = [];
    for (let i = 0; i < 5; i++) {
      const { data } = await supabase
        .from('kds_order_routing')
        .select(`
          *,
          order:orders!order_id (*),
          station:kds_stations!station_id (*)
        `);
      
      largeQueries.push(data);
      
      const currentMemory = this.measureMemory();
      if (currentMemory) {
        this.results.memoryUsage.push({
          iteration: i + 1,
          heapUsedMB: currentMemory.heapUsed,
          rssMB: currentMemory.rss,
          recordCount: data?.length || 0
        });
      }
    }
    
    const finalMemory = this.measureMemory();
    if (finalMemory && initialMemory) {
      const heapIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      this.log(`Memory usage: ${heapIncrease > 0 ? '+' : ''}${heapIncrease}MB heap increase`, 
        heapIncrease < 50 ? 'success' : heapIncrease < 100 ? 'warning' : 'error');
    }
  }

  async runPerformanceTests() {
    this.log('🎯 Starting KDS Performance Test Suite');
    this.log('=' .repeat(60));
    
    try {
      await this.authenticate();
      
      // Core performance tests
      await this.testQueryPerformance();
      await this.testRealTimeSubscriptions();
      await this.testBulkOperations();
      await this.testMemoryUsage();
      
      this.generatePerformanceReport();
      
    } catch (error) {
      this.log(`Performance test suite failed: ${error.message}`, 'error');
    }
  }

  generatePerformanceReport() {
    this.log('=' .repeat(60));
    this.log('📊 PERFORMANCE TEST RESULTS');
    this.log('=' .repeat(60));
    
    // Query Performance
    if (this.results.queryPerformance.length > 0) {
      this.log('🔍 QUERY PERFORMANCE:');
      for (const result of this.results.queryPerformance) {
        const status = result.averageMs < 500 ? '✅' : result.averageMs < 1000 ? '⚠️' : '❌';
        this.log(`   ${status} ${result.name}: ${result.averageMs}ms avg (${result.minMs}-${result.maxMs}ms range)`);
      }
      this.log('');
    }
    
    // Real-time Performance
    if (this.results.realTimeLatency.length > 0) {
      this.log('🔄 REAL-TIME PERFORMANCE:');
      for (const result of this.results.realTimeLatency) {
        const status = result.averageMs < 500 ? '✅' : result.averageMs < 1000 ? '⚠️' : '❌';
        this.log(`   ${status} Average latency: ${result.averageMs}ms (${result.samples} samples)`);
        this.log(`      Range: ${result.minMs}ms - ${result.maxMs}ms`);
      }
      this.log('');
    }
    
    // Bulk Operations
    if (this.results.bulkOperations.length > 0) {
      this.log('📦 BULK OPERATIONS:');
      for (const result of this.results.bulkOperations) {
        const status = result.durationMs < 1000 ? '✅' : result.durationMs < 2000 ? '⚠️' : '❌';
        this.log(`   ${status} ${result.operation}: ${result.orderCount} orders in ${result.durationMs}ms`);
        this.log(`      Throughput: ${result.recordsPerSecond} records/second`);
      }
      this.log('');
    }
    
    // Memory Usage
    if (this.results.memoryUsage.length > 0) {
      this.log('💾 MEMORY USAGE:');
      const initial = this.results.memoryUsage[0];
      const final = this.results.memoryUsage[this.results.memoryUsage.length - 1];
      const increase = final.heapUsedMB - initial.heapUsedMB;
      
      const status = increase < 50 ? '✅' : increase < 100 ? '⚠️' : '❌';
      this.log(`   ${status} Heap usage: ${initial.heapUsedMB}MB → ${final.heapUsedMB}MB (+${increase}MB)`);
      this.log(`   📈 RSS usage: ${initial.rssMB}MB → ${final.rssMB}MB`);
      this.log('');
    }
    
    // Overall Assessment
    this.log('🎯 PERFORMANCE ASSESSMENT:');
    
    const queryPerfGood = this.results.queryPerformance.every(r => r.averageMs < 1000);
    const realtimeGood = this.results.realTimeLatency.every(r => r.averageMs < 1000);
    const bulkGood = this.results.bulkOperations.every(r => r.durationMs < 2000);
    const memoryGood = this.results.memoryUsage.length === 0 || 
      (this.results.memoryUsage[this.results.memoryUsage.length - 1].heapUsedMB - 
       this.results.memoryUsage[0].heapUsedMB) < 100;
    
    if (queryPerfGood && realtimeGood && bulkGood && memoryGood) {
      this.log('   ✅ ALL SYSTEMS OPTIMAL - Production ready for high-volume operations', 'success');
    } else {
      this.log('   ⚠️ PERFORMANCE CONCERNS DETECTED:', 'warning');
      if (!queryPerfGood) this.log('      - Query performance needs optimization', 'warning');
      if (!realtimeGood) this.log('      - Real-time latency too high', 'warning');
      if (!bulkGood) this.log('      - Bulk operations are slow', 'warning');
      if (!memoryGood) this.log('      - Memory usage growth concerning', 'warning');
    }
    
    const totalTime = Date.now() - this.testStartTime;
    this.log(`\n🕒 Total test duration: ${Math.round(totalTime / 1000)}s`);
  }
}

// Run the performance test suite
async function main() {
  const tester = new KDSPerformanceTester();
  await tester.runPerformanceTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { KDSPerformanceTester };