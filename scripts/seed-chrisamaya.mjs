#!/usr/bin/env node
/**
 * chrisamaya.work seed script — direct Postgres, no god-mode API.
 * Run: DATABASE_URL=... node scripts/seed-chrisamaya.mjs
 */
import pg from 'pg';

const { Pool } = pg;

const DEFAULT_THEME = {
  palette: 'emerald',
  cdn_provider: 'cloudflare',
  cdn_config: {},
  site_name: 'Chris Amaya',
  content_structure: { section_ids: { hero: 'hero', about: 'about', services: 'services', faq: 'faq', contact: 'contact', calculator: 'calculator', survey: 'survey' } },
  scripts: ['scroll-progress', 'particles', 'animation-observer'],
  nav: {
    portfolio: [
      { name: 'About Me', href: '/#about' },
      { name: 'Projects', href: '/#projects' },
      { name: 'Blog', href: '/blog' },
      { name: 'How I Build', href: '/guide/how-i-build' },
      { name: 'Knowledge Base', href: '/knowledge-base' },
      { name: 'Search', href: '/search' },
      { name: 'Contact', href: '/#contact' },
    ],
    custom_apps: [
      { name: 'Python & FastAPI', href: '/services/custom-apps/python-api' },
      { name: 'Astro & React', href: '/services/custom-apps/frontend' },
      { name: 'Full-Stack', href: '/services/custom-apps/full-stack' },
      { name: 'PostgreSQL', href: '/services/custom-apps/database' },
      { name: 'Google APIs', href: '/services/custom-apps/google-apis' },
      { name: 'WordPress', href: '/services/custom-apps/wordpress' },
      { name: 'Calculators', href: '/services/custom-apps/calculators' },
      { name: '3D & Visual', href: '/services/custom-apps/3d-visual' },
    ],
    growth_tools: [],
    cta: { label: 'Work With Me', href: '#contact' },
  },
  footer: { tagline: 'The Unicorn Developer.', copyright: 'Chris Amaya' },
};

