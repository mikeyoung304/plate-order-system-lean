-- OpenAI Optimization Tables
-- Adds caching and usage tracking for optimized transcription services

-- Transcription Cache Table
CREATE TABLE IF NOT EXISTS transcription_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audio_hash TEXT NOT NULL UNIQUE,
    transcription TEXT NOT NULL,
    extracted_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence REAL NOT NULL DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    use_count INTEGER NOT NULL DEFAULT 1,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Usage Tracking Table
CREATE TABLE IF NOT EXISTS openai_usage_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    operation TEXT NOT NULL CHECK (operation IN ('transcription', 'chat_completion', 'batch_processing')),
    model TEXT NOT NULL,
    input_tokens INTEGER,
    output_tokens INTEGER,
    audio_duration INTEGER, -- in milliseconds
    cost DECIMAL(10, 6) NOT NULL DEFAULT 0.0,
    cached BOOLEAN NOT NULL DEFAULT FALSE,
    optimized BOOLEAN NOT NULL DEFAULT FALSE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_transcription_cache_audio_hash ON transcription_cache(audio_hash);
CREATE INDEX IF NOT EXISTS idx_transcription_cache_created_at ON transcription_cache(created_at);
CREATE INDEX IF NOT EXISTS idx_transcription_cache_last_used ON transcription_cache(last_used);
CREATE INDEX IF NOT EXISTS idx_transcription_cache_use_count ON transcription_cache(use_count DESC);
CREATE INDEX IF NOT EXISTS idx_transcription_cache_confidence ON transcription_cache(confidence DESC);

CREATE INDEX IF NOT EXISTS idx_usage_metrics_user_id ON openai_usage_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_timestamp ON openai_usage_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_operation ON openai_usage_metrics(operation);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_model ON openai_usage_metrics(model);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_cost ON openai_usage_metrics(cost);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_cached ON openai_usage_metrics(cached);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_usage_metrics_user_timestamp ON openai_usage_metrics(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_operation_timestamp ON openai_usage_metrics(operation, timestamp DESC);

-- RLS Policies
ALTER TABLE transcription_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE openai_usage_metrics ENABLE ROW LEVEL SECURITY;

-- Cache table policies (global cache, all authenticated users can read/write)
CREATE POLICY "Authenticated users can read cache" ON transcription_cache
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert cache" ON transcription_cache
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update cache" ON transcription_cache
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- Cache cleanup policy (allow deletion of old entries)
CREATE POLICY "Allow cache cleanup" ON transcription_cache
    FOR DELETE TO authenticated
    USING (created_at < NOW() - INTERVAL '30 days');

-- Usage metrics policies (users can read their own data, admins can read all)
CREATE POLICY "Users can read own usage metrics" ON openai_usage_metrics
    FOR SELECT TO authenticated
    USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can insert own usage metrics" ON openai_usage_metrics
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- No update/delete policies for usage metrics (append-only for audit trail)

-- Functions for cache management
CREATE OR REPLACE FUNCTION increment_use_count()
RETURNS INTEGER
LANGUAGE SQL
AS $$
    SELECT use_count + 1;
$$;

-- Function to clean up old cache entries
CREATE OR REPLACE FUNCTION cleanup_old_cache_entries(retention_days INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM transcription_cache 
    WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- Function to get usage statistics
CREATE OR REPLACE FUNCTION get_usage_stats(
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ DEFAULT NOW(),
    target_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    total_requests BIGINT,
    successful_requests BIGINT,
    failed_requests BIGINT,
    total_cost DECIMAL,
    cache_hits BIGINT,
    cache_hit_rate DECIMAL,
    avg_latency DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE metadata->>'errorCode' IS NULL) as successful_requests,
        COUNT(*) FILTER (WHERE metadata->>'errorCode' IS NOT NULL) as failed_requests,
        COALESCE(SUM(cost), 0) as total_cost,
        COUNT(*) FILTER (WHERE cached = true) as cache_hits,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE cached = true)::DECIMAL / COUNT(*)) * 100, 2)
            ELSE 0 
        END as cache_hit_rate,
        COALESCE(AVG((metadata->>'latency')::DECIMAL), 0) as avg_latency
    FROM openai_usage_metrics
    WHERE 
        timestamp >= period_start 
        AND timestamp <= period_end
        AND (target_user_id IS NULL OR user_id = target_user_id);
END;
$$;

-- Trigger to automatically update last_used timestamp
CREATE OR REPLACE FUNCTION update_cache_last_used()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.last_used = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_transcription_cache_last_used
    BEFORE UPDATE ON transcription_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_cache_last_used();

-- Add comments for documentation
COMMENT ON TABLE transcription_cache IS 'Caches transcription results to reduce OpenAI API calls and costs';
COMMENT ON TABLE openai_usage_metrics IS 'Tracks OpenAI API usage for cost monitoring and optimization';

COMMENT ON COLUMN transcription_cache.audio_hash IS 'SHA-256 hash of audio file for deduplication';
COMMENT ON COLUMN transcription_cache.confidence IS 'Transcription confidence score (0.0-1.0)';
COMMENT ON COLUMN transcription_cache.use_count IS 'Number of times this cached result has been used';

COMMENT ON COLUMN openai_usage_metrics.operation IS 'Type of OpenAI operation (transcription, chat_completion, etc)';
COMMENT ON COLUMN openai_usage_metrics.cost IS 'Cost in USD for this operation';
COMMENT ON COLUMN openai_usage_metrics.cached IS 'Whether result was served from cache';
COMMENT ON COLUMN openai_usage_metrics.optimized IS 'Whether audio was optimized before processing';

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON transcription_cache TO authenticated;
GRANT SELECT, INSERT ON openai_usage_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_cache_entries TO authenticated;
GRANT EXECUTE ON FUNCTION get_usage_stats TO authenticated;