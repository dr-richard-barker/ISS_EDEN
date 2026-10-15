#!/usr/bin/env python3
"""
fetch_osdr_data.py
Script to fetch the latest dataset metadata and sample parameters
from the NASA Open Science Data Repository (OSDR) for study OSD-895.
"""

import os
import sys
import json
import urllib.request
import urllib.error

STUDY_ID = "OSD-895"
API_URL = f"https://visualization.osdr.nasa.gov/biodata/api/v2/dataset/{STUDY_ID}/assay/*/sample/*/"
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "raw", f"{STUDY_ID}_metadata.json")

def fetch_data():
    print(f"Fetching metadata for {STUDY_ID} from NASA OSDR API...")
    req = urllib.request.Request(
        API_URL,
        headers={"User-Agent": "ISS-EDEN-FAIR-Project/1.0 (Open Science Researcher)"}
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            if response.status != 200:
                print(f"Error: HTTP {response.status}", file=sys.stderr)
                sys.exit(1)
            raw_text = response.read().decode("utf-8")
            data = json.loads(raw_text)
            
        os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
        with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        samples = data.get(STUDY_ID, {}).get("assays", {}).get("OSD-895_germination-and-growth-assesment_plant-material-biomass_ECSO", {}).get("samples", {})
        print(f"Successfully downloaded {len(samples)} sample records to {OUTPUT_PATH}")
    except urllib.error.URLError as e:
        print(f"Network error fetching data: {e}", file=sys.stderr)
        print("Note: If running in restricted sandbox mode, use pre-cached raw data.", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    fetch_data()