const LOCATIONS = [
  { city: 'Austin', state: 'TX', zip: '73301', slug: 'austin-tx' },
  { city: 'Dallas', state: 'TX', zip: '75201', slug: 'dallas-tx' },
  { city: 'Houston', state: 'TX', zip: '77001', slug: 'houston-tx' },
  { city: 'San Antonio', state: 'TX', zip: '78201', slug: 'san-antonio-tx' },
  { city: 'Fort Worth', state: 'TX', zip: '76101', slug: 'fort-worth-tx' },
  { city: 'Miami', state: 'FL', zip: '33101', slug: 'miami-fl' },
  { city: 'Orlando', state: 'FL', zip: '32801', slug: 'orlando-fl' },
  { city: 'Tampa', state: 'FL', zip: '33601', slug: 'tampa-fl' },
  { city: 'Jacksonville', state: 'FL', zip: '32201', slug: 'jacksonville-fl' },
  { city: 'Atlanta', state: 'GA', zip: '30301', slug: 'atlanta-ga' },
  { city: 'Phoenix', state: 'AZ', zip: '85001', slug: 'phoenix-az' },
  { city: 'Denver', state: 'CO', zip: '80201', slug: 'denver-co' },
  { city: 'Las Vegas', state: 'NV', zip: '89101', slug: 'las-vegas-nv' },
  { city: 'Charlotte', state: 'NC', zip: '28201', slug: 'charlotte-nc' },
  { city: 'Raleigh', state: 'NC', zip: '27601', slug: 'raleigh-nc' },
  { city: 'Nashville', state: 'TN', zip: '37201', slug: 'nashville-tn' },
  { city: 'Chicago', state: 'IL', zip: '60601', slug: 'chicago-il' },
  { city: 'Seattle', state: 'WA', zip: '98101', slug: 'seattle-wa' },
  { city: 'Portland', state: 'OR', zip: '97201', slug: 'portland-or' },
  { city: 'San Diego', state: 'CA', zip: '92101', slug: 'san-diego-ca' },
  { city: 'Los Angeles', state: 'CA', zip: '90001', slug: 'los-angeles-ca' },
  { city: 'San Francisco', state: 'CA', zip: '94101', slug: 'san-francisco-ca' },
  { city: 'San Jose', state: 'CA', zip: '95101', slug: 'san-jose-ca' },
  { city: 'Columbus', state: 'OH', zip: '43201', slug: 'columbus-oh' },
  { city: 'Indianapolis', state: 'IN', zip: '46201', slug: 'indianapolis-in' },
  { city: 'Minneapolis', state: 'MN', zip: '55401', slug: 'minneapolis-mn' },
  { city: 'Detroit', state: 'MI', zip: '48201', slug: 'detroit-mi' },
  { city: 'Philadelphia', state: 'PA', zip: '19101', slug: 'philadelphia-pa' },
  { city: 'Boston', state: 'MA', zip: '02101', slug: 'boston-ma' },
  { city: 'New York', state: 'NY', zip: '10001', slug: 'new-york-ny' },
  { city: 'Washington', state: 'DC', zip: '20001', slug: 'washington-dc' },
  { city: 'Baltimore', state: 'MD', zip: '21201', slug: 'baltimore-md' },
  { city: 'Richmond', state: 'VA', zip: '23219', slug: 'richmond-va' },
  { city: 'Salt Lake City', state: 'UT', zip: '84101', slug: 'salt-lake-city-ut' },
  { city: 'Kansas City', state: 'MO', zip: '64101', slug: 'kansas-city-mo' },
  { city: 'St. Louis', state: 'MO', zip: '63101', slug: 'st-louis-mo' },
  { city: 'Milwaukee', state: 'WI', zip: '53201', slug: 'milwaukee-wi' },
  { city: 'Cleveland', state: 'OH', zip: '44101', slug: 'cleveland-oh' },
  { city: 'Cincinnati', state: 'OH', zip: '45201', slug: 'cincinnati-oh' },
  { city: 'Pittsburgh', state: 'PA', zip: '15201', slug: 'pittsburgh-pa' },
  { city: 'Raleigh-Durham', state: 'NC', zip: '27601', slug: 'raleigh-durham-nc' },
  { city: 'Austin-Round Rock', state: 'TX', zip: '78701', slug: 'austin-round-rock-tx' },
  { city: 'Boulder', state: 'CO', zip: '80301', slug: 'boulder-co' },
  { city: 'Ann Arbor', state: 'MI', zip: '48103', slug: 'ann-arbor-mi' },
  { city: 'Durham', state: 'NC', zip: '27701', slug: 'durham-nc' },
  { city: 'Madison', state: 'WI', zip: '53701', slug: 'madison-wi' },
  { city: 'Omaha', state: 'NE', zip: '68101', slug: 'omaha-ne' },
  { city: 'Des Moines', state: 'IA', zip: '50301', slug: 'des-moines-ia' },
  { city: 'Boise', state: 'ID', zip: '83701', slug: 'boise-id' },
  { city: 'Albuquerque', state: 'NM', zip: '87101', slug: 'albuquerque-nm' },
];

