# Full PostgreSQL Schema — All Tables

Database: postgres @ 86.48.23.38:5432

## api_logs (2074 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer | NO | nextval('api_logs_id_seq'::regclass) |
| endpoint | text | YES | — |
| method | text | YES | — |
| status | integer | YES | — |
| payload | jsonb | YES | — |
| response | jsonb | YES | — |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP |

## article_usage (0 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| article_id | uuid | NO | — |
| component_type | character varying | NO | — |
| component_id | text | NO | — |
| slot | integer | YES | 0 |
| created_at | timestamp without time zone | YES | now() |

## avatar_intelligence (0 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| status | character varying | YES | 'published'::character varying |
| avatar_key | character varying | YES | — |
| base_name | character varying | YES | — |
| wealth_cluster | character varying | YES | — |
| business_niches | jsonb | YES | — |
| data | jsonb | YES | — |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP |

## avatar_variants (1 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| avatar_key | character varying | YES | — |
| variant_type | character varying | YES | — |
| data | jsonb | YES | — |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP |

## campaign_masters (2 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| status | character varying | YES | 'active'::character varying |
| site_id | uuid | YES | — |
| name | character varying | NO | — |
| headline_spintax_root | text | YES | — |
| target_word_count | integer | YES | 1500 |
| niche_variables | jsonb | YES | — |
| date_created | timestamp without time zone | YES | CURRENT_TIMESTAMP |
| date_updated | timestamp without time zone | YES | CURRENT_TIMESTAMP |

## cartesian_patterns (1 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| pattern_key | character varying | YES | — |
| pattern_type | character varying | YES | — |
| data | jsonb | YES | — |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP |

## caw_articles (67 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| slug | text | NO | — |
| title | text | NO | — |
| excerpt | text | YES | — |
| content | text | NO | — |
| category | text | NO | 'infrastructure'::text |
| tags | jsonb | NO | '[]'::jsonb |
| author | text | NO | 'Chris Amaya'::text |
| og_image | text | YES | — |
| status | text | NO | 'draft'::text |
| published_at | timestamp with time zone | YES | — |
| created_at | timestamp with time zone | NO | now() |
| updated_at | timestamp with time zone | NO | now() |

## caw_content (33 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| slug | text | NO | — |
| title | text | NO | — |
| blocks | jsonb | NO | '[]'::jsonb |
| palette | text | NO | 'emerald'::text |
| nav | jsonb | YES | — |
| footer | jsonb | YES | — |
| local_seo | jsonb | YES | — |
| source | text | YES | 'seed'::text |
| created_at | timestamp with time zone | YES | now() |

## caw_seed (3 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| key | text | NO | — |
| value | jsonb | NO | — |

## content_fragments (93 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| status | character varying | YES | 'active'::character varying |
| campaign_id | uuid | YES | — |
| fragment_type | character varying | YES | — |
| content_body | text | YES | — |
| fragment_text | text | YES | — |
| word_count | integer | YES | — |
| date_created | timestamp without time zone | YES | CURRENT_TIMESTAMP |

## content_matrix (1800 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer | NO | nextval('content_matrix_id_seq'::regclass) |
| location_id | integer | YES | — |
| service_id | integer | YES | — |
| slug | text | YES | — |
| title | text | YES | — |
| meta_description | text | YES | — |
| content_json | jsonb | YES | — |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP |

## content_refresh_schedule (0 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| site_id | uuid | YES | — |
| campaign_id | uuid | YES | — |
| schedule_cron | character varying | NO | — |
| refresh_mode | character varying | YES | 'light'::character varying |
| min_age_days | integer | YES | 90 |
| last_run_at | timestamp without time zone | YES | — |
| next_run_at | timestamp without time zone | YES | — |
| is_active | boolean | YES | true |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP |

## conversions (0 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| site_id | uuid | YES | — |
| lead_id | integer | YES | — |
| conversion_type | character varying | YES | — |
| value | numeric | YES | — |
| source | character varying | YES | — |
| timestamp | timestamp without time zone | YES | now() |

## events (0 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| site_id | uuid | YES | — |
| event_name | character varying | NO | — |
| page_path | character varying | YES | — |
| session_id | character varying | YES | — |
| user_agent | text | YES | — |
| timestamp | timestamp without time zone | YES | now() |

## generated_articles (0 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| status | character varying | YES | 'queued'::character varying |
| site_id | uuid | YES | — |
| campaign_id | uuid | YES | — |
| title | character varying | YES | — |
| slug | character varying | YES | — |
| content | text | YES | — |
| html_content | text | YES | — |
| meta_title | character varying | YES | — |
| meta_description | text | YES | — |
| og_title | character varying | YES | — |
| og_description | text | YES | — |
| og_image | character varying | YES | — |
| canonical_url | text | YES | — |
| schema_json | jsonb | YES | — |
| generation_hash | character varying | YES | — |
| readability_score | numeric | YES | — |
| uniqueness_score | numeric | YES | — |
| is_published | boolean | YES | false |
| sync_status | character varying | YES | — |
| sitemap_status | character varying | YES | — |
| last_refreshed_at | timestamp without time zone | YES | — |
| refresh_count | integer | YES | 0 |
| date_created | timestamp without time zone | YES | CURRENT_TIMESTAMP |
| date_updated | timestamp without time zone | YES | CURRENT_TIMESTAMP |
| category | text | YES | — |
| tags | jsonb | YES | '[]'::jsonb |

