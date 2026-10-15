# EDEN ISS Antarctic Space Greenhouse: FAIR Biomass Data Repository & Explorer

[![FAIR Data](https://img.shields.io/badge/FAIR-Findable%20%7C%20Accessible%20%7C%20Interoperable%20%7C%20Reusable-emerald.svg)](https://www.go-fair.org/fair-principles/)
[![NASA OSDR](https://img.shields.io/badge/NASA%20OSDR-OSD--895-0284c7.svg)](https://osdr.nasa.gov/bio/repo/data/studies/OSD-895)
[![DOI](https://img.shields.io/badge/Dataset%20DOI-10.26030%2F8556--mr78-blue.svg)](https://doi.org/10.26030/8556-mr78)
[![Paper DOI](https://img.shields.io/badge/Frontiers-10.3389%2Ffpls.2020.00656-rose.svg)](https://doi.org/10.3389/fpls.2020.00656)
[![PMC](https://img.shields.io/badge/PMC-PMC7264257-purple.svg)](https://pmc.ncbi.nlm.nih.gov/articles/PMC7264257/)
[![License: CC-BY 4.0](https://img.shields.io/badge/Data%20License-CC--BY--4.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![License: MIT](https://img.shields.io/badge/Code%20License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> An open, organized, and **FAIR (Findable, Accessible, Interoperable, Reusable)** data repository and interactive **GitHub Pages data explorer** for crop biomass yields, growth parameters, and environmental profiles from the **EDEN ISS Antarctic Space Greenhouse** (Neumayer Station III, Antarctica).

---

## 🌟 Interactive GitHub Pages Dashboard

The repository includes a ready-to-deploy static web application in [`docs/`](docs/):

👉 **Live Dashboard**: **[https://dr-richard-barker.github.io/ISS_EDEN/](https://dr-richard-barker.github.io/ISS_EDEN/)**

### Key Dashboard Features:
1. **Interactive Crop Productivity Matrix**:
   - Compare all 19 crop evaluation cohorts across daily productivity ($g/m^2/day$), fresh yield ($kg/m^2$), cultivation duration (days), and dry weight ratio (%).
   - Dynamic filtering by crop grouping (Lettuce, Leafy Greens, Herbs, Fruit Crops, Tuber Crops).
2. **Controlled Environment Experiments**:
   - **Light Intensity Experiment**: Visualizes the $49\%$ productivity surge in Arugula under high light ($600\ \mu mol/m^2/s$) vs. standard light ($330\ \mu mol/m^2/s$).
   - **Nutrient Formulations (Table 2)**: Side-by-side comparison of Bulk Tank 1 (Leafy) and Tank 2 (Fruit with mission-adjusted $Ca^{2+}:K^+$ balance).
3. **Space Analog Facility Benchmark**:
   - Comparative analysis against the South Pole Food Growth Chamber (SPFGC), NASA Kennedy Biomass Production Chamber (BPC), Beihang Lunar Palace 1, and CEEF Japan (Table 10).
4. **Space Mission Life-Support (ECLSS) Diet & Area Sizing Calculator**:
   - Input your astronaut crew size ($N$), target daily fresh produce ration ($g/day$), and mission duration ($days$).
   - Computes active greenhouse area ($m^2$), total harvest biomass ($kg$), daily evapotranspiration water recycling load ($L/day$), and footprint ratio relative to the EDEN ISS testbed.
5. **CoSE Design System & Light/Dark Mode Switcher**:
   - Styled with the clean scientific palette of CoSE (Collaborative Science Environment): Deep Teal (`#004053`), Primary Blue (`#0F7F9F`), and Facets (`#5590AD`, `#CCD9DD`, `#1E404F`).
   - 1-click **Light/Dark theme toggle** with dynamic Chart.js re-theming and `localStorage` persistence (no side navigation panel).
6. **Instant Data Table & 1-Click FAIR Downloads**:
   - Searchable and sortable records with taxonomic ontology links.
   - 1-click download buttons for `CSV`, `JSON`, and Frictionless `datapackage.json`.

---

## 🚀 How to Enable GitHub Pages

To publish the interactive dashboard on your GitHub account:

1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: complete FAIR EDEN ISS data repository and explorer"
   git branch -M main
   git remote add origin https://github.com/dr-richard-barker/ISS_EDEN.git
   git push -u origin main
   ```
2. In your GitHub repository, navigate to **Settings** &rarr; **Pages** (under *Code and automation*).
3. Under **Build and deployment**:
   - **Source**: Select `Deploy from a branch`
   - **Branch**: Select `main` and folder `/docs`
   - Click **Save**
4. Within 1–2 minutes, your dashboard will be live at `https://<your-username>.github.io/ISS_EDEN/`!
*(Alternatively, you can enable GitHub Actions deployment via `.github/workflows/deploy-pages.yml`).*

---

## 📊 Mission Overview & Key Metrics

The **Future Exploration Greenhouse (FEG)** of the EDEN ISS Mobile Test Facility operated near Neumayer Station III (70°40' S, 08°16' W) during the 2018 experiment campaign (Feb 7 – Nov 20, 2018; 286 days).

| Metric | Measured Value | Scientific Relevance for Space Missions |
| :--- | :--- | :--- |
| **Total Fresh Harvest** | **268.0 kg** | Fresh salad and vegetables supplying a 10-person overwintering crew. |
| **Cultivation Footprint** | **12.5 m²** | 38 multi-tier independently lit plant cultivation trays. |
| **Mission Duration** | **286 days** | Multi-season Antarctic winter analog testing autonomous operations. |
| **Facility Productivity** | **75.0 g/m²/d** | Total average yield rate (rises to **89.0 g/m²/d** excluding trial peppers). |
| **Inedible Dry Biomass** | **11.2 kg** | Root and stem waste for bio-regenerative nutrient recycling loops. |
| **Atmospheric Setpoints** | **21°C / 19°C** | 17h:7h photoperiod, 65% RH, 1000–4000 ppm $CO_2$ (elevated by operator respiration). |
| **Irrigation System** | **Aeroponic misting** | 30 s misting every 6 min with run-off nutrient film technique (NFT). |

---

## 🏛️ FAIR Compliance Architecture

| FAIR Pillar | Implementation | Location in Repository |
| :--- | :--- | :--- |
| **Findable (F)** | • Global DOIs documented (`10.26030/8556-mr78`, `10.3389/fpls.2020.00656`)<br>• Frictionless `datapackage.json`<br>• Embedded `schema.org` Dataset in JSON-LD<br>• Machine-readable `CITATION.cff` | [`data/metadata/datapackage.json`](data/metadata/datapackage.json)<br>[`docs/index.html`](docs/index.html)<br>[`CITATION.cff`](CITATION.cff) |
| **Accessible (A)** | • Open protocols (HTTPS, Git)<br>• Tidy CSV, Parquet, and JSON formats without proprietary barriers<br>• Static browser-based visualization (no database or server required) | [`data/processed/`](data/processed/)<br>[`docs/`](docs/) |
| **Interoperable (I)** | • Ontologies mapped: NCBI Taxonomy (`NCBITaxon`), Unit Ontology (`UO`), Experimental Factor Ontology (`EFO`), ChEBI, and ECSO<br>• Schema aligned with NASA GeneLab/OSDR standards | [`data/metadata/ontologies.json`](data/metadata/ontologies.json)<br>[`data/data_dictionary.md`](data/data_dictionary.md) |
| **Reusable (R)** | • Unambiguous Open Science Dual Licensing: CC-BY 4.0 (Data) + MIT (Software)<br>• Full Data Dictionary with protocols and units<br>• Automated, reproducible ETL pipeline | [`LICENSE`](LICENSE)<br>[`data/data_dictionary.md`](data/data_dictionary.md)<br>[`scripts/process_data.py`](scripts/process_data.py) |

---

## 📁 Repository Directory Structure

```text
ISS_EDEN/
├── .github/
│   └── workflows/
│       ├── deploy-pages.yml          # GitHub Actions deployment to Pages
│       └── validate-data.yml         # CI schema and data validation
├── data/
│   ├── raw/
│   │   ├── OSD-895_metadata.json     # Raw JSON extract from NASA OSDR API
│   │   └── README.md                 # Provenance, download timestamp, and URLs
│   ├── processed/
│   │   ├── eden_iss_crops.csv        # Primary tidy dataset (19 crop cohorts)
│   │   ├── eden_iss_crops.json       # Structured JSON dataset
│   │   ├── nutrient_solutions.csv    # Chemical formulation of Tank 1 & Tank 2 (Table 2)
│   │   ├── space_analog_comparison.csv # Performance across space analog facilities (Table 10)
│   │   └── greenhouse_summary.json   # High-level facility telemetry & harvest metrics
│   ├── metadata/
│   │   ├── datapackage.json          # Frictionless Data Package definition
│   │   └── ontologies.json           # Semantic ontology cross-walk table
│   └── data_dictionary.md            # Comprehensive variable codebook & units
├── docs/                             # GitHub Pages static web application
│   ├── index.html                    # Responsive single-page dashboard with schema.org
│   ├── app.js                        # Chart.js charts, filters, & ECLSS calculator logic
│   ├── styles.css                    # Space-themed high-contrast responsive styling
│   └── data/                         # Web-accessible JSON and CSV datasets
├── notebooks/
│   ├── 01_exploratory_data_analysis.ipynb # Jupyter notebook for biomass analysis
│   └── requirements.txt              # Analysis Python dependencies
├── scripts/
│   ├── fetch_osdr_data.py            # API client to refresh NASA OSDR data
│   └── process_data.py               # Reproducible ETL & metric derivation script
├── CITATION.cff                      # Academic Citation File Format
├── LICENSE                           # Dual MIT (Code) + CC-BY 4.0 (Data)
├── README.md                         # Project documentation (this file)
└── pyproject.toml                    # Python project configuration
```

---

## 🛠️ Local Development & Quickstart

### 1. View Dashboard Locally
To preview the GitHub Pages dashboard on your local machine:
```bash
python3 -m http.server 8000 --directory docs
```
Then open your browser to **`http://localhost:8000`**.

### 2. Re-run Data Extraction Pipeline
To re-process the raw NASA OSDR metadata and re-generate processed datasets:
```bash
python3 scripts/process_data.py
```

### 3. Run Jupyter Analysis Notebook
Install dependencies and launch Jupyter:
```bash
pip install -r notebooks/requirements.txt
jupyter notebook notebooks/01_exploratory_data_analysis.ipynb
```

---

## 📖 Citation & Academic Attribution

If you use this dataset, web dashboard, or code in your research or mission design studies, please cite both the primary publication and the NASA OSDR dataset:

```bibtex
@article{zabel2020biomass,
  title={Biomass Production of the EDEN ISS Space Greenhouse in Antarctica During the 2018 Experiment Phase},
  author={Zabel, Paul and Zeidler, Conrad and Vrakking, Vincent and Dorn, Matthew and Schubert, Daniel},
  journal={Frontiers in Plant Science},
  volume={11},
  pages={656},
  year={2020},
  publisher={Frontiers},
  doi={10.3389/fpls.2020.00656},
  pmcid={PMC7264257}
}

@dataset{osd895_eden_iss,
  title={OSD-895: Biomass Production of the EDEN ISS Space Greenhouse in Antarctica During the 2018 Experiment Phase},
  author={Zabel, Paul and Zeidler, Conrad and Vrakking, Vincent and Dorn, Matthew and Schubert, Daniel},
  year={2020},
  publisher={NASA Open Science Data Repository},
  doi={10.26030/8556-mr78}
}
```

---

## 📄 License
- **Data & Documentation**: [Creative Commons Attribution 4.0 International (CC-BY 4.0)](https://creativecommons.org/licenses/by/4.0/)
- **Source Code & Web Application**: [MIT License](LICENSE)
