/**
 * Free Audit Module
 * Provides search functionality with autocomplete and animated audit report generation
 */

var FreeAudit = {
    searchTimeout: null,
    selectedFacility: null,

    /**
     * Initialize the Free Audit module
     */
    init: function () {
        var searchInput = document.getElementById('audit-search-input');
        var suggestionsEl = document.getElementById('audit-suggestions');

        if (!searchInput) return;

        // Input event for typeahead search
        searchInput.addEventListener('input', function (e) {
            var query = e.target.value.trim();

            // Clear previous timeout
            if (FreeAudit.searchTimeout) {
                clearTimeout(FreeAudit.searchTimeout);
            }

            // If query is too short, hide suggestions
            if (query.length < 3) {
                suggestionsEl.classList.remove('active');
                suggestionsEl.innerHTML = '';
                return;
            }

            // Debounce the search
            FreeAudit.searchTimeout = setTimeout(function () {
                FreeAudit.searchFacilities(query);
            }, 300);
        });

        // Close suggestions when clicking outside
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.audit-search-wrapper')) {
                suggestionsEl.classList.remove('active');
            }
        });

        // Handle Enter key
        searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                var query = e.target.value.trim();
                if (query.length >= 3) {
                    FreeAudit.searchFacilities(query);
                }
            }
        });
    },

    /**
     * Search for facilities by name
     */
    searchFacilities: async function (query) {
        var suggestionsEl = document.getElementById('audit-suggestions');

        try {
            // Show loading state
            suggestionsEl.innerHTML = '<div class="audit-suggestions-empty">Searching...</div>';
            suggestionsEl.classList.add('active');

            // Search in Supabase - using the 'facilities' table
            // Column names with spaces need proper URL encoding in PostgREST
            var encodedQuery = encodeURIComponent(query);
            var url = SUPABASE_URL + '/rest/v1/facilities?or=(' +
                encodeURIComponent('"Location Name".ilike.*' + query + '*') +
                ')&select=' + encodeURIComponent('"Location ID","Location Name","Location Street Address","Location City","Location Post Code","Latest Rating","number_of_beds","Provider Name"') +
                '&limit=10';

            var response = await fetch(url, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
                }
            });

            var facilities = await response.json();

            if (!facilities || facilities.length === 0) {
                suggestionsEl.innerHTML = '<div class="audit-suggestions-empty">No care homes found matching "' + query + '"</div>';
                return;
            }

            // Render suggestions
            var html = facilities.map(function (facility) {
                var address = [facility['Location Street Address'], facility['Location City'], facility['Location Post Code']]
                    .filter(Boolean)
                    .join(', ');

                var badgeClass = FreeAudit.getRatingClass(facility['Latest Rating']);
                var badgeText = facility['Latest Rating'] || 'Unrated';

                return '<div class="audit-suggestion-item" onclick="FreeAudit.selectFacility(\'' + facility['Location ID'] + '\')">' +
                    '<div class="suggestion-icon">' +
                    '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">' +
                    '<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd" />' +
                    '</svg>' +
                    '</div>' +
                    '<div class="suggestion-info">' +
                    '<div class="suggestion-name">' + facility['Location Name'] + '</div>' +
                    '<div class="suggestion-address">' + address + '</div>' +
                    '</div>' +
                    '<div class="suggestion-badge">' +
                    '<span class="badge ' + badgeClass + '">' + badgeText + '</span>' +
                    '</div>' +
                    '</div>';
            }).join('');

            suggestionsEl.innerHTML = html;

        } catch (error) {
            console.error('Error searching facilities:', error);
            suggestionsEl.innerHTML = '<div class="audit-suggestions-empty">Error searching. Please try again.</div>';
        }
    },

    /**
     * Handle example button clicks
     */
    searchExample: function (query) {
        var searchInput = document.getElementById('audit-search-input');
        searchInput.value = query;
        searchInput.focus();
        FreeAudit.searchFacilities(query);
    },

    /**
     * Select a facility and generate the audit report
     */
    selectFacility: async function (facilityId) {
        var suggestionsEl = document.getElementById('audit-suggestions');
        var searchContainer = document.querySelector('.audit-search-container');
        var resultsContainer = document.getElementById('audit-results-container');
        var loadingEl = document.getElementById('audit-loading');
        var reportEl = document.getElementById('audit-report');

        // Hide suggestions
        suggestionsEl.classList.remove('active');

        // Show results container with loading state
        searchContainer.style.display = 'none';
        resultsContainer.style.display = 'block';
        loadingEl.style.display = 'flex';
        reportEl.style.display = 'none';

        // Reset loading step states
        var loadingSteps = document.querySelectorAll('.loading-step');
        loadingSteps.forEach(function (step) {
            step.classList.remove('active', 'complete');
        });

        try {
            // Animate the loading steps
            await FreeAudit.animateLoadingStep(1, 'Fetching CQC Data...');

            // Fetch facility data - using proper PostgREST encoding for column names with spaces
            var url = SUPABASE_URL + '/rest/v1/facilities?' +
                encodeURIComponent('"Location ID"') + '=eq.' + encodeURIComponent(facilityId) +
                '&select=*';

            var response = await fetch(url, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
                }
            });

            var facilities = await response.json();

            if (!facilities || facilities.length === 0) {
                throw new Error('Facility not found');
            }

            var facility = facilities[0];
            FreeAudit.selectedFacility = facility;

            await FreeAudit.animateLoadingStep(2, 'Checking Inspection History...');
            await new Promise(function (resolve) { setTimeout(resolve, 600); });

            await FreeAudit.animateLoadingStep(3, 'Analyzing Ratings...');
            await new Promise(function (resolve) { setTimeout(resolve, 500); });

            await FreeAudit.animateLoadingStep(4, 'Generating Audit Report...');
            await new Promise(function (resolve) { setTimeout(resolve, 400); });

            // Render the report
            FreeAudit.renderAuditReport(facility);

            // Show the report
            loadingEl.style.display = 'none';
            reportEl.style.display = 'block';

            // Trigger bar animations after a short delay
            setTimeout(function () {
                FreeAudit.animateRatingBars(facility);
            }, 300);

        } catch (error) {
            console.error('Error loading facility:', error);
            alert('Error loading care home data. Please try again.');
            FreeAudit.backToSearch();
        }
    },

    /**
     * Animate a loading step
     */
    animateLoadingStep: function (stepNumber, statusText) {
        return new Promise(function (resolve) {
            var step = document.querySelector('.loading-step[data-step="' + stepNumber + '"]');
            var statusEl = document.getElementById('audit-loading-status');

            // Mark previous steps as complete
            for (var i = 1; i < stepNumber; i++) {
                var prevStep = document.querySelector('.loading-step[data-step="' + i + '"]');
                if (prevStep) {
                    prevStep.classList.remove('active');
                    prevStep.classList.add('complete');
                }
            }

            // Mark current step as active
            if (step) {
                step.classList.add('active');
            }

            if (statusEl) {
                statusEl.textContent = statusText;
            }

            setTimeout(resolve, 400);
        });
    },

    /**
     * Render the audit report with facility data
     */
    renderAuditReport: function (facility) {
        // Header info
        document.getElementById('audit-home-name').textContent = facility['Location Name'] || 'Unknown';

        var address = [
            facility['Location Street Address'],
            facility['Location City'],
            facility['Location Post Code']
        ].filter(Boolean).join(', ');
        document.getElementById('audit-home-address').textContent = address || '--';

        document.getElementById('audit-provider-name').textContent = facility['Provider Name'] || '--';

        // Overall rating
        var ratingEl = document.getElementById('audit-overall-rating');
        ratingEl.textContent = facility['Latest Rating'] || 'Unrated';
        ratingEl.className = 'badge badge-lg ' + FreeAudit.getRatingClass(facility['Latest Rating']);

        // Stats
        document.getElementById('audit-beds').textContent = facility['number_of_beds'] || '--';

        var lastInspection = facility['latest_report_date'] || facility['last_inspection_date'];
        if (lastInspection) {
            var date = new Date(lastInspection);
            document.getElementById('audit-last-inspection').textContent = date.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } else {
            document.getElementById('audit-last-inspection').textContent = '--';
        }

        var registeredDate = facility['registration_date'];
        if (registeredDate) {
            var regDate = new Date(registeredDate);
            document.getElementById('audit-registered').textContent = regDate.toLocaleDateString('en-GB', {
                month: 'short',
                year: 'numeric'
            });
        } else {
            document.getElementById('audit-registered').textContent = '--';
        }

        // Region
        var region = facility['Location Region'] || facility['local_authority'] || '--';
        document.getElementById('audit-region').textContent = region;

        // Ratings breakdown
        FreeAudit.setRating('safe', facility['rating_safe']);
        FreeAudit.setRating('effective', facility['rating_effective']);
        FreeAudit.setRating('caring', facility['rating_caring']);
        FreeAudit.setRating('responsive', facility['rating_responsive']);
        FreeAudit.setRating('wellled', facility['rating_wellled']);

        // Leadership
        var niName = facility['nominated_individual_name'] || '--';
        document.getElementById('audit-ni-name').textContent = niName;

        var rmName = facility['registered_manager_name'] || '--';
        document.getElementById('audit-rm-name').textContent = rmName;

        // Contact info
        document.getElementById('audit-phone').textContent = facility['cqc_phone'] || '--';

        var websiteEl = document.getElementById('audit-website');
        if (facility['cqc_website']) {
            websiteEl.textContent = facility['cqc_website'].replace(/^https?:\/\//, '');
            websiteEl.href = facility['cqc_website'];
        } else {
            websiteEl.textContent = '--';
            websiteEl.removeAttribute('href');
        }

        var cqcLink = document.getElementById('audit-cqc-link');
        if (facility['Location ID']) {
            cqcLink.href = 'https://www.cqc.org.uk/location/' + facility['Location ID'];
        } else {
            cqcLink.href = '#';
        }
    },

    /**
     * Set a rating badge and prepare for bar animation
     */
    setRating: function (domain, rating) {
        var badgeEl = document.getElementById('audit-rating-' + domain);
        var barEl = document.getElementById('audit-bar-' + domain);

        if (!badgeEl || !barEl) return;

        var displayRating = rating || '--';
        badgeEl.textContent = displayRating;
        badgeEl.className = 'badge ' + FreeAudit.getRatingClass(rating);

        // Reset bar
        barEl.style.width = '0%';
        barEl.className = 'domain-fill ' + FreeAudit.getRatingClass(rating).replace('badge-', '');
    },

    /**
     * Animate the rating bars
     */
    animateRatingBars: function (facility) {
        var ratings = [
            { domain: 'safe', value: facility['rating_safe'] },
            { domain: 'effective', value: facility['rating_effective'] },
            { domain: 'caring', value: facility['rating_caring'] },
            { domain: 'responsive', value: facility['rating_responsive'] },
            { domain: 'wellled', value: facility['rating_wellled'] }
        ];

        ratings.forEach(function (item, index) {
            setTimeout(function () {
                var barEl = document.getElementById('audit-bar-' + item.domain);
                if (barEl) {
                    barEl.style.width = FreeAudit.getRatingWidth(item.value);
                }
            }, index * 100);
        });
    },

    /**
     * Get width percentage for rating bar
     */
    getRatingWidth: function (rating) {
        if (!rating) return '0%';

        var lowerRating = rating.toLowerCase();
        if (lowerRating === 'outstanding') return '100%';
        if (lowerRating === 'good') return '75%';
        if (lowerRating === 'requires improvement') return '50%';
        if (lowerRating === 'inadequate') return '25%';
        return '0%';
    },

    /**
     * Get badge class for a rating
     */
    getRatingClass: function (rating) {
        if (!rating) return 'badge-muted';

        var lowerRating = rating.toLowerCase();
        if (lowerRating === 'outstanding') return 'badge-success';
        if (lowerRating === 'good') return 'badge-success';
        if (lowerRating === 'requires improvement') return 'badge-warning';
        if (lowerRating === 'inadequate') return 'badge-danger';
        return 'badge-muted';
    },

    /**
     * Go back to search view
     */
    backToSearch: function () {
        var searchContainer = document.querySelector('.audit-search-container');
        var resultsContainer = document.getElementById('audit-results-container');
        var searchInput = document.getElementById('audit-search-input');

        resultsContainer.style.display = 'none';
        searchContainer.style.display = 'flex';

        // Clear search
        if (searchInput) {
            searchInput.value = '';
        }

        FreeAudit.selectedFacility = null;
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    FreeAudit.init();
});
