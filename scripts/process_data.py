#!/usr/bin/env python3
"""
process_data.py
Processes raw NASA OSDR OSD-895 JSON metadata and extracts tidy, FAIR-compliant datasets:
- data/processed/eden_iss_crops.csv
- data/processed/eden_iss_crops.parquet (only if pandas and pyarrow are installed)
- data/processed/eden_iss_crops.json
- data/processed/nutrient_solutions.csv
- data/processed/space_analog_comparison.csv
- data/processed/greenhouse_summary.json
- docs/data/ (synchronized copies for GitHub Pages static web app)
"""

import os
import sys
import json
import csv
import re

RAW_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "OSD-895_metadata.json")
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
DOCS_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "docs", "data")

def clean_val(item):
    if item is None:
        return None
    if isinstance(item, dict):
        v = item.get("#")
        if v == "Not Applicable" or v == "{Not Applicable}" or v == "{Not Available}":
            return None
        return v
    return item

def parse_range(range_str):
    if not range_str or not isinstance(range_str, str) or "-" not in range_str:
        return None, None
    parts = range_str.split("-")
    try:
        return float(parts[0]), float(parts[1])
    except ValueError:
        return None, None

def get_crop_category(sample_name, cultivar):
    s = sample_name.lower()
    c = (cultivar or "").lower()
    if "lettuce" in s or "lettuce" in c:
        return "Lettuce"
    if "leafygreens" in s or "chard" in s or "mizuna" in s or "mustard" in s or "arugula" in s:
        return "Leafy Greens"
    if "herb" in s or "basil" in s or "chives" in s or "parsley" in s:
        return "Herbs"
    if "fruitcrop" in s or "tomato" in s or "cucumber" in s or "pepper" in s:
        return "Fruit Crops"
    if "tubercrop" in s or "radish" in s or "kohlrabi" in s:
        return "Tuber Crops"
    return "Other"

def get_display_name(sample_name, cultivar, crop_category):
    if "arugula_highlight" in sample_name.lower():
        return "Arugula (High Light - 600 µmol)"
    if "arugula_lowlight" in sample_name.lower():
        return "Arugula (Standard Light - 330 µmol)"
    if "cucumber" in sample_name.lower():
        return "Cucumber (Picowell)"
    if "tomato" in sample_name.lower():
        if "1202" in sample_name:
            return "Dwarf Tomato (F1 1202 - Red)"
        if "3496" in sample_name:
            return "Dwarf Tomato (F1 3496B - Orange)"
    if "radish_raxe" in sample_name.lower():
        return "Radish (Raxe)"
    if "radish_lennox" in sample_name.lower():
        return "Radish (Lennox)"
    if "kohlrabi" in sample_name.lower():
        return "Kohlrabi (Delicacy White)"
    if "swisschard" in sample_name.lower():
        return "Swiss Chard (Lucullus)"
    if "frizzylizzy" in sample_name.lower():
        return "Red Mustard (Frizzy Lizzy)"
    if "redgiant" in sample_name.lower():
        return "Red Mustard (Red Giant)"
    if "mizuna" in sample_name.lower():
        return "Mizuna (Early)"
    if "chives" in sample_name.lower():
        return "Chives (Medium Thin)"
    if "parsley" in sample_name.lower():
        return "Parsley (Moss Curled 2)"
    if "basil" in sample_name.lower():
        return "Basil (Dolly)"
    if "batavia" in sample_name.lower():
        return "Lettuce (Batavia - Aficion)"
    if "expertise" in sample_name.lower():
        return "Lettuce (Expertise)"
    if "outredgeous" in sample_name.lower():
        return "Lettuce (Outredgeous)"
    if "waldmanns" in sample_name.lower():
        return "Lettuce (Waldmann's Green)"
    return f"{crop_category} ({cultivar})"

# Nutrient rows: display label, symbol, formula and role. The values themselves
# are read from the raw OSDR record below, never typed in.
NUTRIENT_ROWS = [
    ("ammonium", "Ammonium (NH4+)", "NH4+", "NH4+", "Nitrogen source (vegetative growth)"),
    ("calcium", "Calcium (Ca2+)", "Ca2+", "Ca2+", "Cell wall structural integrity (raised mid-season in the fruit tank after a calcium deficit on tomato, most likely from a poor K:Ca ratio)"),
    ("potassium", "Potassium (K+)", "K+", "K+", "Osmoregulation and fruit enlargement (lowered mid-season in the fruit tank to correct the K:Ca ratio)"),
    ("magnesium", "Magnesium (Mg2+)", "Mg2+", "Mg2+", "Chlorophyll central atom"),
    ("nitrate", "Nitrate (NO3-)", "NO3-", "NO3-", "Primary nitrogen source"),
    ("chloride", "Chloride (Cl-)", "Cl-", "Cl-", "Osmotic and stomatal regulation"),
    ("sulfate", "Sulfate (SO4 2-)", "SO4 2-", "SO4 2-", "Sulfur amino acids (cysteine, methionine)"),
    ("phosphorus", "Phosphorus (P)", "P", "H2PO4-", "Energy transfer (ATP) and root development"),
    ("iron", "Iron (Fe)", "Fe", "Fe-EDDHA", "Enzyme electron transport"),
    ("manganese", "Manganese (Mn)", "Mn", "Mn2+", "Photosystem II water splitting"),
    ("zinc", "Zinc (Zn)", "Zn", "Zn2+", "Auxin synthesis and enzyme activation"),
    ("boron", "Boron (B)", "B", "BO3 3-", "Cell division and floral development"),
    ("copper", "Copper (Cu)", "Cu", "Cu2+", "Plastocyanin in photosynthesis"),
    ("molybdenum", "Molybdenum (Mo)", "Mo", "MoO4 2-", "Nitrate reductase cofactor"),
]
UNIT_LABEL = {"mole": "mol / 100 L", "millimole": "mmol / 100 L"}

def split_followed(value):
    """'0.597 followed by 0.711' -> (0.597, 0.711); a plain number -> (v, v)."""
    if isinstance(value, (int, float)):
        return float(value), float(value)
    parts = [float(x) for x in re.findall(r"[0-9]*\.?[0-9]+", str(value))]
    if not parts:
        return None, None
    return parts[0], parts[-1]

def extract_nutrients(samples):
    """Read both EDEN ISS solutions (Zabel et al. 2020, Table 2) from the sample
    parameter values in the raw record, keyed by the nutrient-treatment factor."""
    recipes = {}
    for sample_obj in samples.values():
        study_sec = sample_obj.get("metadata", {}).get("study", {})
        solution = clean_val(study_sec.get("factor value", {}).get("nutrient treatment"))
        pv = study_sec.get("parameter value", {})
        if solution and solution not in recipes and "ammonium" in pv:
            recipes[solution] = pv
    leafy, fruit = recipes.get("Leafy solution"), recipes.get("Fruit solution")
    if not leafy or not fruit:
        sys.exit("process_data: could not find both nutrient solutions in the raw record")
    rows = []
    for key, label, symbol, formula, role in NUTRIENT_ROWS:
        l0, _ = split_followed(leafy[key]["#"])
        f0, f1 = split_followed(fruit[key]["#"])
        rows.append({"element_ion": label, "symbol": symbol, "formula": formula,
                     "unit": UNIT_LABEL.get(leafy[key].get("unit"), leafy[key].get("unit")),
                     "tank1_leafy": l0, "tank2_fruit_initial": f0, "tank2_fruit_adjusted": f1,
                     "role": role})
    return rows

def process():
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    os.makedirs(DOCS_DATA_DIR, exist_ok=True)
    
    with open(RAW_FILE, "r", encoding="utf-8") as f:
        raw_json = json.load(f)
        
    study_id = "OSD-895"
    assay_key = "OSD-895_germination-and-growth-assesment_plant-material-biomass_ECSO"
    samples = raw_json[study_id]["assays"][assay_key]["samples"]
    
    crops_records = []
    
    for sample_id, sample_obj in samples.items():
        meta = sample_obj.get("metadata", {})
        study_sec = meta.get("study", {})
        assay_sec = meta.get("assay", {})
        
        char = study_sec.get("characteristics", {})
        study_pv = study_sec.get("parameter value", {})
        assay_pv = assay_sec.get("parameter value", {})
        
        organism = clean_val(char.get("organism"))
        ncbi_tax_id = None
        tax_acc = char.get("organism", {}).get("term accession number", "")
        if tax_acc:
            match = re.search(r'(\d+)$', tax_acc)
            if match:
                ncbi_tax_id = int(match.group(1))
                
        cultivar = clean_val(char.get("cultivar"))
        seed_source = clean_val(char.get("seed source"))
        organism_part = clean_val(char.get("organism part"))
        
        crop_category = get_crop_category(sample_id, cultivar)
        display_name = get_display_name(sample_id, cultivar, crop_category)
        
        # Cultivation parameters
        growth_medium = clean_val(study_pv.get("growth medium"))
        light_intensity = clean_val(study_pv.get("light intensity"))
        growth_temp = clean_val(study_pv.get("mean growth temperature"))
        growth_time_days = clean_val(study_pv.get("mean growth time"))
        planting_density = clean_val(study_pv.get("planting density"))
        nutrient_solution = clean_val(study_sec.get("factor value", {}).get("nutrient treatment"))
        cycles_evaluated = clean_val(study_pv.get("cycles evaluated"))
        harvest_type = clean_val(study_pv.get("harvest type"))
        
        # Biomass values
        mean_yield_kg_m2 = clean_val(assay_pv.get("mean edible freshweight"))
        yield_range_str = clean_val(assay_pv.get("edible freshweight range"))
        yield_min_kg_m2, yield_max_kg_m2 = parse_range(yield_range_str)
        
        edible_dw_ratio_pct = clean_val(assay_pv.get("edible biomass dry weight ratio"))
        belowground_dw_ratio_pct = clean_val(assay_pv.get("inedible belowground biomass dry weight ratio"))
        aboveground_dw_ratio_pct = clean_val(assay_pv.get("inedible aboveground biomass dry weight ratio"))
        
        aboveground_dry_biomass_g_m2 = clean_val(assay_pv.get("aboveground dry biomass"))
        belowground_dry_biomass_g_m2 = clean_val(assay_pv.get("belowground dry biomass"))
        
        # Calculate daily edible productivity (g / m2 / day)
        daily_prod_g_m2_day = None
        if mean_yield_kg_m2 is not None and growth_time_days is not None and growth_time_days > 0:
            daily_prod_g_m2_day = round((mean_yield_kg_m2 * 1000.0) / growth_time_days, 2)
            
        record = {
            "sample_id": sample_id,
            "display_name": display_name,
            "crop_category": crop_category,
            "organism": organism,
            "ncbi_taxonomy_id": ncbi_tax_id,
            "cultivar": cultivar,
            "seed_source": seed_source,
            "organism_part": organism_part,
            "growth_medium": growth_medium,
            "harvest_type": harvest_type,
            "cycles_evaluated": cycles_evaluated,
            "photoperiod_hours": 17,
            "dark_period_hours": 7,
            "light_intensity_umol_m2_s": light_intensity,
            "temperature_photoperiod_c": growth_temp,
            "relative_humidity_pct": 65,
            "planting_density_plants_m2": planting_density,
            "growth_time_days": round(growth_time_days, 1) if growth_time_days else None,
            "mean_edible_yield_kg_m2": mean_yield_kg_m2,
            "edible_yield_min_kg_m2": yield_min_kg_m2,
            "edible_yield_max_kg_m2": yield_max_kg_m2,
            "daily_edible_productivity_g_m2_day": daily_prod_g_m2_day,
            "edible_dw_ratio_pct": edible_dw_ratio_pct,
            "belowground_dw_ratio_pct": belowground_dw_ratio_pct,
            "aboveground_dw_ratio_pct": aboveground_dw_ratio_pct,
            "aboveground_dry_biomass_g_m2": aboveground_dry_biomass_g_m2,
            "belowground_dry_biomass_g_m2": belowground_dry_biomass_g_m2,
            "nutrient_solution": nutrient_solution
        }
        crops_records.append(record)
        
    # Sort crops by category then display name
    crops_records.sort(key=lambda x: (x["crop_category"], x["display_name"]))
    
    # Save CSV
    csv_file = os.path.join(PROCESSED_DIR, "eden_iss_crops.csv")
    fieldnames = list(crops_records[0].keys())
    with open(csv_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(crops_records)
    print(f"Saved {csv_file}")
    
    # Save JSON
    json_file = os.path.join(PROCESSED_DIR, "eden_iss_crops.json")
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(crops_records, f, indent=2)
    print(f"Saved {json_file}")
    
    # Copy JSON to docs/data for GitHub Pages
    docs_json = os.path.join(DOCS_DATA_DIR, "eden_iss_crops.json")
    with open(docs_json, "w", encoding="utf-8") as f:
        json.dump(crops_records, f, indent=2)
    print(f"Saved {docs_json}")
    
    # Save Parquet if pyarrow/fastparquet available
    parquet_file = os.path.join(PROCESSED_DIR, "eden_iss_crops.parquet")
    try:
        import pandas as pd
        df = pd.DataFrame(crops_records)
        df.to_parquet(parquet_file, index=False)
        print(f"Saved {parquet_file}")
    except ImportError:
        print("Note: pandas/pyarrow not installed in environment; skipping parquet conversion.")
        
    # Build nutrient_solutions.csv (Table 2 of Zabel et al. 2020), read from the
    # raw OSDR record. An earlier hand-typed table had the fruit-tank column wrong
    # and copied the leafy micronutrients into it.
    nutrients = extract_nutrients(samples)
    nutrient_csv = os.path.join(PROCESSED_DIR, "nutrient_solutions.csv")
    with open(nutrient_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(nutrients[0].keys()))
        writer.writeheader()
        writer.writerows(nutrients)
    print(f"Saved {nutrient_csv}")
    
    # Save nutrient JSON for dashboard
    docs_nutrients = os.path.join(DOCS_DATA_DIR, "nutrient_solutions.json")
    with open(docs_nutrients, "w", encoding="utf-8") as f:
        json.dump(nutrients, f, indent=2)
    print(f"Saved {docs_nutrients}")
    
    # Build space_analog_comparison.csv (Table 10 from Zabel et al. 2020)
    comparisons = [
        {"facility": "EDEN ISS MTF", "location": "Neumayer Station III, Antarctica", "year": "2018", "crop_profile": "Mixed (21% lettuce, 18% greens, 25% cucumber, 14% tomato, 10% tubers, 5% herbs, 7% misc)", "daily_edible_productivity_kg_m2_d": 0.075, "daily_edible_productivity_excl_pepper_kg_m2_d": 0.089, "reference": "Zabel et al. (2020), Front. Plant Sci."},
        {"facility": "South Pole Food Growth Chamber (SPFGC)", "location": "Amundsen-Scott South Pole Station", "year": "2006", "crop_profile": "High cucumber & lettuce (41% cucumber, 32% lettuce, 6% herbs, 4% tomato, 17% other)", "daily_edible_productivity_kg_m2_d": 0.130, "daily_edible_productivity_excl_pepper_kg_m2_d": 0.130, "reference": "Patterson et al. (2012), Acta Hortic."},
        {"facility": "NASA Kennedy Biomass Production Chamber (BPC)", "location": "KSC, Florida, USA", "year": "2008", "crop_profile": "Monoculture batches (Lettuce, Tomato, Wheat, Potato, Soybean)", "daily_edible_productivity_kg_m2_d": 0.170, "daily_edible_productivity_excl_pepper_kg_m2_d": 0.170, "reference": "Wheeler et al. (2008), Adv. Space Res."},
        {"facility": "Lunar Palace 1 (V-LP1)", "location": "Beihang University, Beijing, China", "year": "2016", "crop_profile": "Bioregenerative multi-crop life support system", "daily_edible_productivity_kg_m2_d": 0.068, "daily_edible_productivity_excl_pepper_kg_m2_d": 0.068, "reference": "Fu et al. (2016), Astrobiology"},
        {"facility": "Closed Ecology Experiment Facilities (CEEF)", "location": "Rokkasho, Aomori, Japan", "year": "2005", "crop_profile": "Human habitation closed ecology trials", "daily_edible_productivity_kg_m2_d": 0.095, "daily_edible_productivity_excl_pepper_kg_m2_d": 0.095, "reference": "Masuda et al. (2005), Eco Eng."}
    ]
    comp_csv = os.path.join(PROCESSED_DIR, "space_analog_comparison.csv")
    with open(comp_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(comparisons[0].keys()))
        writer.writeheader()
        writer.writerows(comparisons)
    print(f"Saved {comp_csv}")
    
    docs_comp = os.path.join(DOCS_DATA_DIR, "space_analog_comparison.json")
    with open(docs_comp, "w", encoding="utf-8") as f:
        json.dump(comparisons, f, indent=2)
    print(f"Saved {docs_comp}")
    
    # Build greenhouse_summary.json
    summary = {
        "study_accession": "OSD-895",
        "lsds_identifier": "LSDS-160",
        "study_doi": "10.26030/8556-mr78",
        "paper_doi": "10.3389/fpls.2020.00656",
        "pmc_id": "PMC7264257",
        "facility_name": "Future Exploration Greenhouse (FEG) - EDEN ISS Mobile Test Facility",
        "operator": "Paul Zabel (DLR Institute of Space Systems)",
        "location": "Neumayer Station III, Atka Bay, Antarctica (70°40' S, 08°16' W)",
        "mission_start": "2018-02-07",
        "mission_end": "2018-11-20",
        "duration_days": 286,
        "cultivation_area_m2": 12.5,
        "total_cultivation_trays": 38,
        "winter_over_crew_size": 10,
        "total_fresh_edible_biomass_kg": 268.0,
        "total_dry_inedible_biomass_kg": 11.2,
        "season_yield_kg_m2": 21.44,
        "annualized_yield_kg_m2_per_year": 27.4,
        "mean_daily_productivity_kg_m2_d": 0.075,
        "mean_daily_productivity_excl_pepper_kg_m2_d": 0.089,
        "yield_note": "21.44 kg/m2 is the measured 286-day season (268 kg / 12.5 m2, paper Discussion); 27.4 kg/m2 is the abstract's annualized figure (0.075 kg/m2/d x 365).",
        "harvest_by_category_kg": {
            "fruit_crops": 105.4,
            "lettuce": 56.4,
            "leafy_greens": 49.1,
            "tuber_crops": 26.8,
            "herbs": 12.2,
            "miscellaneous_crops": 18.4,
            "source": "Zabel et al. 2020, Results (Overview); sums to 268.3 kg"
        },
        "harvest_by_crop_kg": {
            "cucumber": 67,
            "lettuce": 56,
            "leafy_greens": 49,
            "tomato": 50,
            "herbs": 12,
            "radish": 8,
            "kohlrabi": 19,
            "source": "Zabel et al. 2020, Abstract and OSD-895 study description; rounded, sums to 261 kg"
        },
        "harvest_note": "The paper's two breakdowns do not reconcile: the Abstract's cucumber (67 kg) and tomato (50 kg) total 117 kg, while the Results give 105.4 kg for all fruit crops. Both are reproduced as published; neither is corrected here.",
        "environmental_parameters": {
            "photoperiod_hours": 17,
            "dark_period_hours": 7,
            "air_temperature_photoperiod_c": 21.0,
            "air_temperature_dark_c": 19.0,
            "relative_humidity_pct": 65.0,
            "co2_ppm_setpoint": 1000,
            "co2_ppm_observed_range": "1000 - 4000",
            "lighting_technology": "Liquid-cooled LED (Heliospectra LX601 modified)",
            "lighting_spectrum": "Blue (~450 nm) and Red (~650 nm) dominant",
            "irrigation_technology": "Hybrid aeroponic misting (30s every 6 min) & nutrient film (NFT)"
        }
    }
    summary_file = os.path.join(PROCESSED_DIR, "greenhouse_summary.json")
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"Saved {summary_file}")
    
    docs_summary = os.path.join(DOCS_DATA_DIR, "greenhouse_summary.json")
    with open(docs_summary, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"Saved {docs_summary}")
    print("\nData processing completed successfully!")

if __name__ == "__main__":
    process()