const PSEO_SERVICES = [
  { service_type: 'Custom SaaS', sub_niche: 'Development', slug: 'custom-saas-development' },
  { service_type: 'Private AI', sub_niche: 'Automation System', slug: 'private-ai-automation-system' },
  { service_type: 'Zapier', sub_niche: 'Replacement Workflow', slug: 'zapier-replacement-workflow' },
  { service_type: 'Headless', sub_niche: 'CMS Architecture', slug: 'headless-cms-architecture' },
  { service_type: 'Programmatic SEO', sub_niche: 'Engine', slug: 'programmatic-seo-engine' },
  { service_type: 'Full-Stack', sub_niche: 'Unicorn App', slug: 'full-stack-unicorn-app' },
  { service_type: 'AI-Powered', sub_niche: 'Business Automation', slug: 'ai-powered-business-automation' },
  { service_type: 'Headless', sub_niche: 'E-commerce', slug: 'headless-ecommerce' },
  { service_type: 'API-First', sub_niche: 'Backend', slug: 'api-first-backend' },
  { service_type: 'Serverless', sub_niche: 'Infrastructure', slug: 'serverless-infrastructure' },
  { service_type: 'Edge', sub_niche: 'Rendering', slug: 'edge-rendering' },
  { service_type: 'AI Agents', sub_niche: 'Integration', slug: 'ai-agents-integration' },
  { service_type: 'Data Pipeline', sub_niche: 'Automation', slug: 'data-pipeline-automation' },
  { service_type: 'Revenue Engine', sub_niche: 'SaaS', slug: 'revenue-engine-saas' },
  { service_type: 'Private AI', sub_niche: 'System Build', slug: 'private-ai-system-build' },
  { service_type: 'Zapier', sub_niche: 'Native Replacement', slug: 'zapier-native-replacement' },
  { service_type: 'Custom Dashboard', sub_niche: 'B2B', slug: 'custom-dashboard-b2b' },
  { service_type: 'Integrations', sub_niche: 'Hub', slug: 'integrations-hub' },
  { service_type: 'Workflow', sub_niche: 'Orchestration', slug: 'workflow-orchestration' },
  { service_type: 'CRM', sub_niche: 'Transformation', slug: 'crm-transformation' },
  { service_type: 'Funnel', sub_niche: 'Architecture', slug: 'funnel-architecture' },
  { service_type: 'Paid', sub_niche: 'Acquisition', slug: 'paid-acquisition' },
  { service_type: 'Growth', sub_niche: 'Retainer', slug: 'growth-retainer' },
  { service_type: 'Authority', sub_niche: 'Engine', slug: 'authority-engine' },
  { service_type: 'Data', sub_niche: 'Attribution', slug: 'data-attribution' },
  { service_type: 'Unicorn', sub_niche: 'Developer Day', slug: 'unicorn-developer-day' },
  { service_type: 'AI', sub_niche: 'Architecture Audit', slug: 'ai-architecture-audit' },
  { service_type: 'Technical', sub_niche: 'Strategy Session', slug: 'technical-strategy-session' },
  { service_type: 'Programmatic', sub_niche: 'Content Factory', slug: 'programmatic-content-factory' },
  { service_type: 'Headless', sub_niche: 'Migration', slug: 'headless-migration' },
  { service_type: 'Automation', sub_niche: 'Blueprint', slug: 'automation-blueprint' },
  { service_type: 'AI Readiness', sub_niche: 'Assessment', slug: 'ai-readiness-assessment' },
  { service_type: 'Revenue', sub_niche: 'Pipeline Build', slug: 'revenue-pipeline-build' },
  { service_type: 'Custom Integrations', sub_niche: 'Development', slug: 'custom-integrations-development' },
  { service_type: 'MVP', sub_niche: 'Development', slug: 'mvp-development' },
  { service_type: 'Scale-Up', sub_niche: 'Architecture', slug: 'scale-up-architecture' },
];

const SYNONYM_GROUPS = [
  { category: 'grow', terms: ['scale', 'explode', 'multiply', 'skyrocket', 'accelerate', 'supercharge', 'dominate', '10x', 'elevate', 'optimize', 'amplify', 'revolutionize', 'transform', 'catapult', 'turbocharge', 'ignite', 'propel', 'hypergrow', 'thrive', 'flourish'] },
  { category: 'unicorn', terms: ['one-stop architect', 'unicorn developer', 'full-stack genius', 'AI-native builder', 'automation god', 'private AI engineer', 'headless wizard', 'SaaS visionary', 'Zapier slayer', 'programmatic master', 'revenue architect', 'AI systems builder', 'custom SaaS creator', 'enterprise automation hero', '10x developer'] },
  { category: 'software', terms: ['SaaS platform', 'web application', 'digital product', 'custom software', 'tech stack', 'web architecture', 'cloud solution', 'enterprise system', 'private AI system', 'headless CMS', 'automation engine', 'revenue machine', 'business OS', 'AI workflow', 'custom dashboard'] },
];

const SPINTAX = [
  { category: 'b2b_pain_points', data: ['Tired of being your own CTO?', 'Still glued to Zapier every Monday?', 'Manual workflows eating 20 hours/week?'] },
  { category: 'tech_value_props', data: ['We engineer private AI systems that run while you sleep.', 'Our headless architecture delivers perfect Core Web Vitals.'] },
  { category: 'urgency_hooks', data: ['The digital landscape is shifting fast.', 'Your competitors aren\'t waiting.'] },
];

const CONTENT_FRAGMENTS = [
  ['intro_hook', '{b2b_pain_points} If you\'re still managing 47 Zapier zaps manually, it\'s time to {grow} with a true {unicorn} who builds {software} that actually prints money while you sleep.'],
  ['intro_hook', 'In {City}\'s competitive tech scene, slow automation is death. {urgency_hooks} Let a {unicorn} rebuild your entire {pipeline}.'],
  ['hero_section', '## The {City} Unicorn Developer Building Private AI Systems That Replace Entire Departments'],
];

const HEADLINES = [
  ['h1', 'The Unicorn Developer Who Builds {Private AI Systems|Custom SaaS} That {10x|Replace} Your Entire Operations in {City}'],
  ['h1', 'Private AI Systems & Zapier Replacements Built {fast} in 14 Days for {City} Businesses'],
  ['h2', 'Why Most B2B Teams Lose $187k/Year on Broken Automation'],
];

const OFFER_BLOCKS = [
  { block_type: 'unicorn_readiness_survey', data: { headline: 'Free 90-Second Unicorn Readiness Survey', button_text: 'Start Survey Now', form_fields: ['Name', 'Email', 'Company', 'Biggest Bottleneck'] } },
  { block_type: 'ai_architecture_audit', data: { headline: 'Claim Your Private AI Architecture Audit', button_text: 'Get Audit', form_fields: ['URL', 'Email'] } },
  { block_type: 'cta', data: { headline: 'Get a Free Quote Today', button_text: 'Get Free Quote', form_action: '/api/submit-lead' } },
];

function geoForSlug(slug) {
  const parts = slug.split('-');
  const city = (parts.slice(0, -1).join(' ') || 'Austin').replace(/\b\w/g, c => c.toUpperCase());
  const state = (parts[parts.length - 1] || 'TX').toUpperCase();
  return { city, state, county: city + ' County', landmark: city + ' Downtown', tech_scene_description: `Growing tech ecosystem in ${city}, ${state}`, notable_companies: 'Scale-ups and enterprises', local_pain_points: 'Manual workflows, legacy systems, scaling challenges' };
}

const CORE_PAGES = [
  ['about', 'About | Chris Amaya', [['hero', { badge: 'ABOUT', headline: 'About Chris Amaya', subhead: 'The Unicorn Developer.', cta_label: 'Get Started', cta_href: '#contact' }], ['cta', { heading: 'Ready to Start?', text: 'Let\'s build together.', label: 'Book a Call', href: '#contact' }]]],
  ['contact', 'Contact | Chris Amaya', [['hero', { badge: 'GET IN TOUCH', headline: 'Let\'s Build Together', subhead: 'Book a technical strategy session. No pitch.', cta_label: 'Book Consultation', cta_href: '#contact-form' }], ['cta', { heading: 'Ready to Start?', text: 'Fill out the form below or book a call.', label: 'Book a Call', href: '#contact-form' }]]],
  ['audit', 'Technical Audit | Chris Amaya', [['hero', { badge: 'FREE AUDIT', headline: 'Get Your AI Architecture Audit', subhead: '90 seconds. Custom roadmap. No pitch.', cta_label: 'Start Audit', cta_href: '#contact' }], ['cta', { heading: 'Claim Your Free Audit', text: 'See how we can replace Zapier and scale your stack.', label: 'Get Audit', href: '#contact' }]]],
  ['terms', 'Terms of Service | Chris Amaya', [['value_prop', { title: 'Terms of Service', body: 'Terms of service content. Update via admin.' }]]],
  ['privacy', 'Privacy Policy | Chris Amaya', [['value_prop', { title: 'Privacy Policy', body: 'Privacy policy content. Update via admin.' }]]],
  ['services', 'Services | Chris Amaya', [['hero', { badge: 'SERVICES', headline: 'What I Build', subhead: 'Custom SaaS, Private AI, Headless CMS, and more.', cta_label: 'Get Started', cta_href: '#contact' }], ['cta', { heading: 'Ready to Build?', text: 'Let\'s discuss your project.', label: 'Book a Call', href: '#contact' }]]],
  ['resources/calculators', 'Calculators | Chris Amaya', [['hero', { badge: 'TOOLS', headline: 'Growth Calculators', subhead: 'ROAS, CAC, LTV, and more.', cta_label: 'Start Calculating', cta_href: '#calculators' }], ['calculator', { section_title: 'Engineering Resources' }]]],
  ['guide/how-i-build', 'How I Build | Chris Amaya', [['hero', { badge: 'METHODOLOGY', headline: 'How I Build', subhead: 'From discovery to deployment.', cta_label: 'Get Started', cta_href: '#contact' }], ['value_prop', { title: 'The Unicorn Process', body: 'Discovery → Design → Deploy. I build production-grade systems in under 14 days.' }], ['cta', { heading: 'Ready to Build?', text: 'Let\'s discuss your project.', label: 'Book a Call', href: '#contact' }]]],
];

const OFFER_PAGES = [
  ['services/custom-apps/python-api', 'Python & FastAPI | Custom Backend | Chris Amaya', [['hero', { badge: 'BACKEND', headline: 'Python & FastAPI Custom APIs', subhead: 'Async PostgreSQL, REST, and automation backends built for scale.', cta_label: 'Discuss Your API', cta_href: '#contact' }], ['value_prop', { title: 'Production-Grade Python Backends', body: 'FastAPI, asyncpg, and PostgreSQL — the same stack powering God Mode.' }], ['cta', { heading: 'Need a Custom Backend?', text: 'Let\'s scope your API.', label: 'Book a Call', href: '#contact' }]]],
  ['services/custom-apps/frontend', 'Astro, React & Vite | Custom Frontend | Chris Amaya', [['hero', { badge: 'FRONTEND', headline: 'Astro, React & Vite Apps', subhead: 'SSR, Tailwind, Framer Motion. Marketing sites and dashboards.', cta_label: 'Get Started', cta_href: '#contact' }], ['value_prop', { title: 'Modern Frontend Stack', body: 'Astro for content, React for interactivity, Vite for speed.' }], ['cta', { heading: 'Ready for a Custom Frontend?', text: 'Let\'s build it.', label: 'Book a Call', href: '#contact' }]]],
  ['services/custom-apps/full-stack', 'Full-Stack Astro + FastAPI | Chris Amaya', [['hero', { badge: 'FULL-STACK', headline: 'Astro + FastAPI Full-Stack', subhead: 'SSR, multi-tenant, DB-driven. The God Mode template.', cta_label: 'Discuss Your Stack', cta_href: '#contact' }], ['value_prop', { title: 'DB-Driven Multi-Tenant Apps', body: 'Same architecture as chrisamaya.work. Routes in Astro, content from PostgreSQL.' }], ['cta', { heading: 'Build Your Full-Stack App', text: 'Let\'s talk architecture.', label: 'Book a Call', href: '#contact' }]]],
  ['services/custom-apps/database', 'PostgreSQL & Database Design | Chris Amaya', [['hero', { badge: 'DATABASE', headline: 'PostgreSQL Schema & Migrations', subhead: 'Schema design, migrations, optimization. Built for scale.', cta_label: 'Discuss Your Schema', cta_href: '#contact' }], ['value_prop', { title: 'Production Database Design', body: 'Schema design, indexes, asyncpg integration.' }], ['cta', { heading: 'Database Design Help?', text: 'Let\'s design it right.', label: 'Book a Call', href: '#contact' }]]],
  ['services/custom-apps/google-apis', 'Google Solar, Roofing & Maps API | Chris Amaya', [['hero', { badge: 'GOOGLE APIS', headline: 'Solar, Roofing & Maps Integration', subhead: 'Custom apps using Google Solar API, Roofing API, Maps, Places, Geocoding.', cta_label: 'Explore Integrations', cta_href: '#contact' }], ['value_prop', { title: 'Google APIs for Your Product', body: 'Solar potential, rooftop data, maps, directions, places.' }], ['cta', { heading: 'Need Google API Integration?', text: 'Let\'s build it.', label: 'Book a Call', href: '#contact' }]]],
  ['services/custom-apps/wordpress', 'Headless WordPress & Custom Plugins | Chris Amaya', [['hero', { badge: 'WORDPRESS', headline: 'Headless WordPress & Custom Development', subhead: 'REST API, GraphQL, custom themes, plugins, WooCommerce.', cta_label: 'Discuss Your WP', cta_href: '#contact' }], ['value_prop', { title: 'WordPress as a Headless CMS', body: 'Use WordPress for content, Astro/React for frontend.' }], ['cta', { heading: 'WordPress Project?', text: 'Let\'s modernize it.', label: 'Book a Call', href: '#contact' }]]],
  ['services/custom-apps/calculators', 'React Calculators & Interactive Tools | Chris Amaya', [['hero', { badge: 'TOOLS', headline: 'Custom Calculators & Interactive Tools', subhead: 'ROAS, CAC, LTV, forecasts. React calculators and dashboards.', cta_label: 'Build a Calculator', cta_href: '#contact' }], ['value_prop', { title: 'Lead-Magnet Calculators', body: 'ROAS, funnel, LTV calculators. Custom interactive tools that capture leads.' }], ['cta', { heading: 'Need a Custom Calculator?', text: 'Let\'s build it.', label: 'Book a Call', href: '#contact' }]]],
  ['services/custom-apps/3d-visual', 'Three.js, Rive & 3D Visual | Chris Amaya', [['hero', { badge: '3D & VISUAL', headline: 'Three.js, Rive & Spline', subhead: '3D web experiences, animations, interactive visuals.', cta_label: 'Discuss Your Vision', cta_href: '#contact' }], ['value_prop', { title: '3D and Motion on the Web', body: 'Three.js for 3D, Rive for interactive animation, Spline for design-to-3D.' }], ['cta', { heading: '3D or Motion Project?', text: 'Let\'s create it.', label: 'Book a Call', href: '#contact' }]]],
];

const HOMEPAGE_BLOCKS = [
  ['hero', 0, { badge: 'THE ONE-STOP ARCHITECT', headline: 'STOP GLUING YOUR BUSINESS <br class="hidden md:block" />TOGETHER WITH <span class="bg-clip-text text-transparent bg-gradient-to-r from-[#00FF94] to-[#00B8FF]">ZAPIER AND HOPE.</span>', subhead: 'I am the "Unicorn" Developer you\'ve been looking for. I build full-stack applications, engineer private AI systems, and automate your entire backend—so you can stop playing CTO and start being the CEO.', cta_label: 'Book Consultation', cta_href: '#contact', warning_text: 'WARNING: THIS IS A TECHNICAL STRATEGY SESSION. NOT A SALES CALL.' }],
  ['diagnosis', 1, { eyebrow: 'THE DIAGNOSIS', title: 'The "Frankenstein" Problem', body: 'You have product-market fit. You have revenue. But your backend is a tangled mess of disconnected tools that break every time an API updates.', warning_box: { title: '⚠ SYSTEM CRITICAL', text: 'Your business is fragile. You are one "Zapier Error" away from losing leads.' }, video_src: '/assets/videos/zombiebabyzaiper.mp4', video_poster: '/assets/videos/zombiebabyzaiper-poster.jpg', fig_label: 'FIG 1.0: FRAGMENTATION VISUALIZED' }],
  ['calculator', 2, { section_title: 'Engineering Resources' }],
  ['survey', 3, { section_title: 'Let\'s Build It Right.' }],
];

async function runSeed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  const counts = {};

  try {
    // 1. Site
    let siteId;
    const siteRow = await client.query("SELECT id FROM sites WHERE url ILIKE '%chrisamaya.work%' LIMIT 1");
    if (siteRow.rows[0]) {
      siteId = siteRow.rows[0].id;
      await client.query(
        'UPDATE sites SET theme_config = $1::jsonb, name = $2, status = $3 WHERE id = $4::uuid',
        [JSON.stringify(DEFAULT_THEME), 'chrisamaya', 'active', siteId]
      );
    } else {
      const ins = await client.query(
        "INSERT INTO sites (name, url, status, theme_config) VALUES ('chrisamaya', 'https://chrisamaya.work', 'active', $1::jsonb) RETURNING id",
        [JSON.stringify(DEFAULT_THEME)]
      );
      siteId = ins.rows[0].id;
    }
    counts.site = 1;

    // 2. Campaign
    const nicheVars = JSON.stringify({ refresh_mode: 'light', uniqueness_target: 82 });
    const spintaxRoot = '{Ready to|Want to|Need to} {build|launch|scale|automate} your {Custom SaaS|Private AI System|Unicorn App} {in|for} {City}?';
    let campaignId;
    const campRow = await client.query('SELECT id FROM campaign_masters WHERE site_id = $1::uuid AND name = $2 LIMIT 1', [siteId, 'Unicorn Developer']);
    if (campRow.rows[0]) {
      campaignId = campRow.rows[0].id;
      await client.query('UPDATE campaign_masters SET headline_spintax_root = $1, target_word_count = 2000, niche_variables = $2::jsonb WHERE id = $3::uuid', [spintaxRoot, nicheVars, campaignId]);
    } else {
      const ins = await client.query(
        'INSERT INTO campaign_masters (site_id, name, status, headline_spintax_root, target_word_count, niche_variables) VALUES ($1::uuid, $2, $3, $4, $5, $6::jsonb) RETURNING id',
        [siteId, 'Unicorn Developer', 'active', spintaxRoot, 2000, nicheVars]
      );
      campaignId = ins.rows[0].id;
    }
    counts.campaign = 1;

    // 3. Locations
    for (const loc of LOCATIONS) {
      await client.query(
        'INSERT INTO locations (city, state, zip, slug) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO UPDATE SET city = EXCLUDED.city, state = EXCLUDED.state, zip = EXCLUDED.zip',
        [loc.city, loc.state, loc.zip || null, loc.slug]
      );
    }
    counts.locations = LOCATIONS.length;

    // 4. pseo_services
    for (const svc of PSEO_SERVICES) {
      await client.query(
        'INSERT INTO pseo_services (service_type, sub_niche, slug) VALUES ($1, $2, $3) ON CONFLICT (slug) DO UPDATE SET service_type = EXCLUDED.service_type, sub_niche = EXCLUDED.sub_niche',
        [svc.service_type, svc.sub_niche || null, svc.slug]
      );
    }
    counts.pseo_services = PSEO_SERVICES.length;

    // 5. Synonym groups
    for (const item of SYNONYM_GROUPS) {
      const n = await client.query('SELECT COUNT(*) FROM synonym_groups WHERE category = $1', [item.category]);
      if (Number(n.rows[0].count) === 0) {
        await client.query('INSERT INTO synonym_groups (category, terms) VALUES ($1, $2::jsonb)', [item.category, JSON.stringify(item.terms)]);
      }
    }
    counts.synonym_groups = SYNONYM_GROUPS.length;

    // 6. Spintax
    for (const item of SPINTAX) {
      const n = await client.query('SELECT COUNT(*) FROM spintax_dictionaries WHERE category = $1', [item.category]);
      if (Number(n.rows[0].count) === 0) {
        await client.query('INSERT INTO spintax_dictionaries (category, data) VALUES ($1, $2::jsonb)', [item.category, JSON.stringify(item.data)]);
      }
    }
    counts.spintax = SPINTAX.length;

    // 7. Content fragments
    const nFrag = await client.query('SELECT COUNT(*) FROM content_fragments WHERE campaign_id = $1::uuid', [campaignId]);
    if (Number(nFrag.rows[0].count) < 50) {
      for (const [ftype, body] of CONTENT_FRAGMENTS) {
        await client.query('INSERT INTO content_fragments (campaign_id, fragment_type, content_body, fragment_text, status) VALUES ($1::uuid, $2, $3, $3, $4)', [campaignId, ftype, body, 'active']);
      }
    }
    counts.content_fragments = CONTENT_FRAGMENTS.length;

    // 8. Headlines
    const nHl = await client.query('SELECT COUNT(*) FROM headline_inventory WHERE campaign_id = $1::uuid', [campaignId]);
    if (Number(nHl.rows[0].count) < 30) {
      for (const [, text] of HEADLINES) {
        await client.query('INSERT INTO headline_inventory (campaign_id, headline_text, status) VALUES ($1::uuid, $2, $3)', [campaignId, text, 'active']);
      }
    }
    counts.headlines = HEADLINES.length;

    // 9. Offer blocks
    const nOffer = await client.query('SELECT COUNT(*) FROM offer_blocks');
    if (Number(nOffer.rows[0].count) < 18) {
      for (const item of OFFER_BLOCKS) {
        await client.query('INSERT INTO offer_blocks (block_type, data) VALUES ($1, $2::jsonb)', [item.block_type, JSON.stringify(item.data)]);
      }
    }
    counts.offer_blocks = OFFER_BLOCKS.length;

    // 10. geo_intelligence
    for (const loc of LOCATIONS) {
      const data = geoForSlug(loc.slug);
      const exists = await client.query('SELECT 1 FROM geo_intelligence WHERE cluster_key = $1 LIMIT 1', [loc.slug]);
      if (!exists.rows[0]) {
        await client.query('INSERT INTO geo_intelligence (cluster_key, data) VALUES ($1, $2::jsonb)', [loc.slug, JSON.stringify(data)]);
      }
    }
    counts.geo_intelligence = LOCATIONS.length;

    // 11. content_matrix
    const locRows = await client.query('SELECT id, slug FROM locations WHERE slug = ANY($1::text[])', [LOCATIONS.map(l => l.slug)]);
    const svcRows = await client.query('SELECT id, slug FROM pseo_services WHERE slug = ANY($1::text[])', [PSEO_SERVICES.map(s => s.slug)]);
    const locBySlug = Object.fromEntries(locRows.rows.map(r => [r.slug, r.id]));
    const svcBySlug = Object.fromEntries(svcRows.rows.map(r => [r.slug, r.id]));
    for (const loc of LOCATIONS) {
      const locId = locBySlug[loc.slug];
      if (!locId) continue;
      for (const svc of PSEO_SERVICES) {
        const svcId = svcBySlug[svc.slug];
        if (!svcId) continue;
        const cmSlug = `${svc.slug}-${loc.slug}`;
        const title = `${svc.service_type} ${svc.sub_niche || ''} in ${loc.city}, ${loc.state}`.trim();
        const meta = `Find ${svc.service_type} ${svc.sub_niche || ''} in ${loc.city}, ${loc.state}. Expert solutions. Book a free audit.`;
        await client.query(
          'INSERT INTO content_matrix (location_id, service_id, slug, title, meta_description) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (slug) DO NOTHING',
          [locId, svcId, cmSlug, title, meta]
        );
      }
    }
    const cmCount = await client.query('SELECT COUNT(*) FROM content_matrix');
    counts.content_matrix = Number(cmCount.rows[0].count);

    // 12. Homepage + blocks
    let pageRow = await client.query('SELECT id FROM pages WHERE site_id = $1::uuid AND (slug = $2 OR slug IS NULL) LIMIT 1', [siteId, '']);
    if (!pageRow.rows[0]) {
      pageRow = await client.query(
        "INSERT INTO pages (site_id, title, slug, status) VALUES ($1::uuid, $2, $3, $4) RETURNING id",
        [siteId, 'The One-Stop Architect | Chris Amaya', '', 'published']
      );
    }
    const pageId = pageRow.rows[0].id;
    const nBlocks = await client.query('SELECT COUNT(*) FROM page_blocks WHERE page_id = $1::uuid', [pageId]);
    if (Number(nBlocks.rows[0].count) === 0) {
      for (const [blockType, sortOrder, data] of HOMEPAGE_BLOCKS) {
        await client.query('INSERT INTO page_blocks (page_id, block_type, data, sort_order) VALUES ($1::uuid, $2, $3::jsonb, $4)', [pageId, blockType, JSON.stringify(data), sortOrder]);
      }
    }
    counts.pages = 1;
    counts.page_blocks = HOMEPAGE_BLOCKS.length;

    // 13–14. Core + offer pages
    for (const [slug, title, blockSpecs] of [...CORE_PAGES, ...OFFER_PAGES]) {
      const existing = await client.query('SELECT id FROM pages WHERE site_id = $1::uuid AND slug = $2 LIMIT 1', [siteId, slug]);
      if (!existing.rows[0]) {
        const ins = await client.query(
          "INSERT INTO pages (site_id, title, slug, status) VALUES ($1::uuid, $2, $3, 'published') RETURNING id",
          [siteId, title, slug]
        );
        const pid = ins.rows[0].id;
        for (let i = 0; i < blockSpecs.length; i++) {
          const spec = blockSpecs[i];
          const bt = Array.isArray(spec) ? spec[0] : spec;
          const data = Array.isArray(spec) && spec.length >= 2 ? spec[1] : {};
          await client.query('INSERT INTO page_blocks (page_id, block_type, data, sort_order) VALUES ($1::uuid, $2, $3::jsonb, $4)', [pid, bt, JSON.stringify(data), i]);
        }
        counts.pages = (counts.pages || 1) + 1;
      }
    }

    const totalBlocks = await client.query('SELECT COUNT(*) FROM page_blocks WHERE page_id IN (SELECT id FROM pages WHERE site_id = $1::uuid)', [siteId]);
    counts.page_blocks = Number(totalBlocks.rows[0].count);

    console.log(JSON.stringify({ site_id: siteId, campaign_id: campaignId, counts, message: 'chrisamaya.work seed complete (direct Postgres).' }, null, 2));
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();
