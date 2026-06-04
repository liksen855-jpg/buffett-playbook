/**
 * Finviz-style industry list grouped by sector.
 * Used by the screener page industry dropdown.
 */

export interface IndustryOption {
  value: string
  label: string
  sector: string
}

export const INDUSTRIES: IndustryOption[] = [
  // ── Technology ──
  { value: 'Software - Application', label: 'Software - Application', sector: 'Technology' },
  { value: 'Software - Infrastructure', label: 'Software - Infrastructure', sector: 'Technology' },
  { value: 'Semiconductors', label: 'Semiconductors', sector: 'Technology' },
  { value: 'Semiconductor Equipment & Materials', label: 'Semiconductor Equipment & Materials', sector: 'Technology' },
  { value: 'Information Technology Services', label: 'Information Technology Services', sector: 'Technology' },
  { value: 'Communication Equipment', label: 'Communication Equipment', sector: 'Technology' },
  { value: 'Computer Hardware', label: 'Computer Hardware', sector: 'Technology' },
  { value: 'Consumer Electronics', label: 'Consumer Electronics', sector: 'Technology' },
  { value: 'Electronic Components', label: 'Electronic Components', sector: 'Technology' },
  { value: 'Electronics & Computer Distribution', label: 'Electronics & Computer Distribution', sector: 'Technology' },
  { value: 'Scientific & Technical Instruments', label: 'Scientific & Technical Instruments', sector: 'Technology' },

  // ── Communication Services ──
  { value: 'Internet Content & Information', label: 'Internet Content & Information', sector: 'Communication Services' },
  { value: 'Telecom Services', label: 'Telecom Services', sector: 'Communication Services' },
  { value: 'Advertising Agencies', label: 'Advertising Agencies', sector: 'Communication Services' },
  { value: 'Publishing', label: 'Publishing', sector: 'Communication Services' },
  { value: 'Broadcasting', label: 'Broadcasting', sector: 'Communication Services' },
  { value: 'Entertainment', label: 'Entertainment', sector: 'Communication Services' },
  { value: 'Electronic Gaming & Multimedia', label: 'Electronic Gaming & Multimedia', sector: 'Communication Services' },

  // ── Consumer Cyclical ──
  { value: 'Internet Retail', label: 'Internet Retail', sector: 'Consumer Cyclical' },
  { value: 'Auto Manufacturers', label: 'Auto Manufacturers', sector: 'Consumer Cyclical' },
  { value: 'Auto Parts', label: 'Auto Parts', sector: 'Consumer Cyclical' },
  { value: 'Auto & Truck Dealerships', label: 'Auto & Truck Dealerships', sector: 'Consumer Cyclical' },
  { value: 'Restaurants', label: 'Restaurants', sector: 'Consumer Cyclical' },
  { value: 'Apparel Retail', label: 'Apparel Retail', sector: 'Consumer Cyclical' },
  { value: 'Apparel Manufacturing', label: 'Apparel Manufacturing', sector: 'Consumer Cyclical' },
  { value: 'Footwear & Accessories', label: 'Footwear & Accessories', sector: 'Consumer Cyclical' },
  { value: 'Home Improvement Retail', label: 'Home Improvement Retail', sector: 'Consumer Cyclical' },
  { value: 'Specialty Retail', label: 'Specialty Retail', sector: 'Consumer Cyclical' },
  { value: 'Department Stores', label: 'Department Stores', sector: 'Consumer Cyclical' },
  { value: 'Gambling', label: 'Gambling', sector: 'Consumer Cyclical' },
  { value: 'Lodging', label: 'Lodging', sector: 'Consumer Cyclical' },
  { value: 'Resorts & Casinos', label: 'Resorts & Casinos', sector: 'Consumer Cyclical' },
  { value: 'Leisure', label: 'Leisure', sector: 'Consumer Cyclical' },
  { value: 'Residential Construction', label: 'Residential Construction', sector: 'Consumer Cyclical' },
  { value: 'Furnishings, Fixtures & Appliances', label: 'Furnishings, Fixtures & Appliances', sector: 'Consumer Cyclical' },
  { value: 'Recreational Vehicles', label: 'Recreational Vehicles', sector: 'Consumer Cyclical' },
  { value: 'Travel Services', label: 'Travel Services', sector: 'Consumer Cyclical' },
  { value: 'Packaging & Containers', label: 'Packaging & Containers', sector: 'Consumer Cyclical' },
  { value: 'Personal Services', label: 'Personal Services', sector: 'Consumer Cyclical' },
  { value: 'Textile Manufacturing', label: 'Textile Manufacturing', sector: 'Consumer Cyclical' },

  // ── Consumer Defensive ──
  { value: 'Discount Stores', label: 'Discount Stores', sector: 'Consumer Defensive' },
  { value: 'Grocery Stores', label: 'Grocery Stores', sector: 'Consumer Defensive' },
  { value: 'Food Distribution', label: 'Food Distribution', sector: 'Consumer Defensive' },
  { value: 'Beverages - Non-Alcoholic', label: 'Beverages - Non-Alcoholic', sector: 'Consumer Defensive' },
  { value: 'Beverages - Alcoholic', label: 'Beverages - Alcoholic', sector: 'Consumer Defensive' },
  { value: 'Beverages - Brewers', label: 'Beverages - Brewers', sector: 'Consumer Defensive' },
  { value: 'Beverages - Wineries & Distilleries', label: 'Beverages - Wineries & Distilleries', sector: 'Consumer Defensive' },
  { value: 'Household Products', label: 'Household Products', sector: 'Consumer Defensive' },
  { value: 'Packaged Foods', label: 'Packaged Foods', sector: 'Consumer Defensive' },
  { value: 'Confectioners', label: 'Confectioners', sector: 'Consumer Defensive' },
  { value: 'Farm Products', label: 'Farm Products', sector: 'Consumer Defensive' },
  { value: 'Tobacco', label: 'Tobacco', sector: 'Consumer Defensive' },
  { value: 'Education & Training Services', label: 'Education & Training Services', sector: 'Consumer Defensive' },

  // ── Financial Services ──
  { value: 'Banks - Diversified', label: 'Banks - Diversified', sector: 'Financial Services' },
  { value: 'Banks - Regional', label: 'Banks - Regional', sector: 'Financial Services' },
  { value: 'Credit Services', label: 'Credit Services', sector: 'Financial Services' },
  { value: 'Asset Management', label: 'Asset Management', sector: 'Financial Services' },
  { value: 'Capital Markets', label: 'Capital Markets', sector: 'Financial Services' },
  { value: 'Financial Data & Stock Exchanges', label: 'Financial Data & Stock Exchanges', sector: 'Financial Services' },
  { value: 'Insurance - Diversified', label: 'Insurance - Diversified', sector: 'Financial Services' },
  { value: 'Insurance - Life', label: 'Insurance - Life', sector: 'Financial Services' },
  { value: 'Insurance - Property & Casualty', label: 'Insurance - Property & Casualty', sector: 'Financial Services' },
  { value: 'Insurance - Reinsurance', label: 'Insurance - Reinsurance', sector: 'Financial Services' },
  { value: 'Insurance - Specialty', label: 'Insurance - Specialty', sector: 'Financial Services' },
  { value: 'Insurance Brokers', label: 'Insurance Brokers', sector: 'Financial Services' },
  { value: 'Mortgage Finance', label: 'Mortgage Finance', sector: 'Financial Services' },
  { value: 'Shell Companies', label: 'Shell Companies', sector: 'Financial Services' },
  { value: 'Financial Conglomerates', label: 'Financial Conglomerates', sector: 'Financial Services' },

  // ── Healthcare ──
  { value: 'Drug Manufacturers - General', label: 'Drug Manufacturers - General', sector: 'Healthcare' },
  { value: 'Drug Manufacturers - Specialty & Generic', label: 'Drug Manufacturers - Specialty & Generic', sector: 'Healthcare' },
  { value: 'Biotechnology', label: 'Biotechnology', sector: 'Healthcare' },
  { value: 'Diagnostics & Research', label: 'Diagnostics & Research', sector: 'Healthcare' },
  { value: 'Medical Devices', label: 'Medical Devices', sector: 'Healthcare' },
  { value: 'Medical Instruments & Supplies', label: 'Medical Instruments & Supplies', sector: 'Healthcare' },
  { value: 'Medical Distribution', label: 'Medical Distribution', sector: 'Healthcare' },
  { value: 'Healthcare Plans', label: 'Healthcare Plans', sector: 'Healthcare' },
  { value: 'Health Information Services', label: 'Health Information Services', sector: 'Healthcare' },
  { value: 'Medical Care Facilities', label: 'Medical Care Facilities', sector: 'Healthcare' },
  { value: 'Pharmaceutical Retailers', label: 'Pharmaceutical Retailers', sector: 'Healthcare' },
  { value: 'Long-Term Care Facilities', label: 'Long-Term Care Facilities', sector: 'Healthcare' },

  // ── Industrials ──
  { value: 'Aerospace & Defense', label: 'Aerospace & Defense', sector: 'Industrial' },
  { value: 'Airlines', label: 'Airlines', sector: 'Industrial' },
  { value: 'Airports & Air Services', label: 'Airports & Air Services', sector: 'Industrial' },
  { value: 'Railroads', label: 'Railroads', sector: 'Industrial' },
  { value: 'Trucking', label: 'Trucking', sector: 'Industrial' },
  { value: 'Integrated Freight & Logistics', label: 'Integrated Freight & Logistics', sector: 'Industrial' },
  { value: 'Marine Shipping', label: 'Marine Shipping', sector: 'Industrial' },
  { value: 'Building Products & Equipment', label: 'Building Products & Equipment', sector: 'Industrial' },
  { value: 'Specialty Industrial Machinery', label: 'Specialty Industrial Machinery', sector: 'Industrial' },
  { value: 'Metal Fabrication', label: 'Metal Fabrication', sector: 'Industrial' },
  { value: 'Pollution & Treatment Controls', label: 'Pollution & Treatment Controls', sector: 'Industrial' },
  { value: 'Farm & Heavy Construction Machinery', label: 'Farm & Heavy Construction Machinery', sector: 'Industrial' },
  { value: 'Tools & Accessories', label: 'Tools & Accessories', sector: 'Industrial' },
  { value: 'Electrical Equipment & Parts', label: 'Electrical Equipment & Parts', sector: 'Industrial' },
  { value: 'Engineering & Construction', label: 'Engineering & Construction', sector: 'Industrial' },
  { value: 'Infrastructure Operations', label: 'Infrastructure Operations', sector: 'Industrial' },
  { value: 'Staffing & Outsourcing Services', label: 'Staffing & Outsourcing Services', sector: 'Industrial' },
  { value: 'Business Equipment & Supplies', label: 'Business Equipment & Supplies', sector: 'Industrial' },
  { value: 'Conglomerates', label: 'Conglomerates', sector: 'Industrial' },
  { value: 'Consulting Services', label: 'Consulting Services', sector: 'Industrial' },
  { value: 'Rental & Leasing Services', label: 'Rental & Leasing Services', sector: 'Industrial' },
  { value: 'Security & Protection Services', label: 'Security & Protection Services', sector: 'Industrial' },

  // ── Energy ──
  { value: 'Oil & Gas Integrated', label: 'Oil & Gas Integrated', sector: 'Energy' },
  { value: 'Oil & Gas E&P', label: 'Oil & Gas E&P', sector: 'Energy' },
  { value: 'Oil & Gas Midstream', label: 'Oil & Gas Midstream', sector: 'Energy' },
  { value: 'Oil & Gas Refining & Marketing', label: 'Oil & Gas Refining & Marketing', sector: 'Energy' },
  { value: 'Oil & Gas Equipment & Services', label: 'Oil & Gas Equipment & Services', sector: 'Energy' },
  { value: 'Oil & Gas Drilling', label: 'Oil & Gas Drilling', sector: 'Energy' },
  { value: 'Thermal Coal', label: 'Thermal Coal', sector: 'Energy' },
  { value: 'Uranium', label: 'Uranium', sector: 'Energy' },
  { value: 'Solar', label: 'Solar', sector: 'Energy' },
  { value: 'Utilities - Renewable', label: 'Utilities - Renewable', sector: 'Energy' },

  // ── Basic Materials ──
  { value: 'Chemicals', label: 'Chemicals', sector: 'Basic Materials' },
  { value: 'Specialty Chemicals', label: 'Specialty Chemicals', sector: 'Basic Materials' },
  { value: 'Steel', label: 'Steel', sector: 'Basic Materials' },
  { value: 'Copper', label: 'Copper', sector: 'Basic Materials' },
  { value: 'Aluminum', label: 'Aluminum', sector: 'Basic Materials' },
  { value: 'Other Industrial Metals & Mining', label: 'Other Industrial Metals & Mining', sector: 'Basic Materials' },
  { value: 'Gold', label: 'Gold', sector: 'Basic Materials' },
  { value: 'Silver', label: 'Silver', sector: 'Basic Materials' },
  { value: 'Other Precious Metals & Mining', label: 'Other Precious Metals & Mining', sector: 'Basic Materials' },
  { value: 'Building Materials', label: 'Building Materials', sector: 'Basic Materials' },
  { value: 'Lumber & Wood Production', label: 'Lumber & Wood Production', sector: 'Basic Materials' },
  { value: 'Paper & Paper Products', label: 'Paper & Paper Products', sector: 'Basic Materials' },
  { value: 'Agricultural Inputs', label: 'Agricultural Inputs', sector: 'Basic Materials' },

  // ── Real Estate ──
  { value: 'REIT - Industrial', label: 'REIT - Industrial', sector: 'Real Estate' },
  { value: 'REIT - Office', label: 'REIT - Office', sector: 'Real Estate' },
  { value: 'REIT - Residential', label: 'REIT - Residential', sector: 'Real Estate' },
  { value: 'REIT - Retail', label: 'REIT - Retail', sector: 'Real Estate' },
  { value: 'REIT - Healthcare Facilities', label: 'REIT - Healthcare Facilities', sector: 'Real Estate' },
  { value: 'REIT - Hotel & Motel', label: 'REIT - Hotel & Motel', sector: 'Real Estate' },
  { value: 'REIT - Diversified', label: 'REIT - Diversified', sector: 'Real Estate' },
  { value: 'REIT - Mortgage', label: 'REIT - Mortgage', sector: 'Real Estate' },
  { value: 'REIT - Specialty', label: 'REIT - Specialty', sector: 'Real Estate' },
  { value: 'REIT - Data Centers', label: 'REIT - Data Centers', sector: 'Real Estate' },
  { value: 'Real Estate - Development', label: 'Real Estate - Development', sector: 'Real Estate' },
  { value: 'Real Estate - Diversified', label: 'Real Estate - Diversified', sector: 'Real Estate' },
  { value: 'Real Estate Services', label: 'Real Estate Services', sector: 'Real Estate' },

  // ── Utilities ──
  { value: 'Utilities - Regulated Electric', label: 'Utilities - Regulated Electric', sector: 'Utilities' },
  { value: 'Utilities - Regulated Gas', label: 'Utilities - Regulated Gas', sector: 'Utilities' },
  { value: 'Utilities - Regulated Water', label: 'Utilities - Regulated Water', sector: 'Utilities' },
  { value: 'Utilities - Diversified', label: 'Utilities - Diversified', sector: 'Utilities' },
  { value: 'Utilities - Independent Power Producers', label: 'Utilities - Independent Power Producers', sector: 'Utilities' },
  { value: 'Waste Management', label: 'Waste Management', sector: 'Utilities' },
]

/** Group industries by sector for optgroup-style rendering. */
export const INDUSTRIES_BY_SECTOR = INDUSTRIES.reduce(
  (acc, ind) => {
    if (!acc[ind.sector]) acc[ind.sector] = []
    acc[ind.sector].push(ind)
    return acc
  },
  {} as Record<string, IndustryOption[]>
)

export const SECTORS = Object.keys(INDUSTRIES_BY_SECTOR)