## generation_jobs (1 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| status | character varying | YES | 'pending'::character varying |
| site_id | uuid | YES | — |
| campaign_id | uuid | YES | — |
| target_quantity | integer | YES | 10 |
| progress | integer | YES | 0 |
| filters | jsonb | YES | — |
| current_offset | integer | YES | 0 |
| source_type | character varying | YES | 'new'::character varying |
| source_article_ids | jsonb | YES | — |
| date_created | timestamp without time zone | YES | CURRENT_TIMESTAMP |

## geo_intelligence (50 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| cluster_key | character varying | YES | — |
| data | jsonb | YES | — |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP |

## headline_inventory (54 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| status | character varying | YES | 'active'::character varying |
| campaign_id | uuid | YES | — |
| final_title_text | text | YES | — |
| headline_text | character varying | YES | — |
| used_on_article | uuid | YES | — |
| date_created | timestamp without time zone | YES | CURRENT_TIMESTAMP |

## leads (8 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer | NO | nextval('leads_id_seq'::regclass) |
| source | text | YES | — |
| name | text | YES | — |
| email | text | YES | — |
| phone | text | YES | — |
| website | text | YES | — |
| revenue | text | YES | — |
| budget | text | YES | — |
| problem | text | YES | — |
| form_type | text | YES | — |
| data_json | jsonb | YES | — |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP |

## locations (50 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer | NO | nextval('locations_id_seq'::regclass) |
| city | text | NO | — |
| state | text | NO | — |
| zip | text | YES | — |
| neighborhood | text | YES | — |
| slug | text | YES | — |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP |

## offer_blocks (18 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| block_type | character varying | YES | — |
| avatar_key | character varying | YES | — |
| data | jsonb | YES | — |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP |

## page_blocks (49 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| block_type | character varying | YES | — |
| name | character varying | YES | — |
| data | jsonb | YES | — |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP |
| page_id | uuid | YES | — |
| sort_order | integer | YES | 0 |

## pages (17 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| status | character varying | YES | 'published'::character varying |
| site_id | uuid | YES | — |
| title | character varying | YES | — |
| slug | character varying | YES | — |
| content | text | YES | — |
| schema_json | jsonb | YES | — |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP |

## pageviews (0 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| site_id | uuid | YES | — |
| page_path | character varying | YES | — |
| session_id | character varying | YES | — |
| referrer | character varying | YES | — |
| user_agent | text | YES | — |
| timestamp | timestamp without time zone | YES | now() |

## posts (0 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| status | character varying | YES | 'published'::character varying |
| site_id | uuid | YES | — |
| title | character varying | YES | — |
| slug | character varying | YES | — |
| content | text | YES | — |
| excerpt | text | YES | — |
| schema_json | jsonb | YES | — |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP |
| published_at | timestamp without time zone | YES | — |

## pseo_services (36 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer | NO | nextval('pseo_services_id_seq'::regclass) |
| service_type | text | NO | — |
| sub_niche | text | YES | — |
| slug | text | YES | — |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP |

## scaling_survey_submissions (2 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer | NO | nextval('scaling_survey_submissions_id_seq'::regclass) |
| name | text | NO | — |
| email | text | NO | — |
| company | text | YES | — |
| role | text | YES | — |
| current_revenue | text | YES | — |
| target_revenue | text | YES | — |
| team_size | text | YES | — |
| industry | text | YES | — |
| challenges | jsonb | YES | — |
| marketing_spend | text | YES | — |
| channels | jsonb | YES | — |
| biggest_goal | text | YES | — |
| raw_data | jsonb | YES | — |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP |

## scheduled_tasks (1 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| site_id | uuid | YES | — |
| campaign_id | uuid | YES | — |
| task_type | character varying | YES | — |
| scheduled_at | timestamp without time zone | YES | — |
| status | character varying | YES | 'pending'::character varying |
| payload | jsonb | YES | — |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP |

## sites (1 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| status | character varying | YES | 'active'::character varying |
| name | character varying | NO | — |
| url | character varying | YES | — |
| date_created | timestamp without time zone | YES | CURRENT_TIMESTAMP |
| date_updated | timestamp without time zone | YES | CURRENT_TIMESTAMP |
| theme_config | jsonb | YES | — |

## spintax_dictionaries (18 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| category | character varying | NO | — |
| data | jsonb | NO | '[]'::jsonb |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP |

## synonym_groups (21 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| category | character varying | NO | — |
| terms | jsonb | NO | '[]'::jsonb |
| created_at | timestamp without time zone | YES | CURRENT_TIMESTAMP |

## work_log (0 rows)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| site_id | uuid | YES | — |
| action | character varying | NO | — |
| entity_type | character varying | YES | — |
| entity_id | uuid | YES | — |
| details | jsonb | YES | — |
| level | character varying | YES | 'info'::character varying |
| status | character varying | YES | — |
| user_id | uuid | YES | — |
| timestamp | timestamp without time zone | YES | now() |

