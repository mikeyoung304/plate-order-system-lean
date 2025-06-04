-- Monitoring System Database Tables
-- Creates tables for error tracking, metrics, and alerting

-- Error logs table for comprehensive error tracking
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level TEXT NOT NULL CHECK (level IN ('error', 'warn', 'info', 'debug')),
    message TEXT NOT NULL,
    stack TEXT,
    fingerprint TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    context JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    -- Indexes for efficient querying
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom metrics table for application-specific metrics
CREATE TABLE IF NOT EXISTS custom_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    session_id TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert rules table for configuring monitoring alerts
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    condition JSONB NOT NULL,
    actions JSONB NOT NULL DEFAULT '[]',
    enabled BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL
);

-- Alert history table for tracking fired alerts
CREATE TABLE IF NOT EXISTS alert_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_id UUID REFERENCES alert_rules(id) ON DELETE CASCADE,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_data JSONB NOT NULL DEFAULT '{}',
    actions_taken JSONB DEFAULT '[]',
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance metrics table for system performance tracking
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metric_type TEXT NOT NULL,
    value NUMERIC NOT NULL,
    tags JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_fingerprint ON error_logs(fingerprint);
CREATE INDEX IF NOT EXISTS idx_error_logs_level_timestamp ON error_logs(level, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_custom_metrics_event_type ON custom_metrics(event_type);
CREATE INDEX IF NOT EXISTS idx_custom_metrics_timestamp ON custom_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_custom_metrics_user_id ON custom_metrics(user_id);

CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON alert_rules(enabled) WHERE enabled = true;

CREATE INDEX IF NOT EXISTS idx_alert_history_rule_id ON alert_history(rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_triggered_at ON alert_history(triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_type_timestamp ON performance_metrics(metric_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_error_logs_updated_at 
    BEFORE UPDATE ON error_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_rules_updated_at 
    BEFORE UPDATE ON alert_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for monitoring tables
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Admin users can view and manage all monitoring data
CREATE POLICY "Admin full access to error_logs" ON error_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin full access to custom_metrics" ON custom_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin full access to alert_rules" ON alert_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin full access to alert_history" ON alert_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin full access to performance_metrics" ON performance_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Users can insert their own metrics and errors
CREATE POLICY "Users can insert own custom_metrics" ON custom_metrics
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can insert error_logs" ON error_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert custom_metrics" ON custom_metrics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert performance_metrics" ON performance_metrics
    FOR INSERT WITH CHECK (true);

-- Views for common monitoring queries
CREATE OR REPLACE VIEW error_summary AS
SELECT 
    fingerprint,
    level,
    message,
    COUNT(*) as occurrence_count,
    MAX(timestamp) as last_occurred,
    MIN(timestamp) as first_occurred,
    EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) / 3600 as hours_span
FROM error_logs
GROUP BY fingerprint, level, message
ORDER BY occurrence_count DESC;

CREATE OR REPLACE VIEW daily_error_counts AS
SELECT 
    DATE(timestamp) as date,
    level,
    COUNT(*) as count
FROM error_logs
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(timestamp), level
ORDER BY date DESC, level;

CREATE OR REPLACE VIEW active_alerts AS
SELECT 
    ar.id,
    ar.name,
    ar.description,
    ah.triggered_at,
    ah.event_data,
    ah.resolved_at
FROM alert_rules ar
JOIN alert_history ah ON ar.id = ah.rule_id
WHERE ar.enabled = true 
AND ah.resolved_at IS NULL
ORDER BY ah.triggered_at DESC;

-- Sample alert rules for common scenarios
INSERT INTO alert_rules (name, description, condition, actions) VALUES 
(
    'High Error Rate',
    'Alert when error rate exceeds 5% over 15 minutes',
    '{"type": "threshold", "field": "error", "operator": "gt", "value": 5, "timeWindow": 15}',
    '[{"type": "slack", "config": {"url": ""}}]'
),
(
    'Database Connection Failure',
    'Alert when database connection fails',
    '{"type": "pattern", "field": "message", "operator": "contains", "value": "database connection"}',
    '[{"type": "webhook", "config": {"url": ""}}]'
),
(
    'High OpenAI Costs',
    'Alert when daily OpenAI costs exceed budget',
    '{"type": "threshold", "field": "openai_cost", "operator": "gt", "value": 500, "timeWindow": 1440}',
    '[{"type": "slack", "config": {"url": ""}}]'
)
ON CONFLICT DO NOTHING;

-- Function to clean up old monitoring data
CREATE OR REPLACE FUNCTION cleanup_monitoring_data()
RETURNS void AS $$
BEGIN
    -- Delete error logs older than 90 days
    DELETE FROM error_logs 
    WHERE timestamp < NOW() - INTERVAL '90 days';
    
    -- Delete custom metrics older than 30 days  
    DELETE FROM custom_metrics 
    WHERE timestamp < NOW() - INTERVAL '30 days';
    
    -- Delete performance metrics older than 7 days
    DELETE FROM performance_metrics 
    WHERE timestamp < NOW() - INTERVAL '7 days';
    
    -- Delete resolved alert history older than 30 days
    DELETE FROM alert_history 
    WHERE resolved_at IS NOT NULL 
    AND resolved_at < NOW() - INTERVAL '30 days';
    
    RAISE NOTICE 'Monitoring data cleanup completed';
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON error_summary TO authenticated;
GRANT SELECT ON daily_error_counts TO authenticated;
GRANT SELECT ON active_alerts TO authenticated;

-- Comments for documentation
COMMENT ON TABLE error_logs IS 'Stores application errors and warnings for tracking and analysis';
COMMENT ON TABLE custom_metrics IS 'Stores custom application metrics and events';
COMMENT ON TABLE alert_rules IS 'Configuration for monitoring alerts and notifications';
COMMENT ON TABLE alert_history IS 'History of triggered alerts and their resolution';
COMMENT ON TABLE performance_metrics IS 'System performance metrics and measurements';

COMMENT ON VIEW error_summary IS 'Aggregated view of errors grouped by fingerprint';
COMMENT ON VIEW daily_error_counts IS 'Daily error counts by level for trend analysis';
COMMENT ON VIEW active_alerts IS 'Currently active (unresolved) alerts';

COMMENT ON FUNCTION cleanup_monitoring_data() IS 'Cleans up old monitoring data to manage storage';

-- Verify table creation
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'error_logs') THEN
        RAISE EXCEPTION 'Failed to create error_logs table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'custom_metrics') THEN
        RAISE EXCEPTION 'Failed to create custom_metrics table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alert_rules') THEN
        RAISE EXCEPTION 'Failed to create alert_rules table';
    END IF;
    
    RAISE NOTICE 'Monitoring system tables created successfully';
END $$;