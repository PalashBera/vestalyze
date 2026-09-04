-- Catalog + FX seed. Run after schema.sql.
-- Does not create auth users. New registrations call clone_sample_portfolio().

insert into public.fx_rates (base, quote, rate, as_of)
values ('USD', 'INR', 87.25, '2026-09-04')
on conflict (base, quote) do update
  set rate = excluded.rate, as_of = excluded.as_of;

insert into public.securities (
  id, company_name, standardized_name, ticker, isin, exchange, country, currency, sector, industry
) values
  ('sec-reliance', 'Reliance Industries Ltd.', 'Reliance Industries', 'RELIANCE', 'INE002A01018', 'NSE', 'IN', 'INR', 'Energy', 'Oil & Gas Refining'),
  ('sec-hdfcbank', 'HDFC Bank Ltd.', 'HDFC Bank', 'HDFCBANK', 'INE040A01034', 'NSE', 'IN', 'INR', 'Banking', 'Private Banks'),
  ('sec-icicibank', 'ICICI Bank Ltd.', 'ICICI Bank', 'ICICIBANK', 'INE090A01021', 'NSE', 'IN', 'INR', 'Banking', 'Private Banks'),
  ('sec-infosys', 'Infosys Ltd.', 'Infosys', 'INFY', 'INE009A01021', 'NSE', 'IN', 'INR', 'Technology', 'IT Services'),
  ('sec-tcs', 'Tata Consultancy Services Ltd.', 'TCS', 'TCS', 'INE467B01029', 'NSE', 'IN', 'INR', 'Technology', 'IT Services'),
  ('sec-itc', 'ITC Ltd.', 'ITC', 'ITC', 'INE154A01025', 'NSE', 'IN', 'INR', 'Consumer', 'FMCG'),
  ('sec-powergrid', 'Power Grid Corporation of India Ltd.', 'Power Grid', 'POWERGRID', 'INE752E01010', 'NSE', 'IN', 'INR', 'Energy', 'Power Transmission'),
  ('sec-coalindia', 'Coal India Ltd.', 'Coal India', 'COALINDIA', 'INE522F01014', 'NSE', 'IN', 'INR', 'Energy', 'Mining'),
  ('sec-hcl', 'HCL Technologies Ltd.', 'HCL Technologies', 'HCLTECH', 'INE860A01027', 'NSE', 'IN', 'INR', 'Technology', 'IT Services'),
  ('sec-bharti', 'Bharti Airtel Ltd.', 'Bharti Airtel', 'BHARTIARTL', 'INE397D01024', 'NSE', 'IN', 'INR', 'Consumer', 'Telecom'),
  ('sec-sbi', 'State Bank of India', 'State Bank of India', 'SBIN', 'INE062A01020', 'NSE', 'IN', 'INR', 'Banking', 'Public Banks'),
  ('sec-lt', 'Larsen & Toubro Ltd.', 'Larsen & Toubro', 'LT', 'INE018A01030', 'NSE', 'IN', 'INR', 'Industrials', 'Engineering'),
  ('sec-axis', 'Axis Bank Ltd.', 'Axis Bank', 'AXISBANK', 'INE238A01034', 'NSE', 'IN', 'INR', 'Banking', 'Private Banks'),
  ('sec-bajajhold', 'Bajaj Holdings & Investment Ltd.', 'Bajaj Holdings', 'BAJAJHLDNG', 'INE118A01012', 'NSE', 'IN', 'INR', 'Financial Services', 'Holding Companies'),
  ('sec-ihcl', 'The Indian Hotels Company Ltd.', 'Indian Hotels', 'INDHOTEL', 'INE053A01029', 'NSE', 'IN', 'INR', 'Consumer', 'Hospitality'),
  ('sec-federal', 'The Federal Bank Ltd.', 'Federal Bank', 'FEDERALBNK', 'INE171A01029', 'NSE', 'IN', 'INR', 'Banking', 'Private Banks'),
  ('sec-maxhealth', 'Max Healthcare Institute Ltd.', 'Max Healthcare', 'MAXHEALTH', 'INE03EI01026', 'NSE', 'IN', 'INR', 'Healthcare', 'Hospitals'),
  ('sec-apple', 'Apple Inc.', 'Apple', 'AAPL', 'US0378331005', 'NASDAQ', 'US', 'USD', 'Technology', 'Consumer Electronics'),
  ('sec-msft', 'Microsoft Corporation', 'Microsoft', 'MSFT', 'US5949181045', 'NASDAQ', 'US', 'USD', 'Technology', 'Software'),
  ('sec-nvda', 'NVIDIA Corporation', 'NVIDIA', 'NVDA', 'US67066G1040', 'NASDAQ', 'US', 'USD', 'Technology', 'Semiconductors'),
  ('sec-amzn', 'Amazon.com Inc.', 'Amazon', 'AMZN', 'US0231351067', 'NASDAQ', 'US', 'USD', 'Consumer', 'E-commerce'),
  ('sec-googl', 'Alphabet Inc.', 'Alphabet', 'GOOGL', 'US02079K3059', 'NASDAQ', 'US', 'USD', 'Technology', 'Internet'),
  ('sec-meta', 'Meta Platforms Inc.', 'Meta', 'META', 'US30303M1027', 'NASDAQ', 'US', 'USD', 'Technology', 'Internet'),
  ('sec-avgo', 'Broadcom Inc.', 'Broadcom', 'AVGO', 'US11135F1012', 'NASDAQ', 'US', 'USD', 'Technology', 'Semiconductors'),
  ('sec-tsla', 'Tesla Inc.', 'Tesla', 'TSLA', 'US88160R1014', 'NASDAQ', 'US', 'USD', 'Consumer', 'Automobiles'),
  ('sec-jpm', 'JPMorgan Chase & Co.', 'JPMorgan Chase', 'JPM', 'US46625H1005', 'NYSE', 'US', 'USD', 'Financial Services', 'Banks')
on conflict (id) do update set
  company_name = excluded.company_name,
  standardized_name = excluded.standardized_name,
  ticker = excluded.ticker,
  isin = excluded.isin,
  exchange = excluded.exchange,
  country = excluded.country,
  currency = excluded.currency,
  sector = excluded.sector,
  industry = excluded.industry;

insert into public.funds (
  id, name, symbol, type, fund_house, category, country, currency,
  latest_portfolio_date, source_website, source_url, last_scraped_at, data_status
) values
  ('fund-ppfcf', 'Parag Parikh Flexi Cap Fund', 'PPFCF', 'mutual_fund', 'PPFAS Mutual Fund', 'Flexi Cap', 'IN', 'INR', '2026-07-31', 'AMFI / Fund factsheet', 'https://amc.ppfas.com', '2026-09-01T06:00:00Z', 'fresh'),
  ('fund-hdfcmid', 'HDFC Mid-Cap Opportunities Fund', 'HDFCMID', 'mutual_fund', 'HDFC Mutual Fund', 'Mid Cap', 'IN', 'INR', '2026-07-31', 'AMFI / Fund factsheet', 'https://www.hdfcfund.com', '2026-09-01T06:05:00Z', 'fresh'),
  ('fund-niftybees', 'Nippon India ETF Nifty BeES', 'NIFTYBEES', 'etf', 'Nippon India Mutual Fund', 'Index ETF', 'IN', 'INR', '2026-08-29', 'NSE ETF holdings', 'https://www.nseindia.com', '2026-09-02T04:00:00Z', 'fresh'),
  ('fund-voo', 'Vanguard S&P 500 ETF', 'VOO', 'etf', 'Vanguard', 'Large Cap Index', 'US', 'USD', '2026-08-31', 'Vanguard holdings', 'https://investor.vanguard.com', '2026-09-03T08:00:00Z', 'fresh'),
  ('fund-qqq', 'Invesco QQQ Trust', 'QQQ', 'etf', 'Invesco', 'Nasdaq-100', 'US', 'USD', '2026-08-31', 'Invesco holdings', 'https://www.invesco.com', '2026-09-03T08:10:00Z', 'stale')
on conflict (id) do update set
  name = excluded.name,
  symbol = excluded.symbol,
  type = excluded.type,
  fund_house = excluded.fund_house,
  category = excluded.category,
  last_scraped_at = excluded.last_scraped_at,
  data_status = excluded.data_status;

insert into public.data_sources (id, name, url, type, last_scraped_at, last_successful_at, status) values
  ('src-amfi', 'Indian Mutual Fund Disclosures', 'https://www.amfiindia.com', 'indian_mf', '2026-09-01T06:00:00Z', '2026-09-01T06:00:00Z', 'fresh'),
  ('src-nse', 'Indian ETF Holdings', 'https://www.nseindia.com', 'indian_etf', '2026-09-02T04:00:00Z', '2026-09-02T04:00:00Z', 'fresh'),
  ('src-vanguard', 'US ETF Holdings — Vanguard', 'https://investor.vanguard.com', 'us_etf', '2026-09-03T08:00:00Z', '2026-09-03T08:00:00Z', 'fresh'),
  ('src-invesco', 'US ETF Holdings — Invesco', 'https://www.invesco.com', 'us_etf', '2026-08-20T08:10:00Z', '2026-08-20T08:10:00Z', 'stale')
on conflict (id) do update set
  name = excluded.name,
  url = excluded.url,
  last_scraped_at = excluded.last_scraped_at,
  status = excluded.status;

insert into public.fund_holdings (
  id, fund_id, security_id, allocation_percentage, holding_date, source_id
) values
  ('h-pp-1', 'fund-ppfcf', 'sec-hdfcbank', 8.5, '2026-07-31', 'src-amfi'),
  ('h-pp-2', 'fund-ppfcf', 'sec-powergrid', 7.2, '2026-07-31', 'src-amfi'),
  ('h-pp-3', 'fund-ppfcf', 'sec-coalindia', 6.1, '2026-07-31', 'src-amfi'),
  ('h-pp-4', 'fund-ppfcf', 'sec-amzn', 5.5, '2026-07-31', 'src-amfi'),
  ('h-pp-5', 'fund-ppfcf', 'sec-msft', 5.0, '2026-07-31', 'src-amfi'),
  ('h-pp-6', 'fund-ppfcf', 'sec-googl', 4.2, '2026-07-31', 'src-amfi'),
  ('h-pp-7', 'fund-ppfcf', 'sec-bajajhold', 4.0, '2026-07-31', 'src-amfi'),
  ('h-pp-8', 'fund-ppfcf', 'sec-icicibank', 3.8, '2026-07-31', 'src-amfi'),
  ('h-pp-9', 'fund-ppfcf', 'sec-itc', 3.5, '2026-07-31', 'src-amfi'),
  ('h-pp-10', 'fund-ppfcf', 'sec-hcl', 3.2, '2026-07-31', 'src-amfi'),
  ('h-hm-1', 'fund-hdfcmid', 'sec-ihcl', 4.2, '2026-07-31', 'src-amfi'),
  ('h-hm-2', 'fund-hdfcmid', 'sec-federal', 3.8, '2026-07-31', 'src-amfi'),
  ('h-hm-3', 'fund-hdfcmid', 'sec-maxhealth', 3.5, '2026-07-31', 'src-amfi'),
  ('h-nb-1', 'fund-niftybees', 'sec-hdfcbank', 11.2, '2026-08-29', 'src-nse'),
  ('h-nb-2', 'fund-niftybees', 'sec-reliance', 8.8, '2026-08-29', 'src-nse'),
  ('h-nb-3', 'fund-niftybees', 'sec-icicibank', 7.6, '2026-08-29', 'src-nse'),
  ('h-nb-4', 'fund-niftybees', 'sec-infosys', 5.4, '2026-08-29', 'src-nse'),
  ('h-nb-5', 'fund-niftybees', 'sec-itc', 4.1, '2026-08-29', 'src-nse'),
  ('h-nb-6', 'fund-niftybees', 'sec-tcs', 3.9, '2026-08-29', 'src-nse'),
  ('h-nb-7', 'fund-niftybees', 'sec-bharti', 3.6, '2026-08-29', 'src-nse'),
  ('h-nb-8', 'fund-niftybees', 'sec-lt', 3.2, '2026-08-29', 'src-nse'),
  ('h-nb-9', 'fund-niftybees', 'sec-sbi', 2.8, '2026-08-29', 'src-nse'),
  ('h-nb-10', 'fund-niftybees', 'sec-axis', 2.6, '2026-08-29', 'src-nse'),
  ('h-voo-1', 'fund-voo', 'sec-apple', 7.0, '2026-08-31', 'src-vanguard'),
  ('h-voo-2', 'fund-voo', 'sec-msft', 6.2, '2026-08-31', 'src-vanguard'),
  ('h-voo-3', 'fund-voo', 'sec-nvda', 5.8, '2026-08-31', 'src-vanguard'),
  ('h-voo-4', 'fund-voo', 'sec-amzn', 3.8, '2026-08-31', 'src-vanguard'),
  ('h-voo-5', 'fund-voo', 'sec-googl', 3.5, '2026-08-31', 'src-vanguard'),
  ('h-voo-6', 'fund-voo', 'sec-meta', 2.6, '2026-08-31', 'src-vanguard'),
  ('h-voo-7', 'fund-voo', 'sec-jpm', 1.2, '2026-08-31', 'src-vanguard'),
  ('h-voo-8', 'fund-voo', 'sec-avgo', 1.6, '2026-08-31', 'src-vanguard'),
  ('h-qqq-1', 'fund-qqq', 'sec-apple', 8.6, '2026-08-31', 'src-invesco'),
  ('h-qqq-2', 'fund-qqq', 'sec-msft', 8.1, '2026-08-31', 'src-invesco'),
  ('h-qqq-3', 'fund-qqq', 'sec-nvda', 7.9, '2026-08-31', 'src-invesco'),
  ('h-qqq-4', 'fund-qqq', 'sec-amzn', 5.2, '2026-08-31', 'src-invesco'),
  ('h-qqq-5', 'fund-qqq', 'sec-avgo', 4.8, '2026-08-31', 'src-invesco'),
  ('h-qqq-6', 'fund-qqq', 'sec-meta', 4.4, '2026-08-31', 'src-invesco'),
  ('h-qqq-7', 'fund-qqq', 'sec-googl', 3.2, '2026-08-31', 'src-invesco'),
  ('h-qqq-8', 'fund-qqq', 'sec-tsla', 2.8, '2026-08-31', 'src-invesco')
on conflict (id) do update set
  allocation_percentage = excluded.allocation_percentage,
  holding_date = excluded.holding_date,
  source_id = excluded.source_id;

insert into public.scraping_logs (id, data_source_id, started_at, completed_at, status, records_processed) values
  ('log-1', 'src-amfi', '2026-09-01T06:00:00Z', '2026-09-01T06:01:12Z', 'success', 13),
  ('log-2', 'src-invesco', '2026-08-20T08:10:00Z', '2026-08-20T08:10:44Z', 'success', 8)
on conflict (id) do nothing;
