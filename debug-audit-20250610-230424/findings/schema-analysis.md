=== DATABASE SCHEMA EVOLUTION ===
Migration Timeline Analysis:

Original Luis Tables (May 11-17):

- 20250511: RBAC setup
- 20250512: tables, seats
- 20250512: orders
- 20250517: profiles

Tables Added After Luis (May 27+):

- 20250527: KDS system tables ⚠️
- 20250529: table bulk operations
- 20250529: table positions
- 20250603: OpenAI optimization tables ⚠️
- 20250604: Monitoring system tables ⚠️

KDS Tables Created:

- kds_stations
- kds_order_routing
- kds_metrics (from migration)
- kds_voice_commands (from migration)
- kds_station_assignments (from migration)
- kds_display_configurations (from migration)

OpenAI Optimization Tables:

- transcription_cache
- openai_usage_metrics
- transcription_batch_queue
- transcription_batch_results
