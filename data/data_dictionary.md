# EDEN ISS Antarctic Space Greenhouse: Data Dictionary

This data dictionary documents the variables in `eden_iss_crops.csv`, `nutrient_solutions.csv`, and `space_analog_comparison.csv`.

---

## 1. Crop Biomass & Production Dataset (`eden_iss_crops.csv`)

| Column Name | Data Type | Units / Format | Description & Scientific Context | FAIR Ontology Ref |
| :--- | :--- | :--- | :--- | :--- |
| `sample_id` | String | `[Organism]_[Group]_[Cultivar]` | Unique accession identifier within NASA OSDR study OSD-895. | - |
| `display_name` | String | Plain text | Standardized human-readable crop name with cultivar details. | - |
| `crop_category` | Categorical | `Lettuce`, `Leafy Greens`, `Herbs`, `Fruit Crops`, `Tuber Crops` | Broad horticultural crop classification. | - |
| `organism` | String | Binomial nomenclature | Linnaean botanical species name. | `NCBITaxon` |
| `ncbi_taxonomy_id` | Integer | Integer ID | National Center for Biotechnology Information (NCBI) Taxonomy ID. | `NCBITaxon` |
| `cultivar` | String | Variety name | Commercial cultivar or line identifier. | - |
| `seed_source` | String | Organization name | Seed breeder or commercial vendor supplying propagation material. | - |
| `organism_part` | Categorical | `Plant Leaves`, `fruit`, `tubers` | Anatomical plant organ harvested for crew consumption. | `MESH:D018515` |
| `growth_medium` | Categorical | `rockwool blocks`, `cotton fiber mats` | Root growth substrate. Rockwool blocks (2x2x4 cm) or recycled cotton fiber mats. | - |
| `harvest_type` | Categorical | `batch`, `spread` | Harvest regime: `batch` (destructive whole-plant harvest at target age) vs. `spread` (continuous leaf/fruit picking). | - |
| `cycles_evaluated` | Integer | Count | Number of production batches passing data-quality screening and evaluated. | - |
| `photoperiod_hours` | Integer | Hours | Daily lighting duration: 15h nominal + 2h ramping (1h @ 50% before & after). | `UO:0000032` |
| `dark_period_hours` | Integer | Hours | Daily dark period: 7h per diurnal cycle. | `UO:0000032` |
| `light_intensity_umol_m2_s` | String / Float | $\mu\text{mol}/(\text{m}^2\cdot\text{s})$ | Photosynthetic photon flux density (PPFD) measured at canopy / 16 cm height. | `UO:0000160` |
| `temperature_photoperiod_c` | Float | $^\circ\text{C}$ | Day air temperature setpoint ($21^\circ\text{C}$ nominal; night setpoint $19^\circ\text{C}$). | `UO:0000027` |
| `relative_humidity_pct` | Float | $\%$ | Relative humidity setpoint ($65\%$ nominal; observed excursions up to $86\%$). | `UO:0000187` |
| `planting_density_plants_m2` | Float | $\text{plants}/\text{m}^2$ | Number of plants cultivated per square meter of tray surface. | - |
| `growth_time_days` | Float | Days | Mean cultivation cycle duration from sowing/nursery transfer to final harvest. | `UO:0000033` |
| `mean_edible_yield_kg_m2` | Float | $\text{kg}/\text{m}^2$ | Mean fresh edible produce mass per unit cultivation tray area across valid cycles. | `UO:0000086` |
| `edible_yield_min_kg_m2` | Float | $\text{kg}/\text{m}^2$ | Lowest observed fresh edible yield in an evaluated batch cycle. | `UO:0000086` |
| `edible_yield_max_kg_m2` | Float | $\text{kg}/\text{m}^2$ | Highest observed fresh edible yield in an evaluated batch cycle. | `UO:0000086` |
| `daily_edible_productivity_g_m2_day` | Float | $\text{g}/(\text{m}^2\cdot\text{day})$ | Time-normalized daily edible biomass production rate: $(\text{mean\_yield} \times 1000) / \text{growth\_time}$. | - |
| `edible_dw_ratio_pct` | Float | $\%$ | Dry weight ratio of edible material after freeze-drying (lyophilization): $\text{dry mass} / \text{fresh mass} \times 100$. | `UO:0000187` |
| `belowground_dw_ratio_pct` | Float | $\%$ | Dry weight ratio of washed, lyophilized root tissue. | `UO:0000187` |
| `aboveground_dw_ratio_pct` | Float | $\%$ | Dry weight ratio of inedible stems, leaves, and pruning waste. | `UO:0000187` |
| `aboveground_dry_biomass_g_m2` | String | $\text{g}/\text{m}^2$ | Range of inedible aboveground dry biomass harvested per square meter. | `UO:0000082` |
| `belowground_dry_biomass_g_m2` | String | $\text{g}/\text{m}^2$ | Range of inedible root dry biomass recovered per square meter. | `UO:0000082` |
| `nutrient_solution` | Categorical | `Leafy solution`, `Fruit solution` | Bulk tank mixture supplied via aeroponic misting (Tank 1 vs. Tank 2). | - |

---

## 2. Nutrient Solution Formulations (`nutrient_solutions.csv`)

Documents initial and adjusted recipes developed for the EDEN ISS bulk nutrient delivery subsystem (Table 2 of Zabel et al. 2020):

- `element_ion`: Chemical ion or element name.
- `symbol`: Chemical symbol.
- `formula`: Chemical formula.
- `unit`: Measurement unit (`mol / 100 L` for macronutrients; `mmol / 100 L` for micronutrients).
- `tank1_leafy`: Concentration in Tank 1 (dedicated to lettuces, leafy greens, herbs, and tubers).
- `tank2_fruit_initial`: Initial formulation for Tank 2 (tomatoes, cucumbers, peppers).
- `tank2_fruit_adjusted`: Mission-adjusted formulation (elevated $\text{Ca}^{2+}$ to $0.650\ \text{mol}/100\text{L}$, reduced $\text{K}^+$ to $1.450\ \text{mol}/100\text{L}$ to resolve tomato calcium deficiency).
- `role`: Physiological function in plant metabolism and space crop nutrition.

---

## 3. Space Analog Facility Comparison (`space_analog_comparison.csv`)

Compares whole-facility daily production performance across space analog crop growth facilities (Table 10 of Zabel et al. 2020):

- `facility`: Facility name.
- `location`: Terrestrial analog test site.
- `year`: Primary experimental operational campaign year.
- `crop_profile`: Crop diversity and species percentage breakdown.
- `daily_edible_productivity_kg_m2_d`: Overall facility fresh edible biomass production rate in $\text{kg}/(\text{m}^2\cdot\text{day})$.
- `daily_edible_productivity_excl_pepper_kg_m2_d`: Normalized rate excluding low-yielding experimental pepper trays ($11\%$ area).
- `reference`: Formal literature citation.
