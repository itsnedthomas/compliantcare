/**
 * CompliantCare CRM - Filter Handler
 * Manages filtering and filter UI
 */

const FilterHandler = {
    filters: {
        region: '',
        rating: '',
        type: '',
        careHome: false
    },

    /**
     * Initialize filters
     */
    init() {
        const filterOptions = DataHandler.getFilterOptions();

        // Populate region dropdown
        const regionSelect = document.getElementById('filter-region');
        if (regionSelect && filterOptions.regions) {
            filterOptions.regions.forEach(region => {
                if (region) {
                    const option = document.createElement('option');
                    option.value = region;
                    option.textContent = region;
                    regionSelect.appendChild(option);
                }
            });
        }

        // Populate type dropdown
        const typeSelect = document.getElementById('filter-type');
        if (typeSelect && filterOptions.types) {
            filterOptions.types.forEach(type => {
                if (type) {
                    const option = document.createElement('option');
                    option.value = type;
                    option.textContent = type;
                    typeSelect.appendChild(option);
                }
            });
        }

        // Bind events
        this.bindEvents();
    },

    /**
     * Bind filter events
     */
    bindEvents() {
        // Region filter
        const regionSelect = document.getElementById('filter-region');
        if (regionSelect) {
            regionSelect.addEventListener('change', (e) => {
                this.filters.region = e.target.value;
                this.applyAndUpdate();
            });
        }

        // Rating filter
        const ratingSelect = document.getElementById('filter-rating');
        if (ratingSelect) {
            ratingSelect.addEventListener('change', (e) => {
                this.filters.rating = e.target.value;
                this.applyAndUpdate();
            });
        }

        // Type filter
        const typeSelect = document.getElementById('filter-type');
        if (typeSelect) {
            typeSelect.addEventListener('change', (e) => {
                this.filters.type = e.target.value;
                this.applyAndUpdate();
            });
        }

        // Care home checkbox
        const careHomeCheck = document.getElementById('filter-carehome');
        if (careHomeCheck) {
            careHomeCheck.addEventListener('change', (e) => {
                this.filters.careHome = e.target.checked;
                this.applyAndUpdate();
            });
        }

        // Clear all button
        const clearBtn = document.getElementById('clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearFilters());
        }
    },

    /**
     * Apply filters to data
     */
    applyFilters(facilities) {
        return facilities.filter(f => {
            // Region filter
            if (this.filters.region && f.address?.region !== this.filters.region) {
                return false;
            }

            // Rating filter
            if (this.filters.rating && f.overallRating !== this.filters.rating) {
                return false;
            }

            // Type filter
            if (this.filters.type && f.inspectionCategory !== this.filters.type) {
                return false;
            }

            // Care home filter
            if (this.filters.careHome && !f.isCareHome) {
                return false;
            }

            return true;
        });
    },

    /**
     * Apply filters and update UI
     */
    applyAndUpdate() {
        const allFacilities = DataHandler.getAllFacilities();
        const filtered = this.applyFilters(allFacilities);
        CRMApp.updateFilters(filtered);
    },

    /**
     * Clear all filters
     */
    clearFilters() {
        this.filters = {
            region: '',
            rating: '',
            type: '',
            careHome: false
        };

        // Reset UI
        const regionSelect = document.getElementById('filter-region');
        const ratingSelect = document.getElementById('filter-rating');
        const typeSelect = document.getElementById('filter-type');
        const careHomeCheck = document.getElementById('filter-carehome');

        if (regionSelect) regionSelect.value = '';
        if (ratingSelect) ratingSelect.value = '';
        if (typeSelect) typeSelect.value = '';
        if (careHomeCheck) careHomeCheck.checked = false;

        this.applyAndUpdate();
    }
};

// Export
window.FilterHandler = FilterHandler;
