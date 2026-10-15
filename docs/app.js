/**
 * EDEN ISS Space Greenhouse Data Explorer & ECLSS Calculator
 * CoSE Theme Implementation with Dynamic Light/Dark Theme Switcher
 */

document.addEventListener("DOMContentLoaded", async () => {
  // Global State
  let cropsData = [];
  let nutrientData = [];
  let comparisonData = [];
  let summaryData = {};
  
  let currentCategory = "All";
  let currentMetric = "daily_edible_productivity_g_m2_day";
  let sortColumn = "daily_edible_productivity_g_m2_day";
  let sortAscending = false;
  
  let mainChart = null;
  let lightChart = null;
  let nutrientChart = null;
  let compChart = null;

  // CoSE Palette per theme
  const getThemePalette = () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    return {
      isDark,
      text: isDark ? "#E3ECEF" : "#12303A",
      textMuted: isDark ? "#8AA3AB" : "#6C858D",
      grid: isDark ? "rgba(35, 64, 74, 0.6)" : "rgba(213, 224, 228, 0.8)",
      tooltipBg: isDark ? "#122730" : "#FFFFFF",
      tooltipBorder: isDark ? "#345561" : "#B7C8CE",
      tooltipText: isDark ? "#E3ECEF" : "#12303A",
      accent: isDark ? "#3FA9C7" : "#0F7F9F",
      categories: {
        "Lettuce": isDark ? "#3FA9C7" : "#0F7F9F",
        "Leafy Greens": isDark ? "#7EA5BD" : "#004053",
        "Herbs": isDark ? "#5590AD" : "#668C98",
        "Fruit Crops": isDark ? "#F87171" : "#D9534F",
        "Tuber Crops": isDark ? "#FBBF24" : "#E67E22"
      }
    };
  };

  // Metric Labels & Formats
  const metricConfigs = {
    "daily_edible_productivity_g_m2_day": {
      label: "Daily Productivity (g/m²/day)",
      unit: "g/m²/d",
      description: "Time-normalized daily edible fresh biomass rate"
    },
    "mean_edible_yield_kg_m2": {
      label: "Mean Edible Yield (kg/m²)",
      unit: "kg/m²",
      description: "Fresh edible biomass per cultivation area"
    },
    "growth_time_days": {
      label: "Growth Cycle Duration (Days)",
      unit: "days",
      description: "Mean cycle length from sowing/nursery to harvest"
    },
    "edible_dw_ratio_pct": {
      label: "Dry Weight Ratio (%)",
      unit: "%",
      description: "Lyophilized dry mass percentage"
    }
  };

  // 1. Data Fetching
  async function loadData() {
    try {
      const [cropsRes, nutRes, compRes, sumRes] = await Promise.all([
        fetch("data/eden_iss_crops.json"),
        fetch("data/nutrient_solutions.json"),
        fetch("data/space_analog_comparison.json"),
        fetch("data/greenhouse_summary.json")
      ]);
      
      cropsData = await cropsRes.json();
      nutrientData = await nutRes.json();
      comparisonData = await compRes.json();
      summaryData = await sumRes.json();
      
      initTheme();
      initDashboard();
    } catch (err) {
      console.warn("Fetch failed, attempting fallback error display:", err);
      showErrorState(err);
    }
  }

  function showErrorState(err) {
    const mainSection = document.querySelector("main");
    const alert = document.createElement("div");
    alert.style.padding = "1.5rem";
    alert.style.margin = "1rem 0";
    alert.style.background = "var(--surface-2)";
    alert.style.border = "1px solid var(--line-strong)";
    alert.style.borderRadius = "var(--radius)";
    alert.style.color = "var(--ink)";
    alert.innerHTML = `
      <strong>Notice:</strong> Unable to load local JSON files via fetch (${err.message}).
      If you opened index.html directly via <code>file://</code>, please run a local web server:
      <code>python3 -m http.server 8000 --directory docs</code> then open <code>http://localhost:8000</code>.
    `;
    mainSection.prepend(alert);
  }

  // 2. CoSE Theme Switcher (Light / Dark)
  function initTheme() {
    const savedTheme = localStorage.getItem("cose-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");

    setTheme(initialTheme, false);

    const toggleBtn = document.getElementById("themeToggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme") || "light";
        const newTheme = current === "dark" ? "light" : "dark";
        setTheme(newTheme, true);
      });
    }
  }

  function setTheme(theme, updateCharts = true) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("cose-theme", theme);

    const themeIcon = document.getElementById("themeIcon");
    const themeLabel = document.getElementById("themeLabel");
    if (themeIcon && themeLabel) {
      if (theme === "dark") {
        themeIcon.textContent = "☀️";
        themeLabel.textContent = "Light";
      } else {
        themeIcon.textContent = "🌙";
        themeLabel.textContent = "Dark";
      }
    }

    if (updateCharts) {
      rethemeAllCharts();
    }
  }

  function rethemeAllCharts() {
    const pal = getThemePalette();

    const updateChartColors = (chart) => {
      if (!chart) return;
      if (chart.options.scales.x) {
        chart.options.scales.x.ticks.color = pal.textMuted;
        if (chart.options.scales.x.grid) chart.options.scales.x.grid.color = pal.grid;
      }
      if (chart.options.scales.y) {
        chart.options.scales.y.ticks.color = pal.textMuted;
        if (chart.options.scales.y.grid) chart.options.scales.y.grid.color = pal.grid;
        if (chart.options.scales.y.title) chart.options.scales.y.title.color = pal.text;
      }
      if (chart.options.plugins.tooltip) {
        chart.options.plugins.tooltip.backgroundColor = pal.tooltipBg;
        chart.options.plugins.tooltip.borderColor = pal.tooltipBorder;
        chart.options.plugins.tooltip.titleColor = pal.tooltipText;
        chart.options.plugins.tooltip.bodyColor = pal.tooltipText;
      }
      if (chart.options.plugins.legend && chart.options.plugins.legend.labels) {
        chart.options.plugins.legend.labels.color = pal.text;
      }
      chart.update();
    };

    updateMainChart();
    updateChartColors(lightChart);
    updateChartColors(nutrientChart);
    updateChartColors(compChart);
  }

  // 3. Initialize Dashboard
  function initDashboard() {
    setupFilters();
    renderMainChart();
    renderLightExperimentChart();
    renderNutrientChart();
    renderComparisonChart();
    renderTable();
    initCalculator();
    setupTableSearch();
    setupCitationCopy();
  }

  // 4. Filter Controls
  function setupFilters() {
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        filterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentCategory = btn.getAttribute("data-category");
        updateMainChart();
        renderTable();
      });
    });

    const metricSelect = document.getElementById("metricSelect");
    if (metricSelect) {
      metricSelect.addEventListener("change", (e) => {
        currentMetric = e.target.value;
        updateMainChart();
      });
    }
  }

  // 5. Main Crop Chart
  function getFilteredCrops() {
    if (currentCategory === "All") return cropsData;
    return cropsData.filter(c => c.crop_category === currentCategory);
  }

  function renderMainChart() {
    const ctx = document.getElementById("mainCropChart");
    if (!ctx) return;

    const pal = getThemePalette();
    const filtered = getFilteredCrops();
    const sorted = [...filtered].sort((a, b) => (b[currentMetric] || 0) - (a[currentMetric] || 0));

    const labels = sorted.map(c => c.display_name);
    const dataValues = sorted.map(c => c[currentMetric] || 0);
    const bgColors = sorted.map(c => pal.categories[c.crop_category] || pal.accent);

    const cfg = metricConfigs[currentMetric];

    mainChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: cfg.label,
          data: dataValues,
          backgroundColor: bgColors,
          borderWidth: 0,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: pal.tooltipBg,
            borderColor: pal.tooltipBorder,
            borderWidth: 1,
            titleColor: pal.tooltipText,
            bodyColor: pal.tooltipText,
            titleFont: { size: 13, weight: "600", family: "IBM Plex Sans" },
            bodyFont: { size: 12, family: "IBM Plex Sans" },
            padding: 10,
            callbacks: {
              afterLabel: function(ctx) {
                const item = sorted[ctx.dataIndex];
                return [
                  `Category: ${item.crop_category}`,
                  `Species: ${item.organism}`,
                  `Growth Days: ${item.growth_time_days} d`,
                  `Harvest Type: ${item.harvest_type}`,
                  `Plant Density: ${item.planting_density_plants_m2} plants/m²`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: pal.textMuted,
              font: { size: 11, family: "IBM Plex Sans" },
              maxRotation: 45,
              minRotation: 25
            }
          },
          y: {
            grid: { color: pal.grid },
            ticks: {
              color: pal.textMuted,
              font: { size: 11, family: "IBM Plex Mono" }
            },
            title: {
              display: true,
              text: cfg.label,
              color: pal.text,
              font: { size: 12, family: "IBM Plex Sans", weight: "600" }
            }
          }
        }
      }
    });
  }

  function updateMainChart() {
    if (!mainChart) return;
    const pal = getThemePalette();
    const filtered = getFilteredCrops();
    const sorted = [...filtered].sort((a, b) => (b[currentMetric] || 0) - (a[currentMetric] || 0));
    const cfg = metricConfigs[currentMetric];

    mainChart.data.labels = sorted.map(c => c.display_name);
    mainChart.data.datasets[0].label = cfg.label;
    mainChart.data.datasets[0].data = sorted.map(c => c[currentMetric] || 0);
    mainChart.data.datasets[0].backgroundColor = sorted.map(c => pal.categories[c.crop_category] || pal.accent);
    mainChart.options.scales.y.title.text = cfg.label;
    mainChart.options.scales.x.ticks.color = pal.textMuted;
    mainChart.options.scales.y.ticks.color = pal.textMuted;
    mainChart.options.scales.y.grid.color = pal.grid;
    mainChart.options.scales.y.title.color = pal.text;
    mainChart.options.plugins.tooltip.backgroundColor = pal.tooltipBg;
    mainChart.options.plugins.tooltip.borderColor = pal.tooltipBorder;
    mainChart.options.plugins.tooltip.titleColor = pal.tooltipText;
    mainChart.options.plugins.tooltip.bodyColor = pal.tooltipText;
    mainChart.update();
  }

  // 6. Light Intensity Experiment Chart
  function renderLightExperimentChart() {
    const ctx = document.getElementById("lightExpChart");
    if (!ctx) return;

    const pal = getThemePalette();
    const arugulaHigh = cropsData.find(c => c.sample_id.includes("Arugula_highLight"));
    const arugulaLow = cropsData.find(c => c.sample_id.includes("Arugula_lowLight"));

    if (!arugulaHigh || !arugulaLow) return;

    lightChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Standard Light (330 µmol)", "High Light (600 µmol)"],
        datasets: [
          {
            label: "Daily Productivity (g/m²/d)",
            data: [arugulaLow.daily_edible_productivity_g_m2_day, arugulaHigh.daily_edible_productivity_g_m2_day],
            backgroundColor: "#0F7F9F",
            borderRadius: 4
          },
          {
            label: "Total Fresh Yield (kg/m²)",
            data: [arugulaLow.mean_edible_yield_kg_m2, arugulaHigh.mean_edible_yield_kg_m2],
            backgroundColor: "#5590AD",
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: pal.text, font: { size: 12, family: "IBM Plex Sans" } }
          },
          tooltip: {
            backgroundColor: pal.tooltipBg,
            borderColor: pal.tooltipBorder,
            borderWidth: 1,
            titleColor: pal.tooltipText,
            bodyColor: pal.tooltipText
          }
        },
        scales: {
          x: {
            ticks: { color: pal.textMuted, font: { family: "IBM Plex Sans" } },
            grid: { display: false }
          },
          y: {
            grid: { color: pal.grid },
            ticks: { color: pal.textMuted, font: { family: "IBM Plex Mono" } }
          }
        }
      }
    });
  }

  // 7. Nutrient Formulations Chart
  function renderNutrientChart() {
    const ctx = document.getElementById("nutrientChart");
    if (!ctx || !nutrientData.length) return;

    const pal = getThemePalette();
    const macros = nutrientData.filter(n => n.unit.includes("mol / 100 L"));

    nutrientChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: macros.map(m => m.symbol),
        datasets: [
          {
            label: "Tank 1 (Leafy Crops)",
            data: macros.map(m => m.tank1_leafy),
            backgroundColor: "#0F7F9F",
            borderRadius: 4
          },
          {
            label: "Tank 2 (Fruit - Initial)",
            data: macros.map(m => m.tank2_fruit_initial),
            backgroundColor: "#99B2BA",
            borderRadius: 4
          },
          {
            label: "Tank 2 (Fruit - Ca Adjusted)",
            data: macros.map(m => m.tank2_fruit_adjusted),
            backgroundColor: "#004053",
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: pal.text, font: { size: 12, family: "IBM Plex Sans" } } },
          tooltip: {
            backgroundColor: pal.tooltipBg,
            borderColor: pal.tooltipBorder,
            borderWidth: 1,
            titleColor: pal.tooltipText,
            bodyColor: pal.tooltipText,
            callbacks: {
              afterLabel: function(ctx) {
                const item = macros[ctx.dataIndex];
                return `Role: ${item.role}`;
              }
            }
          }
        },
        scales: {
          x: { ticks: { color: pal.textMuted, font: { family: "IBM Plex Mono" } }, grid: { display: false } },
          y: {
            grid: { color: pal.grid },
            ticks: { color: pal.textMuted, font: { family: "IBM Plex Mono" } },
            title: { display: true, text: "Concentration (mol / 100 L)", color: pal.text, font: { family: "IBM Plex Sans" } }
          }
        }
      }
    });
  }

  // 8. Space Analog Comparison Chart
  function renderComparisonChart() {
    const ctx = document.getElementById("comparisonChart");
    if (!ctx || !comparisonData.length) return;

    const pal = getThemePalette();

    compChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: comparisonData.map(c => c.facility),
        datasets: [
          {
            label: "Daily Fresh Biomass (kg/m²/day)",
            data: comparisonData.map(c => c.daily_edible_productivity_kg_m2_d),
            backgroundColor: ["#004053", "#0F7F9F", "#5590AD", "#7EA5BD", "#668C98"],
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: pal.tooltipBg,
            borderColor: pal.tooltipBorder,
            borderWidth: 1,
            titleColor: pal.tooltipText,
            bodyColor: pal.tooltipText,
            callbacks: {
              afterLabel: function(ctx) {
                const item = comparisonData[ctx.dataIndex];
                return [
                  `Location: ${item.location}`,
                  `Crops: ${item.crop_profile}`,
                  `Ref: ${item.reference}`
                ];
              }
            }
          }
        },
        scales: {
          x: { ticks: { color: pal.textMuted, font: { size: 11, family: "IBM Plex Sans" } }, grid: { display: false } },
          y: {
            grid: { color: pal.grid },
            ticks: { color: pal.textMuted, font: { family: "IBM Plex Mono" } },
            title: { display: true, text: "Productivity (kg/m²/day)", color: pal.text, font: { family: "IBM Plex Sans" } }
          }
        }
      }
    });
  }

  // 9. Life-Support ECLSS Sizing Calculator
  function initCalculator() {
    const crewInput = document.getElementById("calcCrew");
    const rationInput = document.getElementById("calcRation");
    const daysInput = document.getElementById("calcDays");
    const strategySelect = document.getElementById("calcStrategy");

    const crewVal = document.getElementById("calcCrewVal");
    const rationVal = document.getElementById("calcRationVal");
    const daysVal = document.getElementById("calcDaysVal");

    function updateCalc() {
      const crew = parseInt(crewInput.value);
      const rationGrams = parseInt(rationInput.value);
      const days = parseInt(daysInput.value);
      const strategy = strategySelect ? strategySelect.value : "mixed";

      if (crewVal) crewVal.textContent = `${crew} Astronauts`;
      if (rationVal) rationVal.textContent = `${rationGrams} g/day/person`;
      if (daysVal) daysVal.textContent = `${days} days`;

      let prodRateGramsM2Day = 75.0;
      if (strategy === "greens_cucumber") prodRateGramsM2Day = 145.0;
      if (strategy === "salad_lettuce") prodRateGramsM2Day = 88.0;

      const dailyCrewTotalGrams = crew * rationGrams;
      const requiredAreaM2 = (dailyCrewTotalGrams / prodRateGramsM2Day);
      const totalFreshKg = (dailyCrewTotalGrams * days) / 1000.0;
      const waterLitersPerDay = (requiredAreaM2 * 2.8);
      const inedibleDryKg = totalFreshKg * 0.042;

      document.getElementById("resAreaM2").textContent = requiredAreaM2.toFixed(1) + " m²";
      document.getElementById("resTotalKg").textContent = totalFreshKg.toFixed(0) + " kg";
      document.getElementById("resWaterLiters").textContent = waterLitersPerDay.toFixed(1) + " L/d";
      document.getElementById("resInedibleKg").textContent = inedibleDryKg.toFixed(1) + " kg";

      const edenMultiple = (requiredAreaM2 / 12.5).toFixed(1);
      const insight = document.getElementById("calcInsightText");
      if (insight) {
        insight.innerHTML = `
          To supply <strong>${crew} crewmembers</strong> with <strong>${rationGrams} g fresh salad daily</strong> 
          requires an active growing area of <strong>${requiredAreaM2.toFixed(1)} m²</strong> 
          (equivalent to <strong>${edenMultiple}×</strong> the 12.5 m² EDEN ISS greenhouse footprint).
        `;
      }
    }

    if (crewInput && rationInput && daysInput) {
      [crewInput, rationInput, daysInput].forEach(inp => inp.addEventListener("input", updateCalc));
      if (strategySelect) strategySelect.addEventListener("change", updateCalc);
      updateCalc();
    }
  }

  // 10. Interactive Data Table
  function renderTable() {
    const tbody = document.getElementById("tableBody");
    if (!tbody) return;

    let filtered = getFilteredCrops();

    const searchInput = document.getElementById("tableSearch");
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    if (query) {
      filtered = filtered.filter(c =>
        c.display_name.toLowerCase().includes(query) ||
        c.organism.toLowerCase().includes(query) ||
        c.cultivar.toLowerCase().includes(query) ||
        c.crop_category.toLowerCase().includes(query) ||
        c.harvest_type.toLowerCase().includes(query) ||
        c.seed_source.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];
      if (valA === null || valA === undefined) valA = -999999;
      if (valB === null || valB === undefined) valB = -999999;
      if (typeof valA === "string") {
        return sortAscending ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAscending ? valA - valB : valB - valA;
    });

    tbody.innerHTML = "";

    filtered.forEach(crop => {
      const tr = document.createElement("tr");
      const catBadgeClass = "badge-" + crop.crop_category.toLowerCase().replace(" ", "-");
      const lightVal = crop.light_intensity_umol_m2_s || 330;

      tr.innerHTML = `
        <td><strong>${crop.display_name}</strong><br><small style="color:var(--muted);font-style:italic;">${crop.organism}</small></td>
        <td><span class="badge-tag ${catBadgeClass}">${crop.crop_category}</span></td>
        <td>${crop.cultivar}</td>
        <td><span style="font-family:var(--mono);font-size:0.75rem;">${crop.harvest_type}</span></td>
        <td style="text-align:right;font-family:var(--mono);"><strong>${crop.daily_edible_productivity_g_m2_day || "-"}</strong></td>
        <td style="text-align:right;font-family:var(--mono);">${crop.mean_edible_yield_kg_m2 ? crop.mean_edible_yield_kg_m2.toFixed(2) : "-"}</td>
        <td style="text-align:right;font-family:var(--mono);">${crop.growth_time_days || "-"}</td>
        <td style="text-align:right;font-family:var(--mono);">${crop.edible_dw_ratio_pct ? crop.edible_dw_ratio_pct + "%" : "-"}</td>
        <td style="text-align:center;"><span style="font-size:0.78rem;color:var(--accent);font-family:var(--mono);">${lightVal} µmol</span></td>
        <td><small style="color:var(--ink-2);">${crop.seed_source || "-"}</small></td>
      `;
      tbody.appendChild(tr);
    });

    const countSpan = document.getElementById("recordCount");
    if (countSpan) countSpan.textContent = `Showing ${filtered.length} of ${cropsData.length} crops`;
  }

  function setupTableSearch() {
    const searchInput = document.getElementById("tableSearch");
    if (searchInput) {
      searchInput.addEventListener("input", () => renderTable());
    }

    const ths = document.querySelectorAll("table.data-table th[data-col]");
    ths.forEach(th => {
      th.addEventListener("click", () => {
        const col = th.getAttribute("data-col");
        if (sortColumn === col) {
          sortAscending = !sortAscending;
        } else {
          sortColumn = col;
          sortAscending = false;
        }
        renderTable();
      });
    });
  }

  // 11. Copy Citation helper
  function setupCitationCopy() {
    const copyBtn = document.getElementById("copyCitationBtn");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const code = document.getElementById("bibtexCode");
        if (code) {
          navigator.clipboard.writeText(code.textContent.trim()).then(() => {
            copyBtn.textContent = "Copied!";
            setTimeout(() => { copyBtn.textContent = "Copy BibTeX"; }, 2000);
          });
        }
      });
    }
  }

  // Start
  loadData();
});
