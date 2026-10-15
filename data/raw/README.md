# Raw Data Provenance: NASA OSDR OSD-895

## Source Details
- **Repository**: NASA Open Science Data Repository (OSDR)
- **Study Accession**: [OSD-895](https://osdr.nasa.gov/bio/repo/data/studies/OSD-895)
- **Legacy Accession**: LSDS-160
- **Study DOI**: [10.26030/8556-mr78](https://doi.org/10.26030/8556-mr78)
- **Associated Journal Article**: Zabel P, Zeidler C, Vrakking V, Dorn M, Schubert D. (2020). *Biomass Production of the EDEN ISS Space Greenhouse in Antarctica During the 2018 Experiment Phase*. **Frontiers in Plant Science**, 11:656. [doi:10.3389/fpls.2020.00656](https://doi.org/10.3389/fpls.2020.00656) / [PMC7264257](https://pmc.ncbi.nlm.nih.gov/articles/PMC7264257/).
- **Funding**: The EDEN ISS project received funding from the European Union's Horizon 2020 Research and Innovation program under grant agreement No 636501.

## API Endpoint Queried
```http
GET https://visualization.osdr.nasa.gov/biodata/api/v2/dataset/OSD-895/assay/*/sample/*/
```

## Raw Contents
- `OSD-895_metadata.json`: Full nested JSON representation of all 19 crop sample assays, containing:
  - Taxonomic identifiers (NCBITAXON)
  - Cultivation parameters (medium, light cycle, light intensity, photoperiod, temperature, humidity, planting density)
  - Nutrient solution formulations (14 macro- and micronutrients)
  - Harvest and biomass measurements (mean edible fresh weight, ranges, edible dry weight ratio, inedible aboveground and belowground dry biomass)
  - Study and investigation protocol metadata
