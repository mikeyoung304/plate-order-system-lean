-- Voice Command History Table for Project Helios
-- Tracks all voice commands for analytics and debugging

CREATE TABLE IF NOT EXISTS voice_command_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  command text NOT NULL,
  original_transcript text,
  normalized_command text,
  action text,
  targets jsonb,
  confidence decimal(3,2),
  success boolean NOT NULL DEFAULT false,
  affected_items integer DEFAULT 0,
  processing_time_ms integer,
  execution_errors text[],
  feedback_message text,
  session_id text,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_command_history_user_id ON voice_command_history(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_command_history_created_at ON voice_command_history(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_command_history_action ON voice_command_history(action);
CREATE INDEX IF NOT EXISTS idx_voice_command_history_success ON voice_command_history(success);

-- RLS Policies
ALTER TABLE voice_command_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own command history
CREATE POLICY "Users can view own voice command history" ON voice_command_history
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own command history
CREATE POLICY "Users can insert own voice command history" ON voice_command_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all command history for analytics
CREATE POLICY "Admins can view all voice command history" ON voice_command_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Voice Command Analytics View for reporting
CREATE OR REPLACE VIEW voice_command_analytics AS
SELECT 
  user_id,
  action,
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as command_count,
  AVG(confidence) as avg_confidence,
  AVG(processing_time_ms) as avg_processing_time,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as success_count,
  SUM(affected_items) as total_affected_items,
  ARRAY_AGG(DISTINCT targets->0->>'type') as target_types
FROM voice_command_history
WHERE created_at >= now() - interval '7 days'
GROUP BY user_id, action, DATE_TRUNC('hour', created_at)
ORDER BY hour DESC, command_count DESC;

-- RLS for analytics view
ALTER VIEW voice_command_analytics OWNER TO service_role;

-- Grant permissions
GRANT SELECT ON voice_command_history TO authenticated;
GRANT INSERT ON voice_command_history TO authenticated;
GRANT SELECT ON voice_command_analytics TO authenticated;

-- Comment the table
COMMENT ON TABLE voice_command_history IS 'Stores voice command history for analytics and debugging';
COMMENT ON COLUMN voice_command_history.command IS 'Original command text from user';
COMMENT ON COLUMN voice_command_history.confidence IS 'AI confidence score (0.00-1.00)';
COMMENT ON COLUMN voice_command_history.targets IS 'JSON array of command targets (orders, tables, etc.)';
COMMENT ON COLUMN voice_command_history.metadata IS 'Additional processing metadata and metrics';