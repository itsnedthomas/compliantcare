/**
 * CompliantCare CRM - Shopify-Style App
 * Clean, Professional UI with Interactive Map
 */

var CRMApp = {
    currentView: 'dashboard',
    currentPage: 1,
    itemsPerPage: 20,
    filteredFacilities: [],
    map: null,
    markers: [],
    ratingFilter: '',
    careHomesOnly: true, // Global care homes filter - ALWAYS ON
    // Provider state
    providersData: [],
    filteredProviders: [],
    providerPage: 1,
    providersPerPage: 18,
    providerMiniMap: null,

    // Provider modal filter state
    providerModalFilters: [],
    currentProviderForModal: null,

    // People state
    peopleData: [],
    filteredPeople: [],
    peoplePage: 1,
    peoplePerPage: 18,
    currentPersonForModal: null,
    peopleMiniMap: null,

    // Sort state for each view: 'off', 'desc', 'asc'
    propertiesSortState: 'off',
    providersSortState: 'off',
    peopleSortState: 'off',

    init: async function () {
        console.log('CRMApp initializing...');

        // Initialize Supabase client for enrichment queries
        this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        try {
            // Initialize data
            await DataHandler.init();

            // Hide loading
            var loading = document.getElementById('loading-overlay');
            if (loading) {
                loading.style.opacity = '0';
                setTimeout(function () { loading.style.display = 'none'; }, 300);
            }

            // Setup navigation
            this.setupNavigation();

            // Setup search
            this.setupSearch();

            // Setup sort toggles
            this.setupSortToggles();

            // Render dashboard
            this.renderDashboard();

            // Update facilities count
            this.updateFacilitiesCount();

            // Update providers count on init
            this.updateInitialProvidersCount();

            // Check for URL-based provider popup
            this.handleUrlParams();

            // Listen for back/forward navigation
            var self = this;
            window.addEventListener('popstate', function () {
                self.handleUrlParams();
            });

            console.log('CRMApp initialized successfully');

        } catch (error) {
            console.error('Init error:', error);
            var loading = document.getElementById('loading-overlay');
            if (loading) {
                loading.innerHTML = '<div style="text-align:center;color:#ef4444;"><p style="font-size:48px;margin-bottom:16px;">⚠️</p><p>Error loading data</p><p style="font-size:12px;margin-top:8px;">' + error.message + '</p><button onclick="location.reload()" style="margin-top:16px;padding:10px 20px;background:#1a1a1a;color:white;border:none;border-radius:8px;cursor:pointer;">Retry</button></div>';
            }
        }
    },

    handleUrlParams: function () {
        var urlParams = new URLSearchParams(window.location.search);
        var providerId = urlParams.get('provider');

        if (providerId) {
            // Switch to providers view and open the modal
            this.switchView('providers');

            // Need to wait for providers data to be aggregated
            var self = this;
            var checkProviders = function () {
                if (self.providersData && self.providersData.length > 0) {
                    var provider = self.providersData.find(function (p) { return p.id === providerId; });
                    if (provider) {
                        self.showProviderDetail(providerId, true); // true = don't update URL again
                    }
                } else {
                    setTimeout(checkProviders, 100);
                }
            };
            checkProviders();
        }
    },

    updateFacilitiesCount: function () {
        var facilities = this.getGlobalFilteredFacilities();
        var badge = document.getElementById('facilities-count');
        if (badge) badge.textContent = this.formatNumber(facilities.length);
    },

    updateInitialProvidersCount: function () {
        // Calculate providers count without rendering the full view
        var facilities = this.getGlobalFilteredFacilities();
        var providersSet = new Set();
        facilities.forEach(function (f) {
            if (f.provider && f.provider.id) {
                providersSet.add(f.provider.id);
            }
        });
        var badge = document.getElementById('providers-count');
        if (badge) badge.textContent = this.formatNumber(providersSet.size);
    },

    getGlobalFilteredFacilities: function () {
        var facilities = DataHandler.getAllFacilities();
        if (this.careHomesOnly) {
            return facilities.filter(function (f) { return f.isCareHome; });
        }
        return facilities;
    },

    // Settings removed - care homes filter is always on

    refreshCurrentView: function () {
        if (this.currentView === 'dashboard') this.renderDashboard();
        else if (this.currentView === 'list') this.renderListView();
        else if (this.currentView === 'map') this.refreshMap();
        else if (this.currentView === 'analytics') this.renderAnalytics();
        else if (this.currentView === 'providers') this.renderProvidersView();
    },

    refreshMap: function () {
        if (this.map && this.markerCluster) {
            // Re-render map markers using addMapMarkers which clears and recreates
            this.addMapMarkers();
        }
    },

    formatNumber: function (num) {
        return (num || 0).toLocaleString();
    },

    setupNavigation: function () {
        var self = this;
        var navLinks = document.querySelectorAll('.nav-link');

        for (var i = 0; i < navLinks.length; i++) {
            navLinks[i].addEventListener('click', function (e) {
                e.preventDefault();
                var view = this.getAttribute('data-view');
                if (view) self.switchView(view);
            });
        }

        // Tab buttons
        var tabs = document.querySelectorAll('.tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].addEventListener('click', function () {
                for (var j = 0; j < tabs.length; j++) tabs[j].classList.remove('active');
                this.classList.add('active');
                self.ratingFilter = this.getAttribute('data-filter') || '';
                self.filterFacilities();
            });
        }
    },

    switchView: function (view) {
        // Update nav
        var navLinks = document.querySelectorAll('.nav-link');
        for (var i = 0; i < navLinks.length; i++) {
            navLinks[i].classList.remove('active');
            if (navLinks[i].getAttribute('data-view') === view) {
                navLinks[i].classList.add('active');
            }
        }

        // Update views
        var views = document.querySelectorAll('.view');
        for (var i = 0; i < views.length; i++) views[i].classList.remove('active');

        var targetView = document.getElementById(view + '-view');
        if (targetView) targetView.classList.add('active');

        this.currentView = view;

        // Render content
        if (view === 'dashboard') this.renderDashboard();
        else if (view === 'list') this.renderListView();
        else if (view === 'map') this.initMap();
        else if (view === 'analytics') this.renderAnalytics();
        else if (view === 'providers') this.renderProvidersView();
        else if (view === 'people') this.renderPeopleView();
        else if (view === 'pipeline' && typeof PipelineView !== 'undefined') PipelineView.onViewActivate();
        else if (view === 'enrichment' && typeof EnrichmentStatus !== 'undefined') EnrichmentStatus.init();
    },

    setupSearch: function () {
        var self = this;
        var searchInput = document.getElementById('search-input');
        if (searchInput) {
            var timeout;
            searchInput.addEventListener('input', function () {
                clearTimeout(timeout);
                timeout = setTimeout(function () { self.filterFacilities(); }, 300);
            });
        }
    },

    setupSortToggles: function () {
        var self = this;

        // Properties sort toggle
        var propertiesSortBtn = document.getElementById('properties-sort-toggle');
        if (propertiesSortBtn) {
            propertiesSortBtn.addEventListener('click', function () {
                self.toggleSort('properties');
            });
        }

        // Providers sort toggle
        var providersSortBtn = document.getElementById('providers-sort-toggle');
        if (providersSortBtn) {
            providersSortBtn.addEventListener('click', function () {
                self.toggleSort('providers');
            });
        }

        // People sort toggle
        var peopleSortBtn = document.getElementById('people-sort-toggle');
        if (peopleSortBtn) {
            peopleSortBtn.addEventListener('click', function () {
                self.toggleSort('people');
            });
        }
    },

    toggleSort: function (type) {
        var stateKey = type + 'SortState';
        var currentState = this[stateKey];
        var nextState;

        // Cycle: off -> desc -> asc -> off
        if (currentState === 'off') {
            nextState = 'desc';
        } else if (currentState === 'desc') {
            nextState = 'asc';
        } else {
            nextState = 'off';
        }

        this[stateKey] = nextState;

        // Update button UI
        var btn = document.getElementById(type + '-sort-toggle');
        if (btn) {
            btn.classList.remove('active', 'desc', 'asc');
            var label = btn.querySelector('.sort-label');
            if (nextState === 'off') {
                label.textContent = 'Default';
            } else if (nextState === 'desc') {
                btn.classList.add('active', 'desc');
                label.textContent = 'High→Low';
            } else {
                btn.classList.add('active', 'asc');
                label.textContent = 'Low→High';
            }
        }

        // Apply sorting based on type
        if (type === 'properties') {
            this.filterFacilities();
        } else if (type === 'providers') {
            this.filterProviders();
        } else if (type === 'people') {
            this.filterPeople();
        }
    },

    // Sidebar filters removed - only search and rating tabs remain

    filterFacilities: function () {
        var self = this;
        var facilities = this.getGlobalFilteredFacilities(); // Use global filtered list
        var searchInput = document.getElementById('search-input');
        var searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

        this.filteredFacilities = facilities.filter(function (f) {
            // Search
            if (searchTerm && f.name.toLowerCase().indexOf(searchTerm) === -1) return false;
            // Rating filter (from tabs)
            if (self.ratingFilter && f.overallRating !== self.ratingFilter) return false;
            return true;
        });

        // Apply sorting based on propertiesSortState (sort by number of beds)
        if (this.propertiesSortState !== 'off') {
            this.filteredFacilities.sort(function (a, b) {
                var aValue = a.numberOfBeds || 0;
                var bValue = b.numberOfBeds || 0;
                if (self.propertiesSortState === 'desc') {
                    return bValue - aValue;
                } else {
                    return aValue - bValue;
                }
            });
        }

        this.currentPage = 1;
        this.renderListPage();
    },

    renderDashboard: function () {
        // Use pre-loaded stats if full data not yet available
        var facilities = this.getGlobalFilteredFacilities();
        var stats;

        if (facilities.length === 0 && DataHandler.stats.total > 0) {
            // Use pre-aggregated stats from server (instant load)
            stats = DataHandler.stats;
            console.log('Rendering dashboard with pre-loaded stats:', stats);
        } else {
            // Calculate from loaded facilities (for global filter support)
            stats = this.calculateFilteredStats(facilities);
            console.log('Rendering dashboard with calculated stats:', stats);
        }

        // Animate stats
        this.animateValue('stat-total', stats.total);

        // Providers count - use pre-loaded or calculate
        var providersCount = stats.providers || 0;
        if (!providersCount && facilities.length) {
            var providersSet = new Set();
            facilities.forEach(function (f) {
                if (f.provider && f.provider.id) {
                    providersSet.add(f.provider.id);
                }
            });
            providersCount = providersSet.size;
        }
        this.animateValue('stat-providers-total', providersCount);

        // People count - use pre-loaded or calculate
        var peopleCount = stats.people || 0;
        if (!peopleCount && facilities.length) {
            var peopleSet = new Set();
            facilities.forEach(function (f) {
                if (f.nominatedIndividualName) {
                    peopleSet.add(f.nominatedIndividualName.toLowerCase().trim());
                }
            });
            peopleCount = peopleSet.size;
        }
        this.animateValue('stat-people-total', peopleCount);

        this.animateValue('stat-outstanding', stats.outstanding);
        this.animateValue('stat-good', stats.good);
        this.animateValue('stat-requires', stats.requiresImprovement);
        this.animateValue('stat-inadequate', stats.inadequate);

        // Update percentages
        var total = stats.total || 1;
        this.updateStatPct('stat-outstanding-pct', stats.outstanding, total);
        this.updateStatPct('stat-good-pct', stats.good, total);
        this.updateStatPct('stat-requires-pct', stats.requiresImprovement, total);
        this.updateStatPct('stat-inadequate-pct', stats.inadequate, total);

        // Render interactive Chart.js charts - Dashboard main charts
        this.renderDashboardDonut(facilities, stats);
        this.renderDashboardRegionalBars(facilities);
        this.setupDashboardChartControls();

        // Outstanding table
        this.renderOutstandingTable();

        // Sparklines
        this.renderSparklines();

        // Homepage analytics section (below Outstanding table)
        this.renderHomeDonutChart(facilities, stats);
        this.renderHomeRegionRatingsChart(facilities);
        this.renderHomeRegionalBars(facilities);
        this.renderHomeTopProviders(facilities);
        this.setupHomeAnalyticsControls();
    },

    updateStatPct: function (id, value, total) {
        var el = document.getElementById(id);
        if (el) {
            var pct = Math.round((value / total) * 100);
            el.textContent = pct + '%';
        }
    },

    calculateFilteredStats: function (facilities) {
        var stats = {
            total: facilities.length,
            careHomes: 0,
            outstanding: 0,
            good: 0,
            requiresImprovement: 0,
            inadequate: 0
        };

        for (var i = 0; i < facilities.length; i++) {
            var f = facilities[i];
            if (f.isCareHome) stats.careHomes++;
            if (f.overallRating === 'Outstanding') stats.outstanding++;
            else if (f.overallRating === 'Good') stats.good++;
            else if (f.overallRating === 'Requires improvement') stats.requiresImprovement++;
            else if (f.overallRating === 'Inadequate') stats.inadequate++;
        }

        return stats;
    },

    // Dashboard main charts
    dashboardDonutChart: null,
    dashboardRegionSortAsc: true,

    renderDashboardDonut: function (data, stats) {
        var ctx = document.getElementById('rating-donut-chart');
        if (!ctx) return;

        // Use stats if provided, otherwise calculate from data
        var counts;
        var total;
        if (stats && stats.total > 0) {
            counts = {
                outstanding: stats.outstanding,
                good: stats.good,
                requires: stats.requiresImprovement,
                inadequate: stats.inadequate
            };
            total = stats.total;
        } else {
            counts = this.getRatingCounts(data);
            total = data.length || 1;
        }

        // Destroy existing chart
        if (this.dashboardDonutChart) {
            this.dashboardDonutChart.destroy();
        }

        this.dashboardDonutChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Outstanding', 'Good', 'Requires Improvement', 'Inadequate'],
                datasets: [{
                    data: [counts.outstanding, counts.good, counts.requires, counts.inadequate],
                    backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '60%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1a1a1a',
                        titleFont: { size: 13, weight: '600' },
                        bodyFont: { size: 12 },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function (context) {
                                var pct = Math.round((context.raw / total) * 100);
                                return context.label + ': ' + context.raw.toLocaleString() + ' (' + pct + '%)';
                            }
                        }
                    }
                }
            }
        });

        // Build custom legend matching the image style
        var legendContainer = document.getElementById('rating-donut-legend');
        if (legendContainer) {
            var colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];
            var labels = ['Outstanding', 'Good', 'Requires Improvement', 'Inadequate'];
            var values = [counts.outstanding, counts.good, counts.requires, counts.inadequate];

            legendContainer.innerHTML = '<div class="donut-legend-row">' + labels.map(function (label, i) {
                var pct = Math.round((values[i] / total) * 100);
                return '<span class="donut-legend-item">' +
                    '<span class="legend-color" style="background:' + colors[i] + '"></span>' +
                    '<span class="legend-label">' + label + '</span>' +
                    '<span class="legend-value">' + values[i].toLocaleString() + ' (' + pct + '%)</span>' +
                    '</span>';
            }).join('') + '</div>';
        }
    },

    renderDashboardRegionalBars: function (data) {
        var container = document.getElementById('regional-breakdown-bars');
        if (!container) return;

        var regionCounts = {};
        var maxCount = 0;

        data.forEach(function (f) {
            var region = f.address && f.address.region ? f.address.region : 'Unknown';
            if (!regionCounts[region]) {
                regionCounts[region] = { outstanding: 0, good: 0, requires: 0, inadequate: 0, total: 0 };
            }
            regionCounts[region].total++;
            if (regionCounts[region].total > maxCount) maxCount = regionCounts[region].total;
            if (f.overallRating === 'Outstanding') regionCounts[region].outstanding++;
            else if (f.overallRating === 'Good') regionCounts[region].good++;
            else if (f.overallRating === 'Requires improvement') regionCounts[region].requires++;
            else if (f.overallRating === 'Inadequate') regionCounts[region].inadequate++;
        });

        var sorted = Object.keys(regionCounts).sort(function (a, b) {
            return this.dashboardRegionSortAsc ?
                regionCounts[b].total - regionCounts[a].total :
                regionCounts[a].total - regionCounts[b].total;
        }.bind(this));

        var self = this;
        container.innerHTML = sorted.map(function (region) {
            var r = regionCounts[region];
            var total = r.total || 1;
            return '<div class="regional-bar-row" data-region="' + region + '">' +
                '<span class="region-name">' + region + '</span>' +
                '<div class="region-bar-track">' +
                '<div class="region-bar-segment outstanding" style="width:' + ((r.outstanding / total) * 100) + '%"></div>' +
                '<div class="region-bar-segment good" style="width:' + ((r.good / total) * 100) + '%"></div>' +
                '<div class="region-bar-segment requires" style="width:' + ((r.requires / total) * 100) + '%"></div>' +
                '<div class="region-bar-segment inadequate" style="width:' + ((r.inadequate / total) * 100) + '%"></div>' +
                '</div>' +
                '<span class="region-count">' + self.formatNumber(r.total) + '</span>' +
                '</div>';
        }).join('');

        // Add click handlers for filtering
        container.querySelectorAll('.regional-bar-row').forEach(function (item) {
            item.addEventListener('click', function () {
                var region = this.getAttribute('data-region');
                CRMApp.switchView('list');
                // Could apply region filter here if filter UI is available
            });
        });
    },

    setupDashboardChartControls: function () {
        var self = this;

        // Sort button for regional breakdown
        var sortBtn = document.getElementById('regional-sort-btn');
        if (sortBtn) {
            var newBtn = sortBtn.cloneNode(true);
            sortBtn.parentNode.replaceChild(newBtn, sortBtn);
            newBtn.addEventListener('click', function () {
                self.dashboardRegionSortAsc = !self.dashboardRegionSortAsc;
                var facilities = self.getGlobalFilteredFacilities();
                self.renderDashboardRegionalBars(facilities);
            });
        }
    },

    ratingChart: null,
    regionsChart: null,

    renderRatingDistributionChart: function (stats) {
        var ctx = document.getElementById('rating-distribution-chart');
        if (!ctx) return;

        // Destroy existing chart if present
        if (this.ratingChart) {
            this.ratingChart.destroy();
        }

        var total = stats.total || 1;
        var self = this;

        this.ratingChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Outstanding', 'Good', 'Requires Improvement', 'Inadequate'],
                datasets: [{
                    data: [stats.outstanding, stats.good, stats.requiresImprovement, stats.inadequate],
                    backgroundColor: [
                        'rgba(34, 197, 94, 0.85)',
                        'rgba(59, 130, 246, 0.85)',
                        'rgba(245, 158, 11, 0.85)',
                        'rgba(239, 68, 68, 0.85)'
                    ],
                    borderColor: [
                        'rgb(34, 197, 94)',
                        'rgb(59, 130, 246)',
                        'rgb(245, 158, 11)',
                        'rgb(239, 68, 68)'
                    ],
                    borderWidth: 2,
                    borderRadius: 6,
                    hoverBackgroundColor: [
                        'rgba(34, 197, 94, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(239, 68, 68, 1)'
                    ]
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 26, 26, 0.95)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true,
                        boxPadding: 6,
                        callbacks: {
                            title: function (context) {
                                return context[0].label + ' Facilities';
                            },
                            label: function (context) {
                                var value = context.raw;
                                var percentage = ((value / total) * 100).toFixed(1);
                                return [
                                    'Count: ' + self.formatNumber(value),
                                    'Percentage: ' + percentage + '%'
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            display: false
                        },
                        ticks: {
                            callback: function (value) {
                                return self.formatNumber(value);
                            },
                            font: {
                                size: 11
                            },
                            color: '#8c8c8c'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 12,
                                weight: '500'
                            },
                            color: '#616161'
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                onClick: function (event, elements) {
                    if (elements.length > 0) {
                        var rating = ['Outstanding', 'Good', 'Requires improvement', 'Inadequate'][elements[0].index];
                        CRMApp.ratingFilter = rating;
                        CRMApp.switchView('list');
                        CRMApp.filterFacilities();
                    }
                },
                onHover: function (event, elements) {
                    event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                }
            }
        });
    },

    animateValue: function (id, target) {
        var el = document.getElementById(id);
        if (!el) return;

        var start = 0;
        var duration = 1000;
        var startTime = null;
        var self = this;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            var current = Math.floor(start + (target - start) * eased);
            el.textContent = self.formatNumber(current);
            if (progress < 1) requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
    },

    renderSparklines: function () {
        var containers = ['spark-total', 'spark-care'];
        containers.forEach(function (id) {
            var container = document.getElementById(id);
            if (!container) return;

            container.innerHTML = '';
            var heights = [40, 60, 50, 80, 70, 90, 85, 100].map(function (h) { return h * 0.24; });

            heights.forEach(function (h) {
                var bar = document.createElement('div');
                bar.style.cssText = 'width:8px;background:#8b5cf6;border-radius:2px;height:' + h + 'px;opacity:0.7;';
                container.appendChild(bar);
            });
        });
    },

    renderRegionsChart: function () {
        var ctx = document.getElementById('regions-chart');
        if (!ctx) return;

        // Destroy existing chart if present
        if (this.regionsChart) {
            this.regionsChart.destroy();
        }

        var facilities = this.getGlobalFilteredFacilities();
        var regionCounts = {};
        var totalFacilities = facilities.length || 1;

        facilities.forEach(function (f) {
            var region = f.address && f.address.region ? f.address.region : 'Unknown';
            regionCounts[region] = (regionCounts[region] || 0) + 1;
        });

        var sorted = Object.keys(regionCounts).sort(function (a, b) {
            return regionCounts[b] - regionCounts[a];
        }).slice(0, 5);

        var labels = sorted;
        var data = sorted.map(function (r) { return regionCounts[r]; });
        var self = this;

        this.regionsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        'rgba(139, 92, 246, 0.85)',
                        'rgba(139, 92, 246, 0.75)',
                        'rgba(139, 92, 246, 0.65)',
                        'rgba(139, 92, 246, 0.55)',
                        'rgba(139, 92, 246, 0.45)'
                    ],
                    borderColor: 'rgb(139, 92, 246)',
                    borderWidth: 2,
                    borderRadius: 6,
                    hoverBackgroundColor: 'rgba(139, 92, 246, 1)'
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 26, 26, 0.95)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            title: function (context) {
                                return context[0].label;
                            },
                            label: function (context) {
                                var value = context.raw;
                                var percentage = ((value / totalFacilities) * 100).toFixed(1);
                                return [
                                    'Facilities: ' + self.formatNumber(value),
                                    'Share: ' + percentage + '% of total'
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            display: false
                        },
                        ticks: {
                            callback: function (value) {
                                return self.formatNumber(value);
                            },
                            font: {
                                size: 11
                            },
                            color: '#8c8c8c'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 11,
                                weight: '500'
                            },
                            color: '#616161'
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                onClick: function (event, elements) {
                    if (elements.length > 0) {
                        var region = labels[elements[0].index];
                        var regionSelect = document.getElementById('filter-region');
                        if (regionSelect) {
                            regionSelect.value = region;
                        }
                        CRMApp.switchView('list');
                        CRMApp.filterFacilities();
                    }
                },
                onHover: function (event, elements) {
                    event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                }
            }
        });
    },

    renderOutstandingTable: function () {
        var container = document.getElementById('outstanding-table');
        if (!container) return;

        var facilities = this.getGlobalFilteredFacilities();
        var outstanding = facilities.filter(function (f) {
            return f.overallRating === 'Outstanding';
        }).slice(0, 5);

        if (outstanding.length === 0) {
            container.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:40px;">No outstanding facilities found</td></tr>';
            return;
        }

        var html = '';
        outstanding.forEach(function (f) {
            html += '<tr onclick="CRMApp.showDetail(\'' + f.id + '\')">' +
                '<td><div class="facility-name">' + f.name + '</div></td>' +
                '<td>' + (f.address ? f.address.city || '' : '') + '</td>' +
                '<td>' + (f.provider ? f.provider.name || 'N/A' : 'N/A') + '</td>' +
                '<td><span class="badge outstanding">Outstanding</span></td>' +
                '</tr>';
        });

        container.innerHTML = html;
    },

    // Homepage Analytics Charts
    homeAnalyticsCharts: {},
    homeRegionSortAsc: true,

    renderHomeDonutChart: function (data, stats) {
        var ctx = document.getElementById('home-rating-donut-chart');
        if (!ctx) return;

        // Use stats if provided, otherwise calculate from data
        var counts;
        var total;
        if (stats && stats.total > 0) {
            counts = {
                outstanding: stats.outstanding,
                good: stats.good,
                requires: stats.requiresImprovement,
                inadequate: stats.inadequate
            };
            total = stats.total;
        } else {
            counts = this.getRatingCounts(data);
            total = data.length || 1;
        }

        // Destroy existing chart
        if (this.homeAnalyticsCharts.donut) {
            this.homeAnalyticsCharts.donut.destroy();
        }

        this.homeAnalyticsCharts.donut = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Outstanding', 'Good', 'Requires Improvement', 'Inadequate'],
                datasets: [{
                    data: [counts.outstanding, counts.good, counts.requires, counts.inadequate],
                    backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '65%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1a1a1a',
                        titleFont: { size: 13, weight: '600' },
                        bodyFont: { size: 12 },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function (context) {
                                var total = context.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                                var pct = Math.round((context.raw / total) * 100);
                                return context.label + ': ' + context.raw.toLocaleString() + ' (' + pct + '%)';
                            }
                        }
                    }
                }
            }
        });

        // Build custom legend
        var legendContainer = document.getElementById('home-donut-legend');
        if (legendContainer) {
            var colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];
            var labels = ['Outstanding', 'Good', 'Requires Improvement', 'Inadequate'];
            var values = [counts.outstanding, counts.good, counts.requires, counts.inadequate];
            var legendTotal = total || 1;

            legendContainer.innerHTML = labels.map(function (label, i) {
                var pct = Math.round((values[i] / total) * 100);
                return '<div class="chart-legend-item">' +
                    '<span class="legend-color" style="background:' + colors[i] + '"></span>' +
                    '<span>' + label + '</span>' +
                    '<span style="margin-left:auto;font-weight:500">' + values[i].toLocaleString() + ' (' + pct + '%)</span>' +
                    '</div>';
            }).join('');
        }
    },

    renderHomeRegionRatingsChart: function (data) {
        var ctx = document.getElementById('home-region-ratings-chart');
        if (!ctx) return;

        var regionData = this.getRegionRatingData(data);

        if (this.homeAnalyticsCharts.regionRatings) {
            this.homeAnalyticsCharts.regionRatings.destroy();
        }

        this.homeAnalyticsCharts.regionRatings = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: regionData.labels,
                datasets: [
                    {
                        label: 'Outstanding',
                        data: regionData.outstanding,
                        backgroundColor: '#22c55e',
                        borderRadius: 4
                    },
                    {
                        label: 'Good',
                        data: regionData.good,
                        backgroundColor: '#3b82f6',
                        borderRadius: 4
                    },
                    {
                        label: 'Requires Improvement',
                        data: regionData.requires,
                        backgroundColor: '#f59e0b',
                        borderRadius: 4
                    },
                    {
                        label: 'Inadequate',
                        data: regionData.inadequate,
                        backgroundColor: '#ef4444',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                        grid: { display: false },
                        ticks: { font: { size: 11 } }
                    },
                    y: {
                        stacked: true,
                        grid: { color: '#f3f4f6' },
                        ticks: { font: { size: 11 } }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1a1a1a',
                        titleFont: { size: 13, weight: '600' },
                        bodyFont: { size: 12 },
                        padding: 12,
                        cornerRadius: 8
                    }
                }
            }
        });
    },

    renderHomeRegionalBars: function (data) {
        var container = document.getElementById('home-regional-bars');
        if (!container) return;

        var regionCounts = {};
        var maxCount = 0;

        data.forEach(function (f) {
            var region = f.address && f.address.region ? f.address.region : 'Unknown';
            if (!regionCounts[region]) {
                regionCounts[region] = { outstanding: 0, good: 0, requires: 0, inadequate: 0, total: 0 };
            }
            regionCounts[region].total++;
            if (regionCounts[region].total > maxCount) maxCount = regionCounts[region].total;
            if (f.overallRating === 'Outstanding') regionCounts[region].outstanding++;
            else if (f.overallRating === 'Good') regionCounts[region].good++;
            else if (f.overallRating === 'Requires improvement') regionCounts[region].requires++;
            else if (f.overallRating === 'Inadequate') regionCounts[region].inadequate++;
        });

        var sorted = Object.keys(regionCounts).sort(function (a, b) {
            return this.homeRegionSortAsc ?
                regionCounts[b].total - regionCounts[a].total :
                regionCounts[a].total - regionCounts[b].total;
        }.bind(this));

        var self = this;
        container.innerHTML = sorted.map(function (region) {
            var r = regionCounts[region];
            var total = r.total || 1;
            return '<div class="regional-bar-item" data-region="' + region + '">' +
                '<span class="region-bar-name" title="' + region + '">' + region + '</span>' +
                '<div class="region-bar-track">' +
                '<div class="region-bar-segment outstanding" style="width:' + ((r.outstanding / total) * 100) + '%"></div>' +
                '<div class="region-bar-segment good" style="width:' + ((r.good / total) * 100) + '%"></div>' +
                '<div class="region-bar-segment requires" style="width:' + ((r.requires / total) * 100) + '%"></div>' +
                '<div class="region-bar-segment inadequate" style="width:' + ((r.inadequate / total) * 100) + '%"></div>' +
                '</div>' +
                '<span class="region-bar-count">' + self.formatNumber(r.total) + '</span>' +
                '</div>';
        }).join('');

        // Add click handlers
        container.querySelectorAll('.regional-bar-item').forEach(function (item) {
            item.addEventListener('click', function () {
                var region = this.getAttribute('data-region');
                var select = document.getElementById('filter-region');
                if (select) {
                    select.value = region;
                }
                CRMApp.switchView('list');
                CRMApp.filterFacilities();
            });
        });
    },

    renderHomeTopProviders: function (data) {
        var container = document.getElementById('home-top-providers-table');
        if (!container) return;

        var providerCounts = {};

        data.forEach(function (f) {
            var name = f.provider && f.provider.name ? f.provider.name : 'Unknown';
            if (!providerCounts[name]) {
                providerCounts[name] = { total: 0, outstanding: 0, good: 0, requires: 0, inadequate: 0 };
            }
            providerCounts[name].total++;
            if (f.overallRating === 'Outstanding') providerCounts[name].outstanding++;
            else if (f.overallRating === 'Good') providerCounts[name].good++;
            else if (f.overallRating === 'Requires improvement') providerCounts[name].requires++;
            else if (f.overallRating === 'Inadequate') providerCounts[name].inadequate++;
        });

        var sorted = Object.keys(providerCounts).sort(function (a, b) {
            return providerCounts[b].total - providerCounts[a].total;
        }).slice(0, 10);

        container.innerHTML = sorted.map(function (name, idx) {
            var p = providerCounts[name];
            var total = p.total || 1;
            return '<div class="provider-row">' +
                '<span class="provider-rank">' + (idx + 1) + '</span>' +
                '<div class="provider-info">' +
                '<div class="provider-name" title="' + name + '">' + name + '</div>' +
                '<div class="provider-count">' + p.total + ' facilities</div>' +
                '</div>' +
                '<div class="provider-bar">' +
                '<div class="provider-bar-segment" style="width:' + ((p.outstanding / total) * 100) + '%;background:#22c55e"></div>' +
                '<div class="provider-bar-segment" style="width:' + ((p.good / total) * 100) + '%;background:#3b82f6"></div>' +
                '<div class="provider-bar-segment" style="width:' + ((p.requires / total) * 100) + '%;background:#f59e0b"></div>' +
                '<div class="provider-bar-segment" style="width:' + ((p.inadequate / total) * 100) + '%;background:#ef4444"></div>' +
                '</div>' +
                '</div>';
        }).join('');
    },

    setupHomeAnalyticsControls: function () {
        var self = this;

        // Chart view toggle (stacked/grouped) for homepage
        var viewBtns = document.querySelectorAll('#dashboard-view .chart-view-toggle .view-btn');
        viewBtns.forEach(function (btn) {
            // Remove old listeners by cloning
            var newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', function () {
                var parent = this.closest('.chart-view-toggle');
                parent.querySelectorAll('.view-btn').forEach(function (b) { b.classList.remove('active'); });
                this.classList.add('active');
                var view = this.getAttribute('data-view');
                self.updateHomeRegionRatingsChartView(view);
            });
        });

        // Sort regions button for homepage
        var sortBtn = document.getElementById('home-sort-regions-btn');
        if (sortBtn) {
            // Remove old listeners by cloning
            var newSortBtn = sortBtn.cloneNode(true);
            sortBtn.parentNode.replaceChild(newSortBtn, sortBtn);

            newSortBtn.addEventListener('click', function () {
                self.homeRegionSortAsc = !self.homeRegionSortAsc;
                this.classList.toggle('desc', !self.homeRegionSortAsc);
                self.renderHomeRegionalBars(self.getGlobalFilteredFacilities());
            });
        }
    },

    updateHomeRegionRatingsChartView: function (view) {
        if (!this.homeAnalyticsCharts.regionRatings) return;

        var stacked = view === 'stacked';
        this.homeAnalyticsCharts.regionRatings.options.scales.x.stacked = stacked;
        this.homeAnalyticsCharts.regionRatings.options.scales.y.stacked = stacked;
        this.homeAnalyticsCharts.regionRatings.update();
    },

    renderListView: function () {
        this.filteredFacilities = this.getGlobalFilteredFacilities();
        this.currentPage = 1;
        this.renderListPage();
    },

    renderListPage: function () {
        var container = document.getElementById('facilities-table');
        var countEl = document.getElementById('list-count');

        if (countEl) countEl.textContent = this.formatNumber(this.filteredFacilities.length) + ' facilities';

        if (!container) return;

        var start = (this.currentPage - 1) * this.itemsPerPage;
        var page = this.filteredFacilities.slice(start, start + this.itemsPerPage);

        if (page.length === 0) {
            container.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">No facilities found</td></tr>';
            this.renderPagination();
            return;
        }

        var html = '';
        page.forEach(function (f) {
            var ratingClass = (f.overallRating || '').toLowerCase().replace(/\s+/g, '-');
            if (ratingClass === 'requires-improvement') ratingClass = 'requires';

            // Build mini ratings dots HTML
            var miniRatings = '';
            if (f.ratings && (f.ratings.safe || f.ratings.caring)) {
                miniRatings = '<div class="mini-ratings">';
                ['safe', 'effective', 'caring', 'responsive', 'wellLed'].forEach(function (key) {
                    var r = f.ratings[key];
                    var rClass = r ? r.toLowerCase().replace(/\s+/g, '-') : 'not-rated';
                    if (rClass === 'requires-improvement') rClass = 'requires';
                    miniRatings += '<span class="mini-rating-dot ' + rClass + '" title="' + key + ': ' + (r || 'N/A') + '"></span>';
                });
                miniRatings += '</div>';
            }

            // Manager and beds info
            var extraInfo = '';
            if (f.registeredManager || f.beds) {
                extraInfo = '<div class="facility-extra">';
                if (f.registeredManager) extraInfo += '<span class="manager-small">👤 ' + f.registeredManager.split(' ').slice(0, 3).join(' ') + '</span>';
                if (f.beds) extraInfo += '<span class="beds-small">🛏️ ' + f.beds + '</span>';
                extraInfo += '</div>';
            }

            html += '<tr onclick="CRMApp.showDetail(\'' + f.id + '\')">' +
                '<td><input type="checkbox" onclick="event.stopPropagation()"></td>' +
                '<td><div class="facility-name">' + (f.name || 'Unknown') + '</div>' + miniRatings + extraInfo + '</td>' +
                '<td><span class="badge ' + ratingClass + '">' + (f.overallRating || 'Not Rated') + '</span></td>' +
                '<td>' + (f.address ? (f.address.city || '') + ' ' + (f.address.postcode || '') : '') + '</td>' +
                '<td>' + (f.provider ? f.provider.name || 'N/A' : 'N/A') + '</td>' +
                '<td>' + (f.isCareHome ? 'Care Home' : 'Property') + '</td>' +
                '</tr>';
        });

        container.innerHTML = html;
        this.renderPagination();
    },

    renderPagination: function () {
        var container = document.getElementById('pagination');
        if (!container) return;

        var totalPages = Math.ceil(this.filteredFacilities.length / this.itemsPerPage) || 1;

        container.innerHTML =
            '<button ' + (this.currentPage === 1 ? 'disabled' : '') + ' onclick="CRMApp.goToPage(' + (this.currentPage - 1) + ')">← Previous</button>' +
            '<span>Page ' + this.currentPage + ' of ' + totalPages + '</span>' +
            '<button ' + (this.currentPage >= totalPages ? 'disabled' : '') + ' onclick="CRMApp.goToPage(' + (this.currentPage + 1) + ')">Next →</button>';
    },

    goToPage: function (page) {
        this.currentPage = page;
        this.renderListPage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    markerCluster: null,

    initMap: function () {
        var self = this;
        var container = document.getElementById('map');
        if (!container) return;

        // Only init once
        if (this.map) {
            this.map.invalidateSize();
            return;
        }

        // Create map centered on UK
        this.map = L.map('map', {
            center: [54.5, -2],
            zoom: 6,
            zoomControl: true
        });

        // Add tile layer - using CartoDB Positron for clean look
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap, &copy; CartoDB',
            maxZoom: 19
        }).addTo(this.map);

        // Create marker cluster group for performance with 34k+ markers
        this.markerCluster = L.markerClusterGroup({
            chunkedLoading: true,
            chunkInterval: 100,
            chunkDelay: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            maxClusterRadius: 60,
            disableClusteringAtZoom: 14,
            iconCreateFunction: function (cluster) {
                var count = cluster.getChildCount();
                var size = count < 100 ? 'small' : count < 1000 ? 'medium' : 'large';
                var radius = size === 'small' ? 30 : size === 'medium' ? 40 : 50;
                return L.divIcon({
                    html: '<div style="width:' + radius + 'px;height:' + radius + 'px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:600;font-size:' + (size === 'large' ? '12' : '11') + 'px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;">' + count.toLocaleString() + '</div>',
                    className: 'marker-cluster',
                    iconSize: [radius, radius]
                });
            }
        });
        this.map.addLayer(this.markerCluster);

        // Add markers
        this.addMapMarkers();

        // Search functionality
        var searchInput = document.getElementById('map-search');
        if (searchInput) {
            searchInput.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    self.searchMapLocation(this.value);
                }
            });
        }
    },

    addMapMarkers: function () {
        if (!this.map || !this.markerCluster) return;

        // Clear existing
        this.markerCluster.clearLayers();
        this.markers = [];

        var facilities = this.getGlobalFilteredFacilities();
        var self = this;

        console.log('Adding markers for', facilities.length, 'facilities (Care Homes Only:', this.careHomesOnly + ')');

        // Color by rating
        var colors = {
            'Outstanding': '#22c55e',
            'Good': '#3b82f6',
            'Requires improvement': '#f59e0b',
            'Inadequate': '#ef4444'
        };

        // Show ALL facilities - no limit now thanks to clustering
        var markersToAdd = [];
        var validCount = 0;

        facilities.forEach(function (f) {
            if (!f.address || !f.address.latitude || !f.address.longitude) return;

            validCount++;
            var color = colors[f.overallRating] || '#8c8c8c';

            var icon = L.divIcon({
                className: 'custom-marker',
                html: '<div style="width:12px;height:12px;background:' + color + ';border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            });

            var marker = L.marker([f.address.latitude, f.address.longitude], { icon: icon });

            marker.bindPopup(
                '<div class="popup-title">' + f.name + '</div>' +
                '<div class="popup-meta">' + (f.address.city || '') + ' • ' + (f.overallRating || 'Not Rated') + '</div>'
            );

            marker.on('click', function () { self.showDetail(f.id); });

            markersToAdd.push(marker);
            self.markers.push(marker);
        });

        console.log('Valid facilities with coordinates:', validCount);

        // Bulk add for performance
        this.markerCluster.addLayers(markersToAdd);
    },

    searchMapLocation: function (query) {
        if (!query || !this.map) return;

        // Simple geocoding using Nominatim
        var url = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query + ', UK');

        fetch(url)
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data && data.length > 0) {
                    var lat = parseFloat(data[0].lat);
                    var lon = parseFloat(data[0].lon);
                    CRMApp.map.setView([lat, lon], 12);
                }
            })
            .catch(function (e) { console.error('Geocoding error:', e); });
    },

    // Analytics state
    analyticsCharts: {},
    analyticsFilter: {
        region: '',
        type: 'all',
        ratings: ['Outstanding', 'Good', 'Requires improvement', 'Inadequate']
    },
    regionSortAsc: true,

    renderAnalytics: function () {
        var self = this;

        // Setup analytics filters
        this.setupAnalyticsFilters();

        // Get filtered data
        var data = this.getFilteredAnalyticsData();

        // Update stats row
        this.updateAnalyticsStats(data);

        // Render charts
        this.renderDonutChart(data);
        this.renderRegionRatingsChart(data);
        this.renderRegionalBars(data);
        this.renderRatingComparisonChart(data);
        this.renderTopProviders(data);
        this.renderTypeComparison(data);
        this.renderHeatMap(data);
    },

    setupAnalyticsFilters: function () {
        var self = this;

        // Populate region filter
        var regionSelect = document.getElementById('analytics-region-filter');
        if (regionSelect && regionSelect.options.length <= 1) {
            var regions = DataHandler.getRegions ? DataHandler.getRegions() : [];
            regions.forEach(function (region) {
                var opt = document.createElement('option');
                opt.value = region;
                opt.textContent = region;
                regionSelect.appendChild(opt);
            });

            regionSelect.addEventListener('change', function () {
                self.analyticsFilter.region = this.value;
                self.refreshAnalytics();
            });
        }

        // Type toggle buttons
        var toggleBtns = document.querySelectorAll('#analytics-view .toggle-btn');
        toggleBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                toggleBtns.forEach(function (b) { b.classList.remove('active'); });
                this.classList.add('active');
                self.analyticsFilter.type = this.getAttribute('data-type');
                self.refreshAnalytics();
            });
        });

        // Rating toggles
        var ratingToggles = document.querySelectorAll('.rating-toggle');
        ratingToggles.forEach(function (btn) {
            btn.addEventListener('click', function () {
                this.classList.toggle('active');
                var rating = this.getAttribute('data-rating');
                var idx = self.analyticsFilter.ratings.indexOf(rating);
                if (idx > -1) {
                    self.analyticsFilter.ratings.splice(idx, 1);
                } else {
                    self.analyticsFilter.ratings.push(rating);
                }
                self.updateRatingComparisonChart();
            });
        });

        // Chart view toggle (stacked/grouped)
        var viewBtns = document.querySelectorAll('.chart-view-toggle .view-btn');
        viewBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                viewBtns.forEach(function (b) { b.classList.remove('active'); });
                this.classList.add('active');
                var view = this.getAttribute('data-view');
                self.updateRegionRatingsChartView(view);
            });
        });

        // Sort regions button
        var sortBtn = document.getElementById('sort-regions-btn');
        if (sortBtn) {
            sortBtn.addEventListener('click', function () {
                self.regionSortAsc = !self.regionSortAsc;
                this.classList.toggle('desc', !self.regionSortAsc);
                self.renderRegionalBars(self.getFilteredAnalyticsData());
            });
        }
    },

    getFilteredAnalyticsData: function () {
        // Start from global filtered facilities (respects careHomesOnly setting)
        var facilities = this.getGlobalFilteredFacilities();
        var filter = this.analyticsFilter;

        return facilities.filter(function (f) {
            // Region filter
            if (filter.region && f.address && f.address.region !== filter.region) return false;
            // Type filter (only applies if NOT in global care homes mode)
            if (!CRMApp.careHomesOnly) {
                if (filter.type === 'care' && !f.isCareHome) return false;
                if (filter.type === 'other' && f.isCareHome) return false;
            }
            return true;
        });
    },

    refreshAnalytics: function () {
        var data = this.getFilteredAnalyticsData();
        this.updateAnalyticsStats(data);
        this.updateDonutChart(data);
        this.updateRegionRatingsChart(data);
        this.renderRegionalBars(data);
        this.updateRatingComparisonChart();
        this.renderTopProviders(data);
        this.renderTypeComparison(data);
    },

    updateAnalyticsStats: function (data) {
        var counts = { outstanding: 0, good: 0, requires: 0, inadequate: 0 };
        data.forEach(function (f) {
            if (f.overallRating === 'Outstanding') counts.outstanding++;
            else if (f.overallRating === 'Good') counts.good++;
            else if (f.overallRating === 'Requires improvement') counts.requires++;
            else if (f.overallRating === 'Inadequate') counts.inadequate++;
        });

        var total = data.length || 1;

        document.getElementById('analytics-outstanding').textContent = this.formatNumber(counts.outstanding);
        document.getElementById('analytics-good').textContent = this.formatNumber(counts.good);
        document.getElementById('analytics-requires').textContent = this.formatNumber(counts.requires);
        document.getElementById('analytics-inadequate').textContent = this.formatNumber(counts.inadequate);

        document.getElementById('analytics-outstanding-pct').textContent = Math.round((counts.outstanding / total) * 100) + '%';
        document.getElementById('analytics-good-pct').textContent = Math.round((counts.good / total) * 100) + '%';
        document.getElementById('analytics-requires-pct').textContent = Math.round((counts.requires / total) * 100) + '%';
        document.getElementById('analytics-inadequate-pct').textContent = Math.round((counts.inadequate / total) * 100) + '%';
    },

    renderDonutChart: function (data) {
        var ctx = document.getElementById('rating-donut-chart');
        if (!ctx) return;

        var counts = this.getRatingCounts(data);

        // Destroy existing chart
        if (this.analyticsCharts.donut) {
            this.analyticsCharts.donut.destroy();
        }

        this.analyticsCharts.donut = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Outstanding', 'Good', 'Requires Improvement', 'Inadequate'],
                datasets: [{
                    data: [counts.outstanding, counts.good, counts.requires, counts.inadequate],
                    backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '65%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1a1a1a',
                        titleFont: { size: 13, weight: '600' },
                        bodyFont: { size: 12 },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function (context) {
                                var total = context.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                                var pct = Math.round((context.raw / total) * 100);
                                return context.label + ': ' + context.raw.toLocaleString() + ' (' + pct + '%)';
                            }
                        }
                    }
                },
                onClick: function (evt, elements) {
                    if (elements.length > 0) {
                        var idx = elements[0].index;
                        var ratings = ['Outstanding', 'Good', 'Requires improvement', 'Inadequate'];
                        // Could implement drill-down here
                    }
                }
            }
        });

        // Build custom legend
        var legendContainer = document.getElementById('donut-legend');
        if (legendContainer) {
            var colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];
            var labels = ['Outstanding', 'Good', 'Requires Improvement', 'Inadequate'];
            var values = [counts.outstanding, counts.good, counts.requires, counts.inadequate];
            var total = data.length || 1;

            legendContainer.innerHTML = labels.map(function (label, i) {
                var pct = Math.round((values[i] / total) * 100);
                return '<div class="chart-legend-item">' +
                    '<span class="legend-color" style="background:' + colors[i] + '"></span>' +
                    '<span>' + label + '</span>' +
                    '<span style="margin-left:auto;font-weight:500">' + values[i].toLocaleString() + ' (' + pct + '%)</span>' +
                    '</div>';
            }).join('');
        }
    },

    updateDonutChart: function (data) {
        if (!this.analyticsCharts.donut) return;

        var counts = this.getRatingCounts(data);
        this.analyticsCharts.donut.data.datasets[0].data = [counts.outstanding, counts.good, counts.requires, counts.inadequate];
        this.analyticsCharts.donut.update();

        // Update legend
        var legendContainer = document.getElementById('donut-legend');
        if (legendContainer) {
            var colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];
            var labels = ['Outstanding', 'Good', 'Requires Improvement', 'Inadequate'];
            var values = [counts.outstanding, counts.good, counts.requires, counts.inadequate];
            var total = data.length || 1;

            legendContainer.innerHTML = labels.map(function (label, i) {
                var pct = Math.round((values[i] / total) * 100);
                return '<div class="chart-legend-item">' +
                    '<span class="legend-color" style="background:' + colors[i] + '"></span>' +
                    '<span>' + label + '</span>' +
                    '<span style="margin-left:auto;font-weight:500">' + values[i].toLocaleString() + ' (' + pct + '%)</span>' +
                    '</div>';
            }).join('');
        }
    },

    getRatingCounts: function (data) {
        var counts = { outstanding: 0, good: 0, requires: 0, inadequate: 0 };
        data.forEach(function (f) {
            if (f.overallRating === 'Outstanding') counts.outstanding++;
            else if (f.overallRating === 'Good') counts.good++;
            else if (f.overallRating === 'Requires improvement') counts.requires++;
            else if (f.overallRating === 'Inadequate') counts.inadequate++;
        });
        return counts;
    },

    renderRegionRatingsChart: function (data) {
        var ctx = document.getElementById('region-ratings-chart');
        if (!ctx) return;

        var regionData = this.getRegionRatingData(data);

        if (this.analyticsCharts.regionRatings) {
            this.analyticsCharts.regionRatings.destroy();
        }

        this.analyticsCharts.regionRatings = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: regionData.labels,
                datasets: [
                    {
                        label: 'Outstanding',
                        data: regionData.outstanding,
                        backgroundColor: '#22c55e',
                        borderRadius: 4
                    },
                    {
                        label: 'Good',
                        data: regionData.good,
                        backgroundColor: '#3b82f6',
                        borderRadius: 4
                    },
                    {
                        label: 'Requires Improvement',
                        data: regionData.requires,
                        backgroundColor: '#f59e0b',
                        borderRadius: 4
                    },
                    {
                        label: 'Inadequate',
                        data: regionData.inadequate,
                        backgroundColor: '#ef4444',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                        grid: { display: false },
                        ticks: { font: { size: 11 } }
                    },
                    y: {
                        stacked: true,
                        grid: { color: '#f3f4f6' },
                        ticks: { font: { size: 11 } }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1a1a1a',
                        titleFont: { size: 13, weight: '600' },
                        bodyFont: { size: 12 },
                        padding: 12,
                        cornerRadius: 8
                    }
                }
            }
        });
    },

    updateRegionRatingsChart: function (data) {
        if (!this.analyticsCharts.regionRatings) return;

        var regionData = this.getRegionRatingData(data);
        var chart = this.analyticsCharts.regionRatings;

        chart.data.labels = regionData.labels;
        chart.data.datasets[0].data = regionData.outstanding;
        chart.data.datasets[1].data = regionData.good;
        chart.data.datasets[2].data = regionData.requires;
        chart.data.datasets[3].data = regionData.inadequate;
        chart.update();
    },

    updateRegionRatingsChartView: function (view) {
        if (!this.analyticsCharts.regionRatings) return;

        var stacked = view === 'stacked';
        this.analyticsCharts.regionRatings.options.scales.x.stacked = stacked;
        this.analyticsCharts.regionRatings.options.scales.y.stacked = stacked;
        this.analyticsCharts.regionRatings.update();
    },

    getRegionRatingData: function (data) {
        var regionCounts = {};

        data.forEach(function (f) {
            var region = f.address && f.address.region ? f.address.region : 'Unknown';
            if (!regionCounts[region]) {
                regionCounts[region] = { outstanding: 0, good: 0, requires: 0, inadequate: 0, total: 0 };
            }
            regionCounts[region].total++;
            if (f.overallRating === 'Outstanding') regionCounts[region].outstanding++;
            else if (f.overallRating === 'Good') regionCounts[region].good++;
            else if (f.overallRating === 'Requires improvement') regionCounts[region].requires++;
            else if (f.overallRating === 'Inadequate') regionCounts[region].inadequate++;
        });

        // Sort by total and take top 8
        var sorted = Object.keys(regionCounts).sort(function (a, b) {
            return regionCounts[b].total - regionCounts[a].total;
        }).slice(0, 8);

        return {
            labels: sorted,
            outstanding: sorted.map(function (r) { return regionCounts[r].outstanding; }),
            good: sorted.map(function (r) { return regionCounts[r].good; }),
            requires: sorted.map(function (r) { return regionCounts[r].requires; }),
            inadequate: sorted.map(function (r) { return regionCounts[r].inadequate; })
        };
    },

    renderRegionalBars: function (data) {
        var container = document.getElementById('regional-bars');
        if (!container) return;

        var regionCounts = {};
        var maxCount = 0;

        data.forEach(function (f) {
            var region = f.address && f.address.region ? f.address.region : 'Unknown';
            if (!regionCounts[region]) {
                regionCounts[region] = { outstanding: 0, good: 0, requires: 0, inadequate: 0, total: 0 };
            }
            regionCounts[region].total++;
            if (regionCounts[region].total > maxCount) maxCount = regionCounts[region].total;
            if (f.overallRating === 'Outstanding') regionCounts[region].outstanding++;
            else if (f.overallRating === 'Good') regionCounts[region].good++;
            else if (f.overallRating === 'Requires improvement') regionCounts[region].requires++;
            else if (f.overallRating === 'Inadequate') regionCounts[region].inadequate++;
        });

        var sorted = Object.keys(regionCounts).sort(function (a, b) {
            return this.regionSortAsc ?
                regionCounts[b].total - regionCounts[a].total :
                regionCounts[a].total - regionCounts[b].total;
        }.bind(this));

        var self = this;
        container.innerHTML = sorted.map(function (region) {
            var r = regionCounts[region];
            var total = r.total || 1;
            return '<div class="regional-bar-item" data-region="' + region + '">' +
                '<span class="region-bar-name" title="' + region + '">' + region + '</span>' +
                '<div class="region-bar-track">' +
                '<div class="region-bar-segment outstanding" style="width:' + ((r.outstanding / total) * 100) + '%"></div>' +
                '<div class="region-bar-segment good" style="width:' + ((r.good / total) * 100) + '%"></div>' +
                '<div class="region-bar-segment requires" style="width:' + ((r.requires / total) * 100) + '%"></div>' +
                '<div class="region-bar-segment inadequate" style="width:' + ((r.inadequate / total) * 100) + '%"></div>' +
                '</div>' +
                '<span class="region-bar-count">' + self.formatNumber(r.total) + '</span>' +
                '</div>';
        }).join('');

        // Add click handlers
        container.querySelectorAll('.regional-bar-item').forEach(function (item) {
            item.addEventListener('click', function () {
                var region = this.getAttribute('data-region');
                var select = document.getElementById('analytics-region-filter');
                if (select) {
                    select.value = region;
                    self.analyticsFilter.region = region;
                    self.refreshAnalytics();
                }
            });
        });
    },

    renderRatingComparisonChart: function (data) {
        var ctx = document.getElementById('rating-comparison-chart');
        if (!ctx) return;

        var careData = this.getRatingCounts(data.filter(function (f) { return f.isCareHome; }));
        var otherData = this.getRatingCounts(data.filter(function (f) { return !f.isCareHome; }));

        if (this.analyticsCharts.comparison) {
            this.analyticsCharts.comparison.destroy();
        }

        var activeRatings = this.analyticsFilter.ratings;
        var showOutstanding = activeRatings.indexOf('Outstanding') > -1;
        var showGood = activeRatings.indexOf('Good') > -1;
        var showRequires = activeRatings.indexOf('Requires improvement') > -1;
        var showInadequate = activeRatings.indexOf('Inadequate') > -1;

        var datasets = [];
        if (showOutstanding) datasets.push({
            label: 'Outstanding',
            data: [careData.outstanding, otherData.outstanding],
            backgroundColor: '#22c55e',
            borderRadius: 6
        });
        if (showGood) datasets.push({
            label: 'Good',
            data: [careData.good, otherData.good],
            backgroundColor: '#3b82f6',
            borderRadius: 6
        });
        if (showRequires) datasets.push({
            label: 'Requires Improvement',
            data: [careData.requires, otherData.requires],
            backgroundColor: '#f59e0b',
            borderRadius: 6
        });
        if (showInadequate) datasets.push({
            label: 'Inadequate',
            data: [careData.inadequate, otherData.inadequate],
            backgroundColor: '#ef4444',
            borderRadius: 6
        });

        this.analyticsCharts.comparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Care Homes', 'Other Facilities'],
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        grid: { color: '#f3f4f6' },
                        ticks: { font: { size: 11 } }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { font: { size: 13, weight: '500' } }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: { boxWidth: 12, padding: 16, font: { size: 12 } }
                    },
                    tooltip: {
                        backgroundColor: '#1a1a1a',
                        titleFont: { size: 13, weight: '600' },
                        bodyFont: { size: 12 },
                        padding: 12,
                        cornerRadius: 8
                    }
                }
            }
        });
    },

    updateRatingComparisonChart: function () {
        var data = this.getFilteredAnalyticsData();
        this.renderRatingComparisonChart(data);
    },

    renderTopProviders: function (data) {
        var container = document.getElementById('top-providers-table');
        if (!container) return;

        var providerCounts = {};

        data.forEach(function (f) {
            var name = f.provider && f.provider.name ? f.provider.name : 'Unknown';
            if (!providerCounts[name]) {
                providerCounts[name] = { total: 0, outstanding: 0, good: 0, requires: 0, inadequate: 0 };
            }
            providerCounts[name].total++;
            if (f.overallRating === 'Outstanding') providerCounts[name].outstanding++;
            else if (f.overallRating === 'Good') providerCounts[name].good++;
            else if (f.overallRating === 'Requires improvement') providerCounts[name].requires++;
            else if (f.overallRating === 'Inadequate') providerCounts[name].inadequate++;
        });

        var sorted = Object.keys(providerCounts).sort(function (a, b) {
            return providerCounts[b].total - providerCounts[a].total;
        }).slice(0, 10);

        container.innerHTML = sorted.map(function (name, idx) {
            var p = providerCounts[name];
            var total = p.total || 1;
            return '<div class="provider-row">' +
                '<span class="provider-rank">' + (idx + 1) + '</span>' +
                '<div class="provider-info">' +
                '<div class="provider-name" title="' + name + '">' + name + '</div>' +
                '<div class="provider-count">' + p.total + ' facilities</div>' +
                '</div>' +
                '<div class="provider-bar">' +
                '<div class="provider-bar-segment" style="width:' + ((p.outstanding / total) * 100) + '%;background:#22c55e"></div>' +
                '<div class="provider-bar-segment" style="width:' + ((p.good / total) * 100) + '%;background:#3b82f6"></div>' +
                '<div class="provider-bar-segment" style="width:' + ((p.requires / total) * 100) + '%;background:#f59e0b"></div>' +
                '<div class="provider-bar-segment" style="width:' + ((p.inadequate / total) * 100) + '%;background:#ef4444"></div>' +
                '</div>' +
                '</div>';
        }).join('');
    },

    renderTypeComparison: function (data) {
        var careHomes = data.filter(function (f) { return f.isCareHome; });
        var otherFacilities = data.filter(function (f) { return !f.isCareHome; });

        var careTotal = document.getElementById('care-home-total');
        var otherTotal = document.getElementById('other-facilities-total');
        if (careTotal) careTotal.textContent = this.formatNumber(careHomes.length);
        if (otherTotal) otherTotal.textContent = this.formatNumber(otherFacilities.length);

        // Care home chart
        var careCtx = document.getElementById('care-home-chart');
        if (careCtx) {
            var careCounts = this.getRatingCounts(careHomes);
            if (this.analyticsCharts.careHome) this.analyticsCharts.careHome.destroy();

            this.analyticsCharts.careHome = new Chart(careCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Outstanding', 'Good', 'Requires', 'Inadequate'],
                    datasets: [{
                        data: [careCounts.outstanding, careCounts.good, careCounts.requires, careCounts.inadequate],
                        backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '60%',
                    plugins: { legend: { display: false } }
                }
            });
        }

        // Other facilities chart
        var otherCtx = document.getElementById('other-facilities-chart');
        if (otherCtx) {
            var otherCounts = this.getRatingCounts(otherFacilities);
            if (this.analyticsCharts.otherFacilities) this.analyticsCharts.otherFacilities.destroy();

            this.analyticsCharts.otherFacilities = new Chart(otherCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Outstanding', 'Good', 'Requires', 'Inadequate'],
                    datasets: [{
                        data: [otherCounts.outstanding, otherCounts.good, otherCounts.requires, otherCounts.inadequate],
                        backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '60%',
                    plugins: { legend: { display: false } }
                }
            });
        }
    },

    renderHeatMap: function (data) {
        var container = document.getElementById('uk-heatmap');
        if (!container) return;

        // Get region counts for heat intensity
        var regionCounts = {};
        var maxCount = 0;

        data.forEach(function (f) {
            var region = f.address && f.address.region ? f.address.region : 'Unknown';
            regionCounts[region] = (regionCounts[region] || 0) + 1;
            if (regionCounts[region] > maxCount) maxCount = regionCounts[region];
        });

        // Create simplified UK region visualization
        var regions = [
            { name: 'North East', x: 70, y: 25, w: 15, h: 12 },
            { name: 'North West', x: 50, y: 35, w: 18, h: 15 },
            { name: 'Yorkshire and The Humber', x: 70, y: 40, w: 20, h: 12 },
            { name: 'East Midlands', x: 65, y: 55, w: 18, h: 12 },
            { name: 'West Midlands', x: 48, y: 55, w: 16, h: 12 },
            { name: 'East of England', x: 75, y: 68, w: 18, h: 15 },
            { name: 'London', x: 62, y: 78, w: 12, h: 10 },
            { name: 'South East', x: 72, y: 85, w: 20, h: 12 },
            { name: 'South West', x: 35, y: 82, w: 22, h: 15 },
            { name: 'Wales', x: 30, y: 60, w: 16, h: 18 }
        ];

        var self = this;

        // Keep the legend, add the map grid
        var existingLegend = container.querySelector('.heatmap-legend');
        container.innerHTML = '<div class="heatmap-grid">' + regions.map(function (r) {
            var count = regionCounts[r.name] || 0;
            var intensity = maxCount > 0 ? count / maxCount : 0;
            var color = self.getHeatColor(intensity);

            return '<div class="heatmap-region" ' +
                'style="left:' + r.x + '%;top:' + r.y + '%;width:' + r.w + '%;height:' + r.h + '%;background:' + color + '" ' +
                'data-region="' + r.name + '" ' +
                'title="' + r.name + ': ' + count.toLocaleString() + ' facilities">' +
                '<span class="heatmap-label">' + r.name.split(' ')[0] + '</span>' +
                '</div>';
        }).join('') + '</div>';

        // Re-add legend
        if (existingLegend) {
            container.appendChild(existingLegend);
        } else {
            var legend = document.createElement('div');
            legend.className = 'heatmap-legend';
            legend.innerHTML = '<span class="legend-label">Low</span><div class="legend-gradient"></div><span class="legend-label">High</span>';
            container.appendChild(legend);
        }

        // Add click handlers
        container.querySelectorAll('.heatmap-region').forEach(function (el) {
            el.addEventListener('click', function () {
                var region = this.getAttribute('data-region');
                var select = document.getElementById('analytics-region-filter');
                if (select) {
                    select.value = region;
                    self.analyticsFilter.region = region;
                    self.refreshAnalytics();
                }
            });
        });
    },

    getHeatColor: function (intensity) {
        // Interpolate from light gray to green
        var r = Math.round(243 - (243 - 34) * intensity);
        var g = Math.round(244 - (244 - 197) * intensity);
        var b = Math.round(246 - (246 - 94) * intensity);
        return 'rgb(' + r + ',' + g + ',' + b + ')';
    },

    showDetail: function (id) {
        var facility = DataHandler.getFacilityById(id);
        if (!facility) return;

        var panel = document.getElementById('detail-panel');
        var title = document.getElementById('detail-title');
        var body = document.getElementById('detail-body');

        if (title) title.textContent = facility.name;

        var ratingClass = (facility.overallRating || '').toLowerCase().replace(/\s+/g, '-');
        if (ratingClass === 'requires-improvement') ratingClass = 'requires';

        // Format publication date (handles DD/MM/YYYY UK format)
        var pubDateDisplay = 'N/A';
        if (facility.publicationDate) {
            try {
                // Parse DD/MM/YYYY format
                var parts = facility.publicationDate.split('/');
                if (parts.length === 3) {
                    var day = parseInt(parts[0], 10);
                    var month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
                    var year = parseInt(parts[2], 10);
                    var date = new Date(year, month, day);
                    if (!isNaN(date.getTime())) {
                        pubDateDisplay = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                    } else {
                        pubDateDisplay = facility.publicationDate;
                    }
                } else {
                    pubDateDisplay = facility.publicationDate;
                }
            } catch (e) {
                pubDateDisplay = facility.publicationDate;
            }
        }

        if (body) {
            // Build ratings breakdown HTML if available
            var ratingsHtml = '';
            if (facility.ratings && (facility.ratings.safe || facility.ratings.caring)) {
                var ratingItems = [
                    { key: 'safe', label: 'Safe' },
                    { key: 'effective', label: 'Effective' },
                    { key: 'caring', label: 'Caring' },
                    { key: 'responsive', label: 'Responsive' },
                    { key: 'wellLed', label: 'Well-led' }
                ];
                ratingsHtml = '<div class="ratings-breakdown">';
                ratingItems.forEach(function (item) {
                    var rating = facility.ratings[item.key];
                    var rClass = rating ? rating.toLowerCase().replace(/\s+/g, '-') : 'not-rated';
                    if (rClass === 'requires-improvement') rClass = 'requires';
                    ratingsHtml += '<div class="rating-item"><span class="rating-label">' + item.label + '</span><span class="rating-dot ' + rClass + '"></span><span class="rating-value">' + (rating || 'N/A') + '</span></div>';
                });
                ratingsHtml += '</div>';
            }

            // Format last inspection date
            var inspectionDisplay = 'N/A';
            if (facility.lastInspection) {
                try {
                    var d = new Date(facility.lastInspection);
                    if (!isNaN(d.getTime())) {
                        inspectionDisplay = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                    }
                } catch (e) { inspectionDisplay = facility.lastInspection; }
            }

            body.innerHTML =
                '<div class="detail-section">' +
                '<h4>Overall Rating</h4>' +
                '<span class="badge ' + ratingClass + ' large">' + (facility.overallRating || 'Not Rated') + '</span>' +
                '</div>' +

                (ratingsHtml ? '<div class="detail-section"><h4>Ratings Breakdown</h4>' + ratingsHtml + '</div>' : '') +

                (facility.registeredManager ? '<div class="detail-section"><h4>Registered Manager</h4><p class="manager-name">👤 ' + facility.registeredManager + '</p></div>' : '') +

                (facility.nominatedIndividual ? '<div class="detail-section"><h4>Responsible Person</h4><p class="manager-name">👔 ' + facility.nominatedIndividual + '</p></div>' : '') +

                '<div class="detail-section contact-section">' +
                (facility.phone ? '<a href="tel:' + facility.phone + '" class="contact-link">📞 ' + facility.phone + '</a>' : '') +
                (facility.website ? '<a href="https://' + facility.website.replace(/^https?:\/\//, '') + '" target="_blank" class="contact-link">🌐 ' + facility.website + '</a>' : '') +
                (facility.beds ? '<span class="beds-badge">🛏️ ' + facility.beds + ' beds</span>' : '') +
                '</div>' +

                '<div class="detail-section">' +
                '<h4>Address</h4>' +
                '<p>' + (facility.address ? [facility.address.street, facility.address.city, facility.address.postcode].filter(Boolean).join('<br>') : 'N/A') + '</p>' +
                '</div>' +

                '<div class="detail-section">' +
                '<h4>Location</h4>' +
                '<div id="detail-mini-map" class="detail-mini-map"></div>' +
                '</div>' +

                '<div class="detail-section">' +
                '<h4>Provider</h4>' +
                '<span class="detail-chip provider-chip">' + (facility.provider ? facility.provider.name || 'N/A' : 'N/A') + '</span>' +
                '</div>' +

                '<div class="detail-section info-row">' +
                '<div class="info-item"><span class="info-label">Last Inspection</span><span class="info-value">' + inspectionDisplay + '</span></div>' +
                '<div class="info-item"><span class="info-label">Type</span><span class="info-value">' + (facility.isCareHome ? 'Care Home' : (facility.locationType || 'Facility')) + '</span></div>' +
                '</div>' +

                '<div class="detail-section">' +
                '<a href="https://www.cqc.org.uk/location/' + facility.id + '" target="_blank" class="btn btn-primary btn-cqc">View Full CQC Report →</a>' +
                '</div>';

            // Initialize mini map if coordinates are available
            this.initDetailMiniMap(facility);
        }

        if (panel) panel.classList.add('active');
    },

    detailMiniMap: null,

    initDetailMiniMap: function (facility) {
        var mapContainer = document.getElementById('detail-mini-map');
        if (!mapContainer) return;

        // Destroy existing map if present
        if (this.detailMiniMap) {
            this.detailMiniMap.remove();
            this.detailMiniMap = null;
        }

        // Check if we have coordinates
        var lat = facility.address && facility.address.latitude;
        var lng = facility.address && facility.address.longitude;

        if (!lat || !lng) {
            mapContainer.innerHTML = '<div class="mini-map-placeholder"><span>📍</span><p>Location not available</p></div>';
            return;
        }

        // Create the mini map
        this.detailMiniMap = L.map('detail-mini-map', {
            center: [lat, lng],
            zoom: 15,
            zoomControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            touchZoom: false,
            attributionControl: false
        });

        // Add tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(this.detailMiniMap);

        // Add marker with custom styling
        var color = {
            'Outstanding': '#22c55e',
            'Good': '#3b82f6',
            'Requires improvement': '#f59e0b',
            'Inadequate': '#ef4444'
        }[facility.overallRating] || '#8c8c8c';

        var icon = L.divIcon({
            className: 'custom-detail-marker',
            html: '<div style="width:24px;height:24px;background:' + color + ';border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;background:white;border-radius:50%;"></div></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        L.marker([lat, lng], { icon: icon }).addTo(this.detailMiniMap);
    },


    closeDetail: function () {
        var panel = document.getElementById('detail-panel');
        if (panel) panel.classList.remove('active');
    },

    exportData: function () {
        var facilities = this.filteredFacilities.length ? this.filteredFacilities : DataHandler.getAllFacilities();

        var csv = 'Name,Rating,City,Postcode,Provider,Type\n';
        facilities.forEach(function (f) {
            csv += '"' + (f.name || '').replace(/"/g, '""') + '",';
            csv += '"' + (f.overallRating || '') + '",';
            csv += '"' + (f.address ? f.address.city || '' : '') + '",';
            csv += '"' + (f.address ? f.address.postcode || '' : '') + '",';
            csv += '"' + (f.provider ? (f.provider.name || '').replace(/"/g, '""') : '') + '",';
            csv += '"' + (f.isCareHome ? 'Care Home' : 'Facility') + '"\n';
        });

        var blob = new Blob([csv], { type: 'text/csv' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'facilities_export.csv';
        a.click();
        URL.revokeObjectURL(url);
    },

    // ===== PROVIDERS PAGE =====

    setupProviderFilters: function () {
        var self = this;

        // Multi-select property count filter
        var countFilter = document.getElementById('provider-count-filter');
        if (countFilter) {
            var trigger = countFilter.querySelector('.multi-select-trigger');
            var checkboxes = countFilter.querySelectorAll('input[type="checkbox"]');

            // Toggle dropdown on trigger click
            if (trigger) {
                trigger.addEventListener('click', function (e) {
                    e.stopPropagation();
                    countFilter.classList.toggle('open');
                });
            }

            // Handle checkbox changes
            checkboxes.forEach(function (cb) {
                cb.addEventListener('change', function () {
                    self.updateMultiSelectLabel(countFilter);
                    self.filterProviders();
                });
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', function (e) {
                if (!countFilter.contains(e.target)) {
                    countFilter.classList.remove('open');
                }
            });
        }

        // Region filter
        var regionFilter = document.getElementById('provider-region-filter');
        if (regionFilter) {
            // Populate region options
            var regions = DataHandler.getRegions ? DataHandler.getRegions() : [];
            regions.forEach(function (region) {
                var opt = document.createElement('option');
                opt.value = region;
                opt.textContent = region;
                regionFilter.appendChild(opt);
            });

            regionFilter.addEventListener('change', function () {
                self.filterProviders();
            });
        }

        // Provider search
        var searchInput = document.getElementById('provider-search');
        if (searchInput) {
            var timeout;
            searchInput.addEventListener('input', function () {
                clearTimeout(timeout);
                timeout = setTimeout(function () { self.filterProviders(); }, 300);
            });
        }

        // Close modal on overlay click
        var overlay = document.getElementById('provider-detail-modal');
        if (overlay) {
            overlay.addEventListener('click', function (e) {
                if (e.target === this) {
                    self.closeProviderDetail();
                }
            });
        }
    },

    aggregateProviders: function () {
        var facilities = this.getGlobalFilteredFacilities();
        var providersMap = {};

        facilities.forEach(function (f) {
            if (!f.provider || !f.provider.id) return;

            var pid = f.provider.id;
            if (!providersMap[pid]) {
                providersMap[pid] = {
                    id: pid,
                    name: f.provider.name || 'Unknown Provider',
                    facilities: [],
                    stats: {
                        total: 0,
                        outstanding: 0,
                        good: 0,
                        requiresImprovement: 0,
                        inadequate: 0,
                        careHomes: 0
                    }
                };
            }

            var p = providersMap[pid];
            p.facilities.push(f);
            p.stats.total++;

            if (f.isCareHome) p.stats.careHomes++;
            if (f.overallRating === 'Outstanding') p.stats.outstanding++;
            else if (f.overallRating === 'Good') p.stats.good++;
            else if (f.overallRating === 'Requires improvement') p.stats.requiresImprovement++;
            else if (f.overallRating === 'Inadequate') p.stats.inadequate++;
        });

        // Convert to array and sort by property count (descending)
        this.providersData = Object.values(providersMap).sort(function (a, b) {
            return b.stats.total - a.stats.total;
        });

        return this.providersData;
    },

    renderProvidersView: function () {
        // Setup filters on first load
        if (!this._providerFiltersSetup) {
            this.setupProviderFilters();
            this._providerFiltersSetup = true;
        }

        // Aggregate providers
        this.aggregateProviders();
        this.filteredProviders = this.providersData.slice();

        // Update counts
        this.updateProvidersCount();

        // Apply any existing filters
        this.filterProviders();
    },

    updateProvidersCount: function () {
        var countBadge = document.getElementById('providers-count');
        var subtitle = document.getElementById('providers-subtitle');

        if (countBadge) countBadge.textContent = this.formatNumber(this.providersData.length);
        if (subtitle) subtitle.textContent = this.formatNumber(this.filteredProviders.length) + ' providers managing facilities';
    },

    updateMultiSelectLabel: function (dropdown) {
        var label = dropdown.querySelector('.multi-select-label');
        var checkboxes = dropdown.querySelectorAll('input[type="checkbox"]:checked');

        if (checkboxes.length === 0) {
            label.textContent = 'All Providers';
        } else if (checkboxes.length === 1) {
            label.textContent = checkboxes[0].parentNode.textContent.trim();
        } else {
            label.textContent = checkboxes.length + ' ranges selected';
        }
    },

    filterProviders: function () {
        var searchTerm = (document.getElementById('provider-search')?.value || '').toLowerCase();
        var regionFilter = document.getElementById('provider-region-filter')?.value || '';

        // Get selected property count ranges from multi-select
        var countFilterEl = document.getElementById('provider-count-filter');
        var selectedRanges = [];
        if (countFilterEl) {
            var checkboxes = countFilterEl.querySelectorAll('input[type="checkbox"]:checked');
            checkboxes.forEach(function (cb) {
                selectedRanges.push(cb.value);
            });
        }

        this.filteredProviders = this.providersData.filter(function (p) {
            // Search filter
            if (searchTerm && p.name.toLowerCase().indexOf(searchTerm) === -1) return false;

            // Property count filter (multi-select)
            if (selectedRanges.length > 0) {
                var count = p.stats.total;
                var matchesRange = selectedRanges.some(function (range) {
                    if (range === '1-2') return count >= 1 && count <= 2;
                    if (range === '3-5') return count >= 3 && count <= 5;
                    if (range === '6-10') return count >= 6 && count <= 10;
                    if (range === '11-15') return count >= 11 && count <= 15;
                    if (range === '16-20') return count >= 16 && count <= 20;
                    if (range === '21-30') return count >= 21 && count <= 30;
                    if (range === '31-40') return count >= 31 && count <= 40;
                    if (range === '41-50') return count >= 41 && count <= 50;
                    if (range === '50+') return count > 50;
                    return false;
                });
                if (!matchesRange) return false;
            }

            // Region filter - check if any of the provider's facilities are in the selected region
            if (regionFilter) {
                var hasRegion = p.facilities.some(function (f) {
                    return f.address && f.address.region === regionFilter;
                });
                if (!hasRegion) return false;
            }

            return true;
        });

        // Apply sorting based on providersSortState (sort by property count)
        if (this.providersSortState !== 'off') {
            var self = this;
            this.filteredProviders.sort(function (a, b) {
                var aValue = a.stats.total || 0;
                var bValue = b.stats.total || 0;
                if (self.providersSortState === 'desc') {
                    return bValue - aValue;
                } else {
                    return aValue - bValue;
                }
            });
        }

        this.providerPage = 1;
        this.updateProvidersCount();
        this.renderProviderCards();
    },


    renderProviderCards: function () {
        var container = document.getElementById('providers-grid');
        if (!container) return;

        var start = (this.providerPage - 1) * this.providersPerPage;
        var page = this.filteredProviders.slice(start, start + this.providersPerPage);

        if (page.length === 0) {
            container.innerHTML = '<div class="providers-empty">' +
                '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>' +
                '<p>No providers found matching your criteria</p>' +
                '</div>';
            this.renderProvidersPagination();
            return;
        }

        var html = '';
        var self = this;

        page.forEach(function (p) {
            var total = p.stats.total || 1;
            var outPct = (p.stats.outstanding / total * 100).toFixed(0);
            var goodPct = (p.stats.good / total * 100).toFixed(0);
            var reqPct = (p.stats.requiresImprovement / total * 100).toFixed(0);
            var inadPct = (p.stats.inadequate / total * 100).toFixed(0);

            html += '<div class="provider-card" onclick="CRMApp.showProviderDetail(\'' + p.id + '\')">' +
                '<div class="provider-card-header">' +
                '<div class="provider-card-name">' + self.escapeHtml(p.name) + '</div>' +
                '<span class="provider-card-badge">' + self.formatNumber(p.stats.total) + '</span>' +
                '</div>' +
                '<div class="provider-card-stats">' +
                '<div class="provider-stat-item"><div class="provider-stat-value green">' + p.stats.outstanding + '</div><div class="provider-stat-label">Outstanding</div></div>' +
                '<div class="provider-stat-item"><div class="provider-stat-value blue">' + p.stats.good + '</div><div class="provider-stat-label">Good</div></div>' +
                '<div class="provider-stat-item"><div class="provider-stat-value orange">' + p.stats.requiresImprovement + '</div><div class="provider-stat-label">Requires</div></div>' +
                '<div class="provider-stat-item"><div class="provider-stat-value red">' + p.stats.inadequate + '</div><div class="provider-stat-label">Inadequate</div></div>' +
                '</div>' +
                '<div class="provider-card-rating-bar">' +
                '<div class="provider-rating-segment outstanding" style="width:' + outPct + '%"></div>' +
                '<div class="provider-rating-segment good" style="width:' + goodPct + '%"></div>' +
                '<div class="provider-rating-segment requires" style="width:' + reqPct + '%"></div>' +
                '<div class="provider-rating-segment inadequate" style="width:' + inadPct + '%"></div>' +
                '</div>' +
                '<div class="provider-card-footer">' +
                '<span class="provider-card-meta">' + p.stats.careHomes + ' care homes</span>' +
                '<button class="provider-view-btn">View Details <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></button>' +
                '</div>' +
                '</div>';
        });

        container.innerHTML = html;
        this.renderProvidersPagination();
    },

    renderProvidersPagination: function () {
        var container = document.getElementById('providers-pagination');
        if (!container) return;

        var totalPages = Math.ceil(this.filteredProviders.length / this.providersPerPage) || 1;

        container.innerHTML =
            '<button ' + (this.providerPage === 1 ? 'disabled' : '') + ' onclick="CRMApp.goToProviderPage(' + (this.providerPage - 1) + ')">← Previous</button>' +
            '<span>Page ' + this.providerPage + ' of ' + totalPages + '</span>' +
            '<button ' + (this.providerPage >= totalPages ? 'disabled' : '') + ' onclick="CRMApp.goToProviderPage(' + (this.providerPage + 1) + ')">Next →</button>';
    },

    goToProviderPage: function (page) {
        this.providerPage = page;
        this.renderProviderCards();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    escapeHtml: function (text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    showProviderDetail: function (providerId, skipUrlUpdate) {
        var provider = this.providersData.find(function (p) { return p.id === providerId; });
        if (!provider) return;

        // Store current provider and reset filters
        this.currentProviderForModal = provider;
        this.providerModalFilters = [];

        // Update URL with provider ID (unless we're coming from URL)
        if (!skipUrlUpdate) {
            var url = new URL(window.location);
            url.searchParams.set('provider', providerId);
            window.history.pushState({ provider: providerId }, '', url);
        }

        var modal = document.getElementById('provider-detail-modal');
        var nameEl = document.getElementById('provider-modal-name');
        var countEl = document.getElementById('provider-modal-count');
        var statsEl = document.getElementById('provider-stats-summary');

        if (nameEl) nameEl.textContent = provider.name;
        if (countEl) countEl.textContent = this.formatNumber(provider.stats.total) + ' properties managed';

        // Stats summary - now with clickable toggle filters
        if (statsEl) {
            statsEl.innerHTML =
                '<div class="provider-summary-stat filter-toggle" data-rating="Outstanding" onclick="CRMApp.toggleProviderModalFilter(this, \'Outstanding\')">' +
                '<div class="value" style="color:var(--green)">' + provider.stats.outstanding + '</div>' +
                '<div class="label">Outstanding</div>' +
                '</div>' +
                '<div class="provider-summary-stat filter-toggle" data-rating="Good" onclick="CRMApp.toggleProviderModalFilter(this, \'Good\')">' +
                '<div class="value" style="color:var(--blue)">' + provider.stats.good + '</div>' +
                '<div class="label">Good</div>' +
                '</div>' +
                '<div class="provider-summary-stat filter-toggle" data-rating="Requires improvement" onclick="CRMApp.toggleProviderModalFilter(this, \'Requires improvement\')">' +
                '<div class="value" style="color:var(--orange)">' + provider.stats.requiresImprovement + '</div>' +
                '<div class="label">Requires Imp.</div>' +
                '</div>' +
                '<div class="provider-summary-stat filter-toggle" data-rating="Inadequate" onclick="CRMApp.toggleProviderModalFilter(this, \'Inadequate\')">' +
                '<div class="value" style="color:var(--red)">' + provider.stats.inadequate + '</div>' +
                '<div class="label">Inadequate</div>' +
                '</div>';
        }

        // Render properties list
        this.renderProviderPropertiesList(provider);

        // Populate enrichment data
        this.populateProviderEnrichment(provider);

        // Show modal
        if (modal) modal.classList.add('active');

        // Initialize mini map after modal is visible
        var self = this;
        setTimeout(function () {
            self.renderProviderMiniMap(provider);
        }, 100);
    },

    populateProviderEnrichment: function (provider) {
        var websiteBtn = document.getElementById('provider-website-btn');
        var chBtn = document.getElementById('provider-ch-btn');
        var directorsSection = document.getElementById('provider-directors-section');
        var directorsList = document.getElementById('provider-directors-list');
        var findDirectorsBtn = document.getElementById('provider-find-directors-btn');
        var niSection = document.getElementById('provider-ni-section');
        var niNameEl = document.getElementById('ni-name');
        var niLinkedInBtn = document.getElementById('ni-linkedin-btn');
        var viewMoreBtn = document.getElementById('view-more-directors-btn');
        var hiddenCount = document.getElementById('hidden-directors-count');

        // Store current provider for enrichProvider function
        this.currentProvider = provider;
        this.directorsExpanded = false;

        // Reset visibility
        if (websiteBtn) websiteBtn.style.display = 'none';
        if (chBtn) chBtn.style.display = 'none';
        if (directorsSection) directorsSection.style.display = 'none';
        if (niSection) niSection.style.display = 'none';
        if (viewMoreBtn) viewMoreBtn.style.display = 'none';
        if (findDirectorsBtn) {
            findDirectorsBtn.style.display = 'inline-flex';
            findDirectorsBtn.disabled = false;
            var btnText = findDirectorsBtn.querySelector('.btn-text');
            if (btnText) btnText.textContent = 'Find Directors';
            findDirectorsBtn.classList.remove('btn-success');
        }

        // Display Nominated Individual from facilities
        var nominatedIndividual = null;
        provider.facilities.forEach(function (f) {
            if (f['Nominated Individual Name'] && !nominatedIndividual) {
                nominatedIndividual = f['Nominated Individual Name'];
            }
        });

        if (nominatedIndividual && niSection && niNameEl && niLinkedInBtn) {
            niNameEl.textContent = nominatedIndividual;
            // Generate Google search URL for LinkedIn
            var searchQuery = '"' + nominatedIndividual + '" "' + provider.name + '" site:linkedin.com';
            niLinkedInBtn.href = 'https://www.google.com/search?q=' + encodeURIComponent(searchQuery);
            niSection.style.display = 'block';
            // Store for enrichment
            this.currentNominatedIndividual = nominatedIndividual;
        }

        // Check first facility for enriched data (all should share provider data)
        var firstFacility = provider.facilities && provider.facilities[0];
        if (!firstFacility) return;

        // Fetch enriched data from database
        var self = this;
        var providerId = provider.id.replace('provider-', '');

        // Query for provider-level enrichment data
        this.supabase
            .from('facilities')
            .select('provider_website, companies_house_number, directors')
            .eq('Provider ID', providerId)
            .limit(1)
            .then(function (response) {
                if (response.error || !response.data || response.data.length === 0) {
                    return;
                }

                var data = response.data[0];
                var hasEnrichmentData = false;

                // Website button
                if (data.provider_website && websiteBtn) {
                    websiteBtn.href = data.provider_website;
                    websiteBtn.style.display = 'inline-flex';
                }

                // Companies House button
                if (data.companies_house_number && chBtn) {
                    chBtn.href = 'https://find-and-update.company-information.service.gov.uk/company/' + data.companies_house_number;
                    chBtn.style.display = 'inline-flex';
                    hasEnrichmentData = true;
                }

                // Company info header
                var companyInfoEl = document.getElementById('provider-company-info');
                if (companyInfoEl && (data.companies_house_number || data.company_incorporated_on)) {
                    var companyInfoHtml = '<div class="company-info-row">';
                    if (data.companies_house_number) {
                        companyInfoHtml += '<span class="company-info-item"><strong>Company No:</strong> ' + data.companies_house_number + '</span>';
                    }
                    if (data.company_incorporated_on) {
                        companyInfoHtml += '<span class="company-info-divider">|</span>';
                        companyInfoHtml += '<span class="company-info-item"><strong>Incorporated:</strong> ' + self.formatDate(data.company_incorporated_on) + '</span>';
                    }
                    if (data.company_status) {
                        companyInfoHtml += '<span class="company-info-divider">|</span>';
                        companyInfoHtml += '<span class="company-info-item"><strong>Status:</strong> ' + data.company_status + '</span>';
                    }
                    companyInfoHtml += '</div>';
                    companyInfoEl.innerHTML = companyInfoHtml;
                    companyInfoEl.style.display = 'block';
                }

                // Directors section - filter out secretaries, sort by appointment date
                if (data.directors && Array.isArray(data.directors) && data.directors.length > 0 && directorsSection && directorsList) {
                    // Filter to only directors (exclude secretaries)
                    var directors = data.directors.filter(function (d) {
                        var role = (d.role || d.officer_role || '').toLowerCase();
                        // Exclude any role containing 'secretary'
                        if (role.indexOf('secretary') > -1) return false;
                        // Include only roles containing 'director'
                        return role.indexOf('director') > -1;
                    });

                    // Sort by appointment date (earliest first = top)
                    directors.sort(function (a, b) {
                        var dateA = new Date(a.appointed_on || a.appointed || '9999-12-31');
                        var dateB = new Date(b.appointed_on || b.appointed || '9999-12-31');
                        return dateA - dateB;
                    });

                    var directorsHtml = '';
                    directors.forEach(function (director, index) {
                        var rank = index + 1;
                        var initials = self.getInitials(director.name);
                        var appointedDate = director.appointed_on || director.appointed;
                        var roleDisplay = 'Director' + (appointedDate ? ' - ' + self.formatDate(appointedDate) : '');
                        var directorId = 'director-' + index;

                        // Check if director has cached enrichment data
                        var hasEnrichedEmail = director.enriched_email !== undefined;
                        var hasEnrichedPhone = director.enriched_phone !== undefined;
                        var isEnriched = hasEnrichedEmail || hasEnrichedPhone;

                        // Phone display
                        var phoneClass = isEnriched ? (director.enriched_phone ? 'contact-found' : 'contact-not-found') : 'contact-blurred';
                        var phoneText = isEnriched ? (director.enriched_phone || 'Not found') : '••••••••••';

                        // Email display
                        var emailClass = isEnriched ? (director.enriched_email ? 'contact-found' : 'contact-not-found') : 'contact-blurred';
                        var emailText = isEnriched ? (director.enriched_email || 'Not found') : '••••••••••••••';

                        directorsHtml += '<div class="director-item" id="' + directorId + '" data-director-name="' + self.escapeHtml(director.name) + '">' +
                            '<div class="director-rank">' + rank + '</div>' +
                            '<div class="director-avatar">' + initials + '</div>' +
                            '<div class="director-info">' +
                            '<div class="director-name">' + self.escapeHtml(director.name) + '</div>' +
                            '<div class="director-role">' + self.escapeHtml(roleDisplay) + '</div>' +
                            '<div class="director-contact">' +
                            '<div class="director-contact-item">' +
                            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>' +
                            '<span class="contact-value ' + phoneClass + '" data-type="phone">' + self.escapeHtml(phoneText) + '</span>' +
                            '</div>' +
                            '<div class="director-contact-item">' +
                            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>' +
                            '<span class="contact-value ' + emailClass + '" data-type="email">' + self.escapeHtml(emailText) + '</span>' +
                            '</div>' +
                            '</div>' +
                            '</div>' +
                            (isEnriched ? '' : '<button class="director-find-btn" onclick="CRMApp.enrichDirector(\'' + self.escapeHtml(director.name).replace(/'/g, "\\'") + '\')"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon></svg> Find</button>') +
                            '</div>';
                    });
                    directorsList.innerHTML = directorsHtml;
                    directorsSection.style.display = 'block';
                    hasEnrichmentData = true;

                    // Limit directors to 4 visible, show "View more" button for rest
                    var MAX_VISIBLE = 4;
                    if (directors.length > MAX_VISIBLE) {
                        var items = directorsList.querySelectorAll('.director-item');
                        for (var i = MAX_VISIBLE; i < items.length; i++) {
                            items[i].classList.add('hidden-director');
                        }
                        if (viewMoreBtn && hiddenCount) {
                            hiddenCount.textContent = directors.length - MAX_VISIBLE;
                            viewMoreBtn.style.display = 'block';
                        }
                    }
                }

                // Hide Find Directors button if data already exists
                if (hasEnrichmentData && findDirectorsBtn) {
                    findDirectorsBtn.style.display = 'none';
                }
            });
    },

    getInitials: function (name) {
        if (!name) return '?';
        var parts = name.split(' ').filter(function (p) { return p.length > 0; });
        if (parts.length === 0) return '?';
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    },

    getRatingClass: function (rating) {
        if (!rating) return 'unknown';
        var r = rating.toLowerCase().replace(/\s+/g, '-');
        if (r === 'requires-improvement') return 'requires';
        if (r === 'inadequate') return 'inadequate';
        if (r === 'outstanding') return 'outstanding';
        if (r === 'good') return 'good';
        return r;
    },

    toggleDirectorsList: function () {
        var directorsList = document.getElementById('provider-directors-list');
        var viewMoreBtn = document.getElementById('view-more-directors-btn');
        var hiddenCount = document.getElementById('hidden-directors-count');

        if (!directorsList) return;

        this.directorsExpanded = !this.directorsExpanded;
        var items = directorsList.querySelectorAll('.director-item.hidden-director');

        items.forEach(function (item) {
            if (this.directorsExpanded) {
                item.classList.add('show');
            } else {
                item.classList.remove('show');
            }
        }.bind(this));

        if (viewMoreBtn) {
            viewMoreBtn.textContent = this.directorsExpanded ? 'Show less' : ('View ' + hiddenCount.textContent + ' more');
        }
    },

    enrichNominatedIndividual: function () {
        var self = this;
        var btn = document.getElementById('ni-enrich-btn');
        var btnText = btn ? btn.querySelector('.btn-text') : null;
        var btnSpinner = btn ? btn.querySelector('.btn-spinner') : null;
        var contactDetails = document.getElementById('ni-contact-details');

        if (!this.currentProvider || !this.currentNominatedIndividual) {
            console.error('No current provider or nominated individual');
            return;
        }

        var companyName = this.currentProvider.name;
        var personName = this.currentNominatedIndividual;
        var providerId = this.currentProvider.id.replace('provider-', '');

        // Show loading state
        if (btn) btn.disabled = true;
        if (btnText) btnText.textContent = 'Enriching...';
        if (btnSpinner) btnSpinner.style.display = 'inline-flex';

        // Call the enrich-director Edge Function (works for any person)
        fetch('https://qdrbwvxqtgwjgitcambn.supabase.co/functions/v1/enrich-director', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                directorName: personName,
                companyName: companyName,
                providerId: providerId
            })
        })
            .then(function (response) { return response.json(); })
            .then(function (data) {
                if (btnSpinner) btnSpinner.style.display = 'none';

                if (data.success && (data.email || data.phone)) {
                    // Show contact details
                    if (contactDetails) {
                        var html = '';
                        if (data.email) {
                            html += '<div class="contact-row">' +
                                '<span class="contact-label">Email</span>' +
                                '<a href="mailto:' + data.email + '" class="contact-value">' + data.email + '</a>' +
                                '</div>';
                        }
                        if (data.phone) {
                            html += '<div class="contact-row">' +
                                '<span class="contact-label">Phone</span>' +
                                '<a href="tel:' + data.phone + '" class="contact-value">' + data.phone + '</a>' +
                                '</div>';
                        }
                        if (data.linkedin_url) {
                            html += '<div class="contact-row">' +
                                '<span class="contact-label">LinkedIn</span>' +
                                '<a href="' + data.linkedin_url + '" target="_blank" class="contact-value">View Profile</a>' +
                                '</div>';
                        }
                        contactDetails.innerHTML = html;
                        contactDetails.style.display = 'block';
                    }

                    if (btnText) btnText.textContent = 'Enriched!';
                    btn.classList.add('btn-success');
                } else {
                    if (btnText) btnText.textContent = 'Not Found';
                    setTimeout(function () {
                        if (btnText) btnText.textContent = 'Enrich Contact';
                        if (btn) btn.disabled = false;
                    }, 2000);
                }
            })
            .catch(function (error) {
                console.error('NI Enrichment error:', error);
                if (btnText) btnText.textContent = 'Error';
                if (btnSpinner) btnSpinner.style.display = 'none';
                if (btn) btn.disabled = false;
                setTimeout(function () {
                    if (btnText) btnText.textContent = 'Enrich Contact';
                }, 2000);
            });
    },

    formatDate: function (dateStr) {
        if (!dateStr) return '';
        try {
            var date = new Date(dateStr);
            var options = { day: 'numeric', month: 'short', year: 'numeric' };
            return date.toLocaleDateString('en-GB', options);
        } catch (e) {
            return dateStr;
        }
    },

    enrichDirector: function (directorName) {
        var self = this;

        // Find the director card by data attribute
        var directorCards = document.querySelectorAll('.director-item[data-director-name]');
        var directorCard = null;
        directorCards.forEach(function (card) {
            if (card.getAttribute('data-director-name') === directorName) {
                directorCard = card;
            }
        });

        if (!directorCard) {
            console.error('Director card not found:', directorName);
            return;
        }

        var findBtn = directorCard.querySelector('.director-find-btn');
        var phoneEl = directorCard.querySelector('.contact-value[data-type="phone"]');
        var emailEl = directorCard.querySelector('.contact-value[data-type="email"]');

        if (!findBtn) return;

        // Get company name from current provider
        var companyName = this.currentProvider ? (this.currentProvider['Provider Name'] || this.currentProvider.name) : '';
        if (!companyName) {
            console.error('No company name available');
            return;
        }

        // Show loading state
        var originalBtnText = findBtn.innerHTML;
        findBtn.innerHTML = '<span class="btn-spinner"></span> Loading...';
        findBtn.disabled = true;

        // Get provider ID from current provider
        var providerId = this.currentProvider ? (this.currentProvider.id || '').replace('provider-', '') : '';

        // Call the Edge Function
        fetch('https://qdrbwvxqtgwjgitcambn.supabase.co/functions/v1/enrich-director', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                directorName: directorName,
                companyName: companyName,
                providerId: providerId
            })
        })
            .then(function (response) { return response.json(); })
            .then(function (data) {
                if (data.success) {
                    // Update phone
                    if (phoneEl) {
                        phoneEl.textContent = data.phone || 'Not found';
                        phoneEl.classList.remove('contact-blurred');
                        if (data.phone) {
                            phoneEl.classList.add('contact-found');
                        } else {
                            phoneEl.classList.add('contact-not-found');
                        }
                    }

                    // Update email
                    if (emailEl) {
                        emailEl.textContent = data.email || 'Not found';
                        emailEl.classList.remove('contact-blurred');
                        if (data.email) {
                            emailEl.classList.add('contact-found');
                        } else {
                            emailEl.classList.add('contact-not-found');
                        }
                    }

                    // Hide the find button
                    findBtn.style.display = 'none';
                } else {
                    // No match found
                    if (phoneEl) {
                        phoneEl.textContent = 'Not found';
                        phoneEl.classList.remove('contact-blurred');
                        phoneEl.classList.add('contact-not-found');
                    }
                    if (emailEl) {
                        emailEl.textContent = 'Not found';
                        emailEl.classList.remove('contact-blurred');
                        emailEl.classList.add('contact-not-found');
                    }
                    findBtn.style.display = 'none';
                }
            })
            .catch(function (error) {
                console.error('Enrichment error:', error);
                findBtn.innerHTML = 'Error';
                findBtn.disabled = false;
                setTimeout(function () {
                    findBtn.innerHTML = originalBtnText;
                }, 2000);
            });
    },

    enrichProvider: function () {
        var self = this;
        var btn = document.getElementById('provider-find-directors-btn');
        var btnText = btn ? btn.querySelector('.btn-text') : null;
        var btnSpinner = btn ? btn.querySelector('.btn-spinner') : null;
        var btnIcon = btn ? btn.querySelector('.btn-icon-svg') : null;

        if (!this.currentProvider) {
            console.error('No current provider to enrich');
            return;
        }

        var provider = this.currentProvider;
        var providerName = provider.name;
        var providerId = provider.id.replace('provider-', '');
        var firstFacility = provider.facilities && provider.facilities[0];
        var locationId = firstFacility ? firstFacility['Location ID'] : null;

        // Show loading state
        if (btn) btn.disabled = true;
        if (btnText) btnText.textContent = 'Searching...';
        if (btnIcon) btnIcon.style.display = 'none';
        if (btnSpinner) btnSpinner.style.display = 'inline-flex';

        // Call the Edge Function
        var edgeFunctionUrl = 'https://qdrbwvxqtgwjgitcambn.supabase.co/functions/v1/enrich-provider';

        fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                providerName: providerName,
                providerId: providerId,
                locationId: locationId
            })
        })
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                // Reset button state
                if (btn) btn.disabled = false;
                if (btnIcon) btnIcon.style.display = 'block';
                if (btnSpinner) btnSpinner.style.display = 'none';

                if (data.success) {
                    // Update button to show success
                    if (btnText) btnText.textContent = 'Found!';
                    btn.classList.add('btn-success');

                    // Show Companies House button
                    var chBtn = document.getElementById('provider-ch-btn');
                    if (chBtn && data.company_number) {
                        chBtn.href = 'https://find-and-update.company-information.service.gov.uk/company/' + data.company_number;
                        chBtn.style.display = 'inline-flex';
                    }

                    // Show directors
                    var directorsSection = document.getElementById('provider-directors-section');
                    var directorsList = document.getElementById('provider-directors-list');

                    // Show company info header
                    var companyInfoEl = document.getElementById('provider-company-info');
                    if (companyInfoEl && data.company_number) {
                        var companyInfoHtml = '<div class="company-info-row">';
                        companyInfoHtml += '<span class="company-info-item"><strong>Company No:</strong> ' + data.company_number + '</span>';
                        if (data.company_incorporated_on) {
                            companyInfoHtml += '<span class="company-info-divider">|</span>';
                            companyInfoHtml += '<span class="company-info-item"><strong>Incorporated:</strong> ' + self.formatDate(data.company_incorporated_on) + '</span>';
                        }
                        if (data.company_status) {
                            companyInfoHtml += '<span class="company-info-divider">|</span>';
                            companyInfoHtml += '<span class="company-info-item"><strong>Status:</strong> ' + data.company_status + '</span>';
                        }
                        companyInfoHtml += '</div>';
                        companyInfoEl.innerHTML = companyInfoHtml;
                        companyInfoEl.style.display = 'block';
                    }

                    if (data.directors && data.directors.length > 0 && directorsSection && directorsList) {
                        // Filter to only directors (exclude secretaries)
                        var directors = data.directors.filter(function (d) {
                            var role = (d.role || d.officer_role || '').toLowerCase();
                            // Exclude any role containing 'secretary'
                            if (role.indexOf('secretary') > -1) return false;
                            // Include only roles containing 'director'
                            return role.indexOf('director') > -1;
                        });

                        // Sort by appointment date (earliest first = top)
                        directors.sort(function (a, b) {
                            var dateA = new Date(a.appointed_on || a.appointed || '9999-12-31');
                            var dateB = new Date(b.appointed_on || b.appointed || '9999-12-31');
                            return dateA - dateB;
                        });

                        var directorsHtml = '';
                        directors.forEach(function (director, index) {
                            var rank = index + 1;
                            var initials = self.getInitials(director.name);
                            var appointedDate = director.appointed_on || director.appointed;
                            var roleDisplay = 'Director' + (appointedDate ? ' - ' + self.formatDate(appointedDate) : '');
                            var directorId = 'director-enrich-' + index;

                            directorsHtml += '<div class="director-item" id="' + directorId + '" data-director-name="' + self.escapeHtml(director.name) + '">' +
                                '<div class="director-rank">' + rank + '</div>' +
                                '<div class="director-avatar">' + initials + '</div>' +
                                '<div class="director-info">' +
                                '<div class="director-name">' + self.escapeHtml(director.name) + '</div>' +
                                '<div class="director-role">' + self.escapeHtml(roleDisplay) + '</div>' +
                                '<div class="director-contact">' +
                                '<div class="director-contact-item">' +
                                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>' +
                                '<span class="contact-value contact-blurred" data-type="phone">••••••••••</span>' +
                                '</div>' +
                                '<div class="director-contact-item">' +
                                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>' +
                                '<span class="contact-value contact-blurred" data-type="email">••••••••••••••</span>' +
                                '</div>' +
                                '</div>' +
                                '</div>' +
                                '<button class="director-find-btn" onclick="CRMApp.enrichDirector(\'' + self.escapeHtml(director.name).replace(/'/g, "\\'") + '\')">' +
                                '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon></svg>' +
                                ' Find' +
                                '</button>' +
                                '</div>';
                        });
                        directorsList.innerHTML = directorsHtml;
                        directorsSection.style.display = 'block';
                    }

                    // Hide the find button after success (data is now saved)
                    setTimeout(function () {
                        if (btn) btn.style.display = 'none';
                    }, 1500);
                } else {
                    // No match found
                    if (btnText) btnText.textContent = 'No Match Found';
                    setTimeout(function () {
                        if (btnText) btnText.textContent = 'Find Directors';
                    }, 2000);
                }
            })
            .catch(function (error) {
                console.error('Enrichment error:', error);
                if (btn) btn.disabled = false;
                if (btnText) btnText.textContent = 'Error - Retry';
                if (btnIcon) btnIcon.style.display = 'block';
                if (btnSpinner) btnSpinner.style.display = 'none';
            });
    },

    toggleProviderModalFilter: function (element, rating) {
        var index = this.providerModalFilters.indexOf(rating);

        if (index > -1) {
            // Remove filter
            this.providerModalFilters.splice(index, 1);
            element.classList.remove('active');
        } else {
            // Add filter
            this.providerModalFilters.push(rating);
            element.classList.add('active');
        }

        // Re-render the properties list with filters applied
        this.renderProviderPropertiesList(this.currentProviderForModal);
    },

    renderProviderPropertiesList: function (provider) {
        var listEl = document.getElementById('provider-properties-list');
        if (!listEl || !provider) return;

        var self = this;
        var facilities = provider.facilities;

        // Apply filters if any are active
        if (this.providerModalFilters.length > 0) {
            facilities = facilities.filter(function (f) {
                return self.providerModalFilters.indexOf(f.overallRating) > -1;
            });
        }

        if (facilities.length === 0) {
            listEl.innerHTML = '<div class="provider-properties-empty">No properties match the selected filters</div>';
            return;
        }

        var listHtml = '';
        facilities.forEach(function (f) {
            var ratingClass = (f.overallRating || '').toLowerCase().replace(/\s+/g, '-');
            if (ratingClass === 'requires-improvement') ratingClass = 'requires';

            listHtml += '<div class="provider-property-item" onclick="CRMApp.closeProviderDetail(); CRMApp.showDetail(\'' + f.id + '\')">' +
                '<div class="provider-property-info">' +
                '<div class="provider-property-name">' + self.escapeHtml(f.name) + '</div>' +
                '<div class="provider-property-location">' + (f.address ? (f.address.city || '') + ' ' + (f.address.postcode || '') : '') + '</div>' +
                '</div>' +
                '<div class="provider-property-badge"><span class="badge ' + ratingClass + '">' + (f.overallRating || 'Not Rated') + '</span></div>' +
                '</div>';
        });
        listEl.innerHTML = listHtml;
    },

    renderProviderMiniMap: function (provider) {
        var mapContainer = document.getElementById('provider-mini-map');
        if (!mapContainer) return;

        // Clear existing map
        if (this.providerMiniMap) {
            this.providerMiniMap.remove();
            this.providerMiniMap = null;
        }

        // Create map
        this.providerMiniMap = L.map(mapContainer, {
            center: [54.5, -2],
            zoom: 5,
            zoomControl: true
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap, &copy; CartoDB',
            maxZoom: 19
        }).addTo(this.providerMiniMap);

        // Add markers for all facilities
        var bounds = [];
        var colors = {
            'Outstanding': '#22c55e',
            'Good': '#3b82f6',
            'Requires improvement': '#f59e0b',
            'Inadequate': '#ef4444'
        };

        var self = this;
        provider.facilities.forEach(function (f) {
            var lat = f.address?.latitude;
            var lng = f.address?.longitude;

            if (!lat || !lng) return;

            var color = colors[f.overallRating] || '#8c8c8c';

            var icon = L.divIcon({
                html: '<div style="width:12px;height:12px;background:' + color + ';border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>',
                className: 'provider-map-marker',
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            });

            var marker = L.marker([lat, lng], { icon: icon }).addTo(self.providerMiniMap);
            marker.bindPopup('<div class="popup-title">' + self.escapeHtml(f.name) + '</div><div class="popup-meta">' + (f.overallRating || 'Not Rated') + '</div>');

            bounds.push([lat, lng]);
        });

        // Fit bounds if we have markers
        if (bounds.length > 0) {
            if (bounds.length === 1) {
                this.providerMiniMap.setView(bounds[0], 12);
            } else {
                this.providerMiniMap.fitBounds(bounds, { padding: [20, 20] });
            }
        }
    },

    closeProviderDetail: function () {
        var modal = document.getElementById('provider-detail-modal');
        if (modal) modal.classList.remove('active');

        // Clear URL parameter
        var url = new URL(window.location);
        if (url.searchParams.has('provider')) {
            url.searchParams.delete('provider');
            window.history.pushState({}, '', url);
        }

        // Reset modal state
        this.currentProviderForModal = null;
        this.providerModalFilters = [];

        // Clean up mini map
        if (this.providerMiniMap) {
            this.providerMiniMap.remove();
            this.providerMiniMap = null;
        }
    },

    // ========================================
    // PEOPLE VIEW FUNCTIONS
    // ========================================

    // Guard to prevent concurrent buildPeopleData calls
    _buildingPeopleData: null,

    buildPeopleData: async function () {
        var self = this;

        // If already loading, return the existing promise (prevents race condition)
        if (this._buildingPeopleData) {
            return this._buildingPeopleData;
        }

        this._buildingPeopleData = (async function () {
            // Reset the array at the start
            var newPeopleData = [];

            try {
                // Fetch only nominated individuals from Supabase people table
                var response = await fetch(
                    SUPABASE_URL + '/rest/v1/people?select=*&role=eq.nominated_individual&order=total_beds.desc',
                    {
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
                        }
                    }
                );

                if (!response.ok) {
                    console.error('Failed to fetch people:', response.status);
                    return;
                }

                var people = await response.json();

                // Map region codes to names
                var regionMap = {
                    '0': 'East Midlands',
                    '1': 'East of England',
                    '2': 'London',
                    '3': 'North East',
                    '4': 'North West',
                    'Y': 'Yorkshire & Humber',
                    '5': 'South East',
                    '6': 'South West',
                    '7': 'West Midlands',
                    '8': 'Yorkshire and The Humber'
                };

                // Deduplicate by person name - keep only one entry per unique person (with highest beds)
                // Since results are ordered by total_beds.desc, first occurrence has highest beds
                var seenPeople = {};

                people.forEach(function (p) {
                    // Aggressive normalization: lowercase, remove all non-alphanumeric, collapse spaces
                    var normalizedName = (p.name || '')
                        .toLowerCase()
                        .replace(/[^a-z0-9\s]/g, '')  // Remove non-alphanumeric except spaces
                        .replace(/\s+/g, ' ')          // Collapse multiple spaces
                        .trim();

                    // Skip if we already have this person
                    if (seenPeople[normalizedName]) {
                        return;
                    }
                    seenPeople[normalizedName] = true;

                    newPeopleData.push({
                        id: p.id,
                        name: p.name || 'Unknown',
                        role: p.role,
                        roleLabel: 'Nominated Individual',
                        providerName: p.provider_name || 'Unknown Provider',
                        providerId: p.provider_id,
                        totalBeds: p.total_beds || 0,
                        propertyCount: p.total_properties || 0,
                        region: regionMap[p.region] || p.region || 'Unknown',
                        yearsAtProvider: p.years_at_provider || 0,
                        lastReportRating: p.last_report_rating || 'Unknown',
                        lastInspectionDate: p.last_inspection_date,
                        isEnriched: !!p.enriched_at,
                        email: p.email,
                        phone: p.phone,
                        linkedinUrl: p.linkedin_url,
                        contacted: p.contacted || false,
                        contactedAt: p.contacted_at,
                        notes: p.notes
                    });

                });

                // Assign all at once (atomic operation)
                self.peopleData = newPeopleData;
                console.log('Loaded ' + self.peopleData.length + ' unique people from Supabase');
            } catch (error) {
                console.error('Error fetching people:', error);
            } finally {
                // Clear the guard so future calls can rebuild if needed
                self._buildingPeopleData = null;
            }

            // Update people count badge
            self.updatePeopleCount();
        })();

        return this._buildingPeopleData;
    },


    updatePeopleCount: function () {
        var countEl = document.getElementById('people-count');
        if (countEl) {
            countEl.textContent = this.formatNumber(this.peopleData.length);
        }
    },

    renderPeopleView: async function () {
        // Build people data if not already built
        if (this.peopleData.length === 0) {
            await this.buildPeopleData();
        }

        // Populate region filter
        this.populatePeopleRegionFilter();

        // Setup search and filter handlers
        this.setupPeopleSearch();

        // Apply filters and render
        this.filterPeople();
    },


    populatePeopleRegionFilter: function () {
        var filterEl = document.getElementById('people-region-filter');
        if (!filterEl) return;

        var regions = {};
        this.peopleData.forEach(function (person) {
            if (person.region && person.region !== 'Unknown') {
                regions[person.region] = true;
            }
        });

        var regionList = Object.keys(regions).sort();
        var html = '<option value="">All Regions</option>';
        regionList.forEach(function (region) {
            html += '<option value="' + region + '">' + region + '</option>';
        });
        filterEl.innerHTML = html;
    },

    setupPeopleSearch: function () {
        var self = this;
        var searchInput = document.getElementById('people-search');
        var regionFilter = document.getElementById('people-region-filter');
        var bedsFilter = document.getElementById('people-beds-filter');
        var outreachFilter = document.getElementById('people-outreach-filter');

        if (searchInput) {
            searchInput.addEventListener('input', function () {
                self.peoplePage = 1;
                self.filterPeople();
            });
        }

        if (regionFilter) {
            regionFilter.addEventListener('change', function () {
                self.peoplePage = 1;
                self.filterPeople();
            });
        }

        // Multi-select beds filter setup
        if (bedsFilter) {
            var trigger = bedsFilter.querySelector('.multi-select-trigger');
            var checkboxes = bedsFilter.querySelectorAll('input[type="checkbox"]');

            // Toggle dropdown on trigger click
            if (trigger) {
                trigger.addEventListener('click', function (e) {
                    e.stopPropagation();
                    bedsFilter.classList.toggle('open');
                });
            }

            // Handle checkbox changes
            checkboxes.forEach(function (cb) {
                cb.addEventListener('change', function () {
                    self.updatePeopleBedsLabel(bedsFilter);
                    self.peoplePage = 1;
                    self.filterPeople();
                });
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', function (e) {
                if (!bedsFilter.contains(e.target)) {
                    bedsFilter.classList.remove('open');
                }
            });
        }

        if (outreachFilter) {
            outreachFilter.addEventListener('change', function () {
                self.peoplePage = 1;
                self.filterPeople();
            });
        }
    },

    updatePeopleBedsLabel: function (dropdown) {
        var label = dropdown.querySelector('.multi-select-label');
        var checkboxes = dropdown.querySelectorAll('input[type="checkbox"]:checked');

        if (checkboxes.length === 0) {
            label.textContent = 'All Sizes';
        } else if (checkboxes.length === 1) {
            label.textContent = checkboxes[0].parentNode.textContent.trim();
        } else {
            label.textContent = checkboxes.length + ' sizes selected';
        }
    },

    filterPeople: function () {
        var self = this;
        var searchQuery = document.getElementById('people-search')?.value?.toLowerCase() || '';
        var regionFilter = document.getElementById('people-region-filter')?.value || '';
        var outreachFilter = document.getElementById('people-outreach-filter')?.value || '';

        // Get selected bed ranges from multi-select
        var bedsFilterEl = document.getElementById('people-beds-filter');
        var selectedBedRanges = [];
        if (bedsFilterEl) {
            var checkboxes = bedsFilterEl.querySelectorAll('input[type="checkbox"]:checked');
            checkboxes.forEach(function (cb) {
                selectedBedRanges.push(cb.value);
            });
        }

        this.filteredPeople = this.peopleData.filter(function (person) {
            // Search filter
            if (searchQuery) {
                var nameMatch = person.name.toLowerCase().indexOf(searchQuery) > -1;
                var providerMatch = person.providerName.toLowerCase().indexOf(searchQuery) > -1;
                if (!nameMatch && !providerMatch) return false;
            }

            // Region filter
            if (regionFilter && person.region !== regionFilter) {
                return false;
            }

            // Beds filter (multi-select)
            if (selectedBedRanges.length > 0) {
                var beds = person.totalBeds || 0;
                var matchesRange = selectedBedRanges.some(function (range) {
                    if (range === '1-50') return beds >= 1 && beds <= 50;
                    if (range === '51-200') return beds >= 51 && beds <= 200;
                    if (range === '201-500') return beds >= 201 && beds <= 500;
                    if (range === '500+') return beds > 500;
                    return false;
                });
                if (!matchesRange) return false;
            }

            // Outreach filter
            if (outreachFilter === 'contacted' && !person.contacted) return false;
            if (outreachFilter === 'not-contacted' && person.contacted) return false;

            return true;
        });

        // Apply sorting based on peopleSortState (sort by total beds)
        if (this.peopleSortState !== 'off') {
            var self = this;
            this.filteredPeople.sort(function (a, b) {
                var aValue = a.totalBeds || 0;
                var bValue = b.totalBeds || 0;
                if (self.peopleSortState === 'desc') {
                    return bValue - aValue;
                } else {
                    return aValue - bValue;
                }
            });
        }

        // Update subtitle
        var subtitleEl = document.getElementById('people-subtitle');
        if (subtitleEl) {
            subtitleEl.textContent = this.formatNumber(this.filteredPeople.length) + ' decision makers';
        }

        this.renderPeopleCards();
    },


    renderPeopleCards: function () {
        var container = document.getElementById('people-grid');
        if (!container) return;

        var self = this;
        var start = (this.peoplePage - 1) * this.peoplePerPage;
        var end = start + this.peoplePerPage;
        var pagePeople = this.filteredPeople.slice(start, end);

        if (pagePeople.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No people found matching your filters</p></div>';
            this.renderPeoplePagination();
            return;
        }

        var html = '';
        pagePeople.forEach(function (person) {
            var initials = self.getInitials(person.name);
            var regionLabel = person.region || 'Unknown';
            var bedsFormatted = self.formatNumber(person.totalBeds);
            var roleClass = person.role === 'nominated_individual' ? 'role-ni' : 'role-rm';
            var ratingClass = self.getRatingClass(person.lastReportRating);
            var yearsLabel = person.yearsAtProvider > 0 ? Math.round(person.yearsAtProvider) + ' yrs' : '';
            var contactedClass = person.contacted ? 'contacted' : '';

            html += '<div class="people-card ' + contactedClass + '" onclick="CRMApp.showPersonDetail(\'' + person.id + '\')">' +
                '<div class="people-card-header">' +
                '<div class="people-card-avatar">' + initials + '</div>' +
                '<div class="people-card-info">' +
                '<div class="people-card-name">' + self.escapeHtml(person.name) + '</div>' +
                '<span class="people-role-badge ' + roleClass + '">' + person.roleLabel + '</span>' +
                '</div>' +
                '</div>' +
                '<div class="people-card-provider">' + self.escapeHtml(person.providerName) + '</div>' +
                '<div class="people-card-stats">' +
                '<div class="people-stat">' +
                '<span class="stat-value">' + bedsFormatted + '</span>' +
                '<span class="stat-label">beds</span>' +
                '</div>' +
                '<div class="people-stat">' +
                '<span class="stat-value">' + person.propertyCount + '</span>' +
                '<span class="stat-label">properties</span>' +
                '</div>' +
                (yearsLabel ? '<div class="people-stat"><span class="stat-value">' + yearsLabel + '</span><span class="stat-label">tenure</span></div>' : '') +
                '</div>' +
                '<div class="people-card-footer">' +
                '<span class="people-card-region">' + regionLabel + '</span>' +
                '<span class="badge ' + ratingClass + '">' + (person.lastReportRating || 'Unknown') + '</span>' +
                '</div>' +
                '<div class="people-card-contact">' +
                '<div class="contact-preview ' + (person.isEnriched ? 'unlocked' : 'locked') + '">' +
                (person.isEnriched ?
                    '<span class="contact-found">✓ Contact info</span>' :
                    '<span class="contact-locked"><svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg> Unlock contact</span>') +
                '</div>' +
                '</div>' +
                '</div>';
        });


        container.innerHTML = html;
        this.renderPeoplePagination();
    },

    renderPeoplePagination: function () {
        var container = document.getElementById('people-pagination');
        if (!container) return;

        var totalPages = Math.ceil(this.filteredPeople.length / this.peoplePerPage) || 1;

        container.innerHTML =
            '<button ' + (this.peoplePage === 1 ? 'disabled' : '') + ' onclick="CRMApp.goToPeoplePage(' + (this.peoplePage - 1) + ')">← Previous</button>' +
            '<span>Page ' + this.peoplePage + ' of ' + totalPages + '</span>' +
            '<button ' + (this.peoplePage >= totalPages ? 'disabled' : '') + ' onclick="CRMApp.goToPeoplePage(' + (this.peoplePage + 1) + ')">Next →</button>';
    },

    goToPeoplePage: function (page) {
        this.peoplePage = page;
        this.renderPeopleCards();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    showPersonDetail: function (personId) {
        var person = this.peopleData.find(function (p) { return p.id === personId; });
        if (!person) return;

        this.currentPersonForModal = person;

        var modal = document.getElementById('people-detail-modal');
        var nameEl = document.getElementById('people-modal-name');
        var providerEl = document.getElementById('people-modal-provider');
        var countEl = document.getElementById('people-modal-count');
        var providerNameEl = document.getElementById('person-provider-name');
        var providerCountEl = document.getElementById('person-provider-count');
        var linkedInEl = document.getElementById('person-linkedin');
        var phoneEl = document.getElementById('person-phone');
        var emailEl = document.getElementById('person-email');
        var unlockSection = document.getElementById('person-unlock-section');
        var unlockBtn = document.getElementById('person-unlock-btn');

        if (nameEl) nameEl.textContent = person.name;
        if (providerEl) providerEl.textContent = person.providerName;
        if (countEl) countEl.textContent = this.formatNumber(person.propertyCount) + ' properties';
        if (providerNameEl) providerNameEl.textContent = person.providerName;
        if (providerCountEl) providerCountEl.textContent = person.propertyCount + ' properties';

        // Populate stats section
        var totalBedsEl = document.getElementById('person-total-beds');
        var totalPropsEl = document.getElementById('person-total-properties');
        var avgBedsEl = document.getElementById('person-avg-beds');
        var tenureEl = document.getElementById('person-tenure');
        var ratingBadgeEl = document.getElementById('person-rating-badge');

        if (totalBedsEl) totalBedsEl.textContent = this.formatNumber(person.totalBeds || 0);
        if (totalPropsEl) totalPropsEl.textContent = this.formatNumber(person.propertyCount || 0);

        // Calculate average beds per property
        var avgBeds = person.propertyCount > 0 ? Math.round(person.totalBeds / person.propertyCount) : 0;
        if (avgBedsEl) avgBedsEl.textContent = avgBeds;

        // Format tenure
        var tenureText = person.yearsAtProvider > 0 ? Math.round(person.yearsAtProvider) + ' yrs' : '—';
        if (tenureEl) tenureEl.textContent = tenureText;

        // Rating badge
        if (ratingBadgeEl) {
            ratingBadgeEl.textContent = person.lastReportRating || 'Unknown';
            ratingBadgeEl.className = 'badge ' + this.getRatingClass(person.lastReportRating);
        }

        // Populate context section - Most Recent Report
        var lastInspectionEl = document.getElementById('person-last-inspection');
        var contextRatingEl = document.getElementById('person-context-rating');

        if (lastInspectionEl) {
            if (person.lastInspectionDate) {
                var inspDate = new Date(person.lastInspectionDate);
                lastInspectionEl.textContent = inspDate.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });
            } else {
                lastInspectionEl.textContent = '—';
            }
        }
        if (contextRatingEl) {
            contextRatingEl.textContent = person.lastReportRating || 'Unknown';
            contextRatingEl.className = 'badge ' + this.getRatingClass(person.lastReportRating);
        }

        // LinkedIn search link - use linkedin.com at end (not site:linkedin.com)
        if (linkedInEl) {
            var searchQuery = person.name + ' ' + person.providerName + ' linkedin.com';
            linkedInEl.href = 'https://www.google.com/search?q=' + encodeURIComponent(searchQuery);
        }

        // Reset contact display
        if (phoneEl) {
            phoneEl.textContent = person.phone || '••••••••••';
            phoneEl.className = 'contact-value ' + (person.phone ? 'contact-found' : 'contact-blurred');
        }
        if (emailEl) {
            emailEl.textContent = person.email || '••••••••••••••';
            emailEl.className = 'contact-value ' + (person.email ? 'contact-found' : 'contact-blurred');
        }

        // Show/hide unlock button based on enrichment status
        if (unlockSection && unlockBtn) {
            if (person.isEnriched) {
                unlockSection.style.display = 'none';
            } else {
                unlockSection.style.display = 'block';
                unlockBtn.disabled = false;
                var btnText = unlockBtn.querySelector('.btn-text');
                if (btnText) btnText.textContent = 'Unlock Contact Info';
                unlockBtn.classList.remove('btn-success');
            }
        }

        // Check for existing enrichment data
        this.checkPersonEnrichment(person);

        // Show modal
        if (modal) modal.classList.add('active');

        // Fetch facilities for this person's provider and render map
        var self = this;
        this.fetchProviderFacilitiesForMap(person).then(function (facilities) {
            person.providerFacilities = facilities;
            self.renderPeopleMiniMap(person);
        });
    },

    fetchProviderFacilitiesForMap: async function (person) {
        var providerId = person.providerId ? person.providerId.replace('provider-', '') : null;
        if (!providerId) return [];

        try {
            var response = await fetch(
                SUPABASE_URL + '/rest/v1/facilities?select=name,overallRating,latitude,longitude&Provider%20ID=eq.' + encodeURIComponent(providerId),
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
                    }
                }
            );

            if (!response.ok) {
                console.error('Failed to fetch facilities for provider');
                return [];
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching facilities for map:', error);
            return [];
        }
    },

    checkPersonEnrichment: function (person) {
        var self = this;
        var providerId = person.providerId.replace('provider-', '');

        // Query for existing enrichment data
        this.supabase
            .from('facilities')
            .select('directors')
            .eq('Provider ID', providerId)
            .limit(1)
            .then(function (response) {
                if (response.error || !response.data || response.data.length === 0) {
                    return;
                }

                var data = response.data[0];
                if (data.directors && Array.isArray(data.directors)) {
                    // Try to find this person in the directors list
                    var personMatch = data.directors.find(function (d) {
                        return d.name && d.name.toLowerCase() === person.name.toLowerCase();
                    });

                    if (personMatch && (personMatch.enriched_email || personMatch.enriched_phone)) {
                        // Update person data
                        person.isEnriched = true;
                        person.email = personMatch.enriched_email || null;
                        person.phone = personMatch.enriched_phone || null;

                        // Update UI
                        var phoneEl = document.getElementById('person-phone');
                        var emailEl = document.getElementById('person-email');
                        var unlockSection = document.getElementById('person-unlock-section');

                        if (phoneEl) {
                            phoneEl.textContent = person.phone || 'Requires enrichment';
                            phoneEl.className = 'contact-value ' + (person.phone ? 'contact-found' : 'contact-pending');
                        }
                        if (emailEl) {
                            emailEl.textContent = person.email || 'Requires enrichment';
                            emailEl.className = 'contact-value ' + (person.email ? 'contact-found' : 'contact-pending');
                        }
                        if (unlockSection) {
                            unlockSection.style.display = 'none';
                        }
                    }
                }
            });
    },

    enrichPerson: function () {
        var self = this;
        var btn = document.getElementById('person-unlock-btn');
        var btnText = btn ? btn.querySelector('.btn-text') : null;
        var btnSpinner = btn ? btn.querySelector('.btn-spinner') : null;
        var btnIcon = btn ? btn.querySelector('.btn-icon-svg') : null;
        var phoneEl = document.getElementById('person-phone');
        var emailEl = document.getElementById('person-email');
        var unlockSection = document.getElementById('person-unlock-section');

        if (!this.currentPersonForModal) {
            console.error('No current person to enrich');
            return;
        }

        var person = this.currentPersonForModal;
        var companyName = person.providerName;
        var personName = person.name;
        var providerId = person.providerId.replace('provider-', '');

        // Show loading state
        if (btn) btn.disabled = true;
        if (btnText) btnText.textContent = 'Searching...';
        if (btnIcon) btnIcon.style.display = 'none';
        if (btnSpinner) btnSpinner.style.display = 'inline-flex';

        // Call the enrich-director Edge Function
        fetch('https://qdrbwvxqtgwjgitcambn.supabase.co/functions/v1/enrich-director', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                directorName: personName,
                companyName: companyName,
                providerId: providerId
            })
        })
            .then(function (response) { return response.json(); })
            .then(function (data) {
                if (btnSpinner) btnSpinner.style.display = 'none';
                if (btnIcon) btnIcon.style.display = 'block';

                if (data.success && (data.email || data.phone)) {
                    // Update person data
                    person.isEnriched = true;
                    person.email = data.email || null;
                    person.phone = data.phone || null;

                    // Update UI
                    if (phoneEl) {
                        phoneEl.textContent = data.phone || 'Not found';
                        phoneEl.className = 'contact-value ' + (data.phone ? 'contact-found' : 'contact-not-found');
                    }
                    if (emailEl) {
                        emailEl.textContent = data.email || 'Not found';
                        emailEl.className = 'contact-value ' + (data.email ? 'contact-found' : 'contact-not-found');
                    }

                    if (btnText) btnText.textContent = 'Unlocked!';
                    btn.classList.add('btn-success');

                    // Hide unlock button after success
                    setTimeout(function () {
                        if (unlockSection) unlockSection.style.display = 'none';
                    }, 1500);

                    // Re-render cards to show updated status
                    self.renderPeopleCards();
                } else {
                    // No match found
                    if (phoneEl) {
                        phoneEl.textContent = 'Not found';
                        phoneEl.className = 'contact-value contact-not-found';
                    }
                    if (emailEl) {
                        emailEl.textContent = 'Not found';
                        emailEl.className = 'contact-value contact-not-found';
                    }
                    if (btnText) btnText.textContent = 'Not Found';
                    setTimeout(function () {
                        if (btnText) btnText.textContent = 'Unlock Contact Info';
                        if (btn) btn.disabled = false;
                    }, 2000);
                }
            })
            .catch(function (error) {
                console.error('Enrichment error:', error);
                if (btnText) btnText.textContent = 'Error';
                if (btnSpinner) btnSpinner.style.display = 'none';
                if (btnIcon) btnIcon.style.display = 'block';
                if (btn) btn.disabled = false;
                setTimeout(function () {
                    if (btnText) btnText.textContent = 'Unlock Contact Info';
                }, 2000);
            });
    },

    renderPeopleMiniMap: function (person) {
        var mapContainer = document.getElementById('people-mini-map');
        if (!mapContainer) return;

        // Clear existing map
        if (this.peopleMiniMap) {
            this.peopleMiniMap.remove();
            this.peopleMiniMap = null;
        }

        // Create map
        this.peopleMiniMap = L.map(mapContainer, {
            center: [54.5, -2],
            zoom: 5,
            zoomControl: true
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap, &copy; CartoDB',
            maxZoom: 19
        }).addTo(this.peopleMiniMap);

        // Add markers for all provider's facilities
        var bounds = [];
        var colors = {
            'Outstanding': '#22c55e',
            'Good': '#3b82f6',
            'Requires improvement': '#f59e0b',
            'Inadequate': '#ef4444'
        };

        var self = this;
        var facilities = person.providerFacilities || [];

        facilities.forEach(function (f) {
            var lat = f.latitude;
            var lng = f.longitude;

            if (!lat || !lng) return;

            var color = colors[f.overallRating] || '#8c8c8c';

            var icon = L.divIcon({
                html: '<div style="width:12px;height:12px;background:' + color + ';border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>',
                className: 'people-map-marker',
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            });

            var marker = L.marker([lat, lng], { icon: icon }).addTo(self.peopleMiniMap);
            marker.bindPopup('<div class="popup-title">' + self.escapeHtml(f.name) + '</div><div class="popup-meta">' + (f.overallRating || 'Not Rated') + '</div>');

            bounds.push([lat, lng]);
        });

        // Fit bounds if we have markers
        if (bounds.length > 0) {
            if (bounds.length === 1) {
                this.peopleMiniMap.setView(bounds[0], 12);
            } else {
                this.peopleMiniMap.fitBounds(bounds, { padding: [20, 20] });
            }
        }
    },

    openProviderFromPerson: function () {
        if (!this.currentPersonForModal) return;

        var providerId = this.currentPersonForModal.providerId;

        // Close person modal
        this.closePersonDetail();

        // Switch to providers view and open provider modal
        this.switchView('providers');
        this.showProviderDetail(providerId);
    },

    closePersonDetail: function () {
        var modal = document.getElementById('people-detail-modal');
        if (modal) modal.classList.remove('active');

        // Reset modal state
        this.currentPersonForModal = null;

        // Clean up mini map
        if (this.peopleMiniMap) {
            this.peopleMiniMap.remove();
            this.peopleMiniMap = null;
        }
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function () {
    CRMApp.init();
});
