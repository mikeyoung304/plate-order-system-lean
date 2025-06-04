import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import PerformanceDashboard from '@/components/monitoring/performance-dashboard'
import OpenAICostDashboard from '@/components/monitoring/openai-cost-dashboard'
import { 
  Activity, 
  DollarSign, 
  AlertTriangle, 
  BarChart3,
  Shield,
  Zap
} from 'lucide-react'

export default function MonitoringPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor application performance, costs, and health metrics
          </p>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">
              All services operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">~200ms</div>
            <p className="text-xs text-muted-foreground">
              Average API response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2.45</div>
            <p className="text-xs text-muted-foreground">
              OpenAI usage today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              No active alerts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Monitoring Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">
            <BarChart3 className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="costs">
            <DollarSign className="h-4 w-4 mr-2" />
            OpenAI Costs
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="errors">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Error Tracking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceDashboard />
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <OpenAICostDashboard />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Monitoring</CardTitle>
              <CardDescription>
                Track security events and potential threats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Authentication Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Successful Logins (24h):</span>
                          <span className="font-mono">127</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Failed Attempts (24h):</span>
                          <span className="font-mono">3</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Account Lockouts:</span>
                          <span className="font-mono">0</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Security Headers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>HTTPS Enforcement:</span>
                          <span className="text-green-600 font-medium">✓ Active</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>CSRF Protection:</span>
                          <span className="text-green-600 font-medium">✓ Active</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>XSS Protection:</span>
                          <span className="text-green-600 font-medium">✓ Active</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Security Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      No security events in the last 24 hours. System is secure.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Tracking</CardTitle>
              <CardDescription>
                Monitor application errors and performance issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Error Rate (24h)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">0.02%</div>
                      <p className="text-sm text-muted-foreground">
                        2 errors out of 10,000 requests
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">
                        <div className="font-medium">Network timeout</div>
                        <div className="text-muted-foreground">Last occurred: 2 hours ago</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Resolution Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">~5min</div>
                      <p className="text-sm text-muted-foreground">
                        Average error resolution
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Errors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">Database connection timeout</div>
                          <div className="text-sm text-muted-foreground">
                            /api/orders • Server Component
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          2 hours ago
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">OpenAI API rate limit</div>
                          <div className="text-sm text-muted-foreground">
                            /api/transcribe • Voice Processing
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          4 hours ago
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Status Footer */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>
            Real-time status of all system components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Core Services</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Web Application:</span>
                  <span className="text-green-600 font-medium">Operational</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>API Gateway:</span>
                  <span className="text-green-600 font-medium">Operational</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Authentication:</span>
                  <span className="text-green-600 font-medium">Operational</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">External Services</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Supabase Database:</span>
                  <span className="text-green-600 font-medium">Operational</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>OpenAI API:</span>
                  <span className="text-green-600 font-medium">Operational</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Real-time Services:</span>
                  <span className="text-green-600 font-medium">Operational</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Monitoring</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Health Checks:</span>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Error Tracking:</span>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Performance Monitoring:</span>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}