/**
 * CompliantCare CRM - Groups Handler
 * Manages owner groups (providers/brands) and their properties
 */

const GroupsHandler = {
    groups: [],
    groupsMap: new Map(),

    /**
     * Extract unique groups from facilities data
     */
    extractGroups(facilities) {
        const groupsMap = new Map();

        facilities.forEach(facility => {
            // Provider is a nested object with id and name
            const providerName = facility.provider?.name || 'Unknown Provider';
            const brandName = facility.brand?.name || null;

            // Use provider as primary group identifier
            const groupKey = providerName;

            if (!groupsMap.has(groupKey)) {
                groupsMap.set(groupKey, {
                    id: this.generateId(groupKey),
                    name: providerName,
                    brand: brandName,
                    properties: [],
                    ratings: {
                        outstanding: 0,
                        good: 0,
                        ri: 0,
                        inadequate: 0,
                        none: 0
                    },
                    regions: new Set(),
                    types: new Set()
                });
            }

            const group = groupsMap.get(groupKey);
            group.properties.push(facility);

            // Aggregate ratings
            const rating = facility.overallRating;
            if (rating === 'Outstanding') group.ratings.outstanding++;
            else if (rating === 'Good') group.ratings.good++;
            else if (rating === 'Requires improvement') group.ratings.ri++;
            else if (rating === 'Inadequate') group.ratings.inadequate++;
            else group.ratings.none++;

            // Aggregate regions and types
            if (facility.address?.region) {
                group.regions.add(facility.address.region);
            }
            if (facility.inspectionCategory) {
                group.types.add(facility.inspectionCategory);
            }
        });

        // Convert to array and sort by property count
        this.groups = Array.from(groupsMap.values())
            .map(g => ({
                ...g,
                propertyCount: g.properties.length,
                regions: Array.from(g.regions),
                types: Array.from(g.types),
                // Calculate quality score
                qualityScore: this.calculateQualityScore(g.ratings)
            }))
            .sort((a, b) => b.propertyCount - a.propertyCount);

        // Build lookup map
        this.groupsMap = new Map(this.groups.map(g => [g.id, g]));

        console.log(`Extracted ${this.groups.length} groups from ${facilities.length} facilities`);

        return this.groups;
    },

    /**
     * Generate consistent ID from name
     */
    generateId(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 50);
    },

    /**
     * Calculate quality score (higher is better)
     */
    calculateQualityScore(ratings) {
        const total = ratings.outstanding + ratings.good + ratings.ri + ratings.inadequate;
        if (total === 0) return 0;

        // Weighted score: Outstanding=4, Good=3, RI=1, Inadequate=0
        const score = (
            (ratings.outstanding * 4) +
            (ratings.good * 3) +
            (ratings.ri * 1) +
            (ratings.inadequate * 0)
        ) / total;

        return Math.round(score * 25); // 0-100 scale
    },

    /**
     * Get all groups
     */
    getAll() {
        return this.groups;
    },

    /**
     * Get group by ID
     */
    getById(id) {
        return this.groupsMap.get(id);
    },

    /**
     * Search groups
     */
    search(query) {
        if (!query) return this.groups;

        const lower = query.toLowerCase();
        return this.groups.filter(g =>
            g.name.toLowerCase().includes(lower) ||
            (g.brand && g.brand.toLowerCase().includes(lower))
        );
    },

    /**
     * Get top groups by property count
     */
    getTopGroups(limit = 10) {
        return this.groups.slice(0, limit);
    },

    /**
     * Get groups by region
     */
    getByRegion(region) {
        return this.groups.filter(g => g.regions.includes(region));
    },

    /**
     * Get statistics
     */
    getStats() {
        return {
            totalGroups: this.groups.length,
            singleProperty: this.groups.filter(g => g.propertyCount === 1).length,
            multiProperty: this.groups.filter(g => g.propertyCount > 1).length,
            largestGroup: this.groups[0] || null,
            averageProperties: Math.round(
                this.groups.reduce((sum, g) => sum + g.propertyCount, 0) / this.groups.length
            ) || 0
        };
    },

    /**
     * Render group card HTML
     */
    renderCard(group) {
        const primaryRating = this.getPrimaryRating(group.ratings);

        return `
            <div class="group-card" onclick="CRMApp.openGroup('${group.id}')">
                <div class="group-header">
                    <div class="group-name">${this.escapeHtml(group.name)}</div>
                    <span class="group-count">${group.propertyCount}</span>
                </div>
                <div class="group-meta">
                    <div class="group-stat">
                        <span class="group-stat-label">Primary Rating</span>
                        <span class="group-stat-value">${primaryRating}</span>
                    </div>
                    <div class="group-stat">
                        <span class="group-stat-label">Regions</span>
                        <span class="group-stat-value">${group.regions.length}</span>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Get primary (most common) rating for a group
     */
    getPrimaryRating(ratings) {
        const entries = [
            ['Outstanding', ratings.outstanding],
            ['Good', ratings.good],
            ['Requires Improvement', ratings.ri],
            ['Inadequate', ratings.inadequate]
        ];

        const sorted = entries.sort((a, b) => b[1] - a[1]);
        return sorted[0][1] > 0 ? sorted[0][0] : 'Not Rated';
    },

    /**
     * Render group detail panel content
     */
    renderDetail(group) {
        const ratingBars = this.renderRatingBars(group.ratings);
        const propertiesList = this.renderPropertiesList(group.properties.slice(0, 20));

        return `
            <div class="panel-section">
                <div class="panel-stats">
                    <div class="stat-card">
                        <div class="stat-label">Properties</div>
                        <div class="stat-value">${group.propertyCount}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Quality Score</div>
                        <div class="stat-value">${group.qualityScore}%</div>
                    </div>
                </div>
            </div>
            
            <div class="panel-section">
                <div class="form-label">Rating Distribution</div>
                ${ratingBars}
            </div>
            
            <div class="panel-section">
                <div class="form-label">Regions</div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;">
                    ${group.regions.map(r => `<span class="rating-pill none">${r}</span>`).join('')}
                </div>
            </div>
            
            <div class="panel-section">
                <div class="form-label">Properties (${group.propertyCount})</div>
                ${propertiesList}
                ${group.properties.length > 20 ? `
                    <div style="text-align: center; padding: 12px;">
                        <button class="btn btn-ghost" onclick="CRMApp.showAllGroupProperties('${group.id}')">
                            Show all ${group.propertyCount} properties
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * Render rating distribution bars
     */
    renderRatingBars(ratings) {
        const total = ratings.outstanding + ratings.good + ratings.ri + ratings.inadequate + ratings.none;
        if (total === 0) return '<div style="color: var(--text-muted);">No ratings</div>';

        const bars = [
            { label: 'Outstanding', count: ratings.outstanding, color: 'var(--rating-outstanding)' },
            { label: 'Good', count: ratings.good, color: 'var(--rating-good)' },
            { label: 'Requires Improvement', count: ratings.ri, color: 'var(--rating-ri)' },
            { label: 'Inadequate', count: ratings.inadequate, color: 'var(--rating-inadequate)' }
        ];

        return `
            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${bars.map(bar => {
            const pct = Math.round((bar.count / total) * 100);
            return `
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 100px; font-size: 11px; color: var(--text-muted);">${bar.label}</div>
                            <div style="flex: 1; height: 6px; background: var(--bg-glass); border-radius: 3px; overflow: hidden;">
                                <div style="width: ${pct}%; height: 100%; background: ${bar.color}; transition: width 0.3s;"></div>
                            </div>
                            <div style="width: 40px; font-size: 11px; color: var(--text-secondary); text-align: right;">${bar.count}</div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    },

    /**
     * Render properties list for group detail
     */
    renderPropertiesList(properties) {
        return `
            <div class="data-table-container" style="margin-top: 8px;">
                <table class="data-table">
                    <tbody>
                        ${properties.map(p => {
            const ratingClass = this.getRatingClass(p.overallRating);
            return `
                                <tr onclick="CRMApp.openProfile('${p.id}')" style="cursor: pointer;">
                                    <td>
                                        <div class="table-name">${this.escapeHtml(p.name)}</div>
                                        <div class="table-meta">${p.address?.city || ''}</div>
                                    </td>
                                    <td style="text-align: right;">
                                        <span class="rating-pill ${ratingClass}">${p.overallRating || 'Not rated'}</span>
                                    </td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * Get CSS class for rating
     */
    getRatingClass(rating) {
        switch (rating) {
            case 'Outstanding': return 'outstanding';
            case 'Good': return 'good';
            case 'Requires improvement': return 'ri';
            case 'Inadequate': return 'inadequate';
            default: return 'none';
        }
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Export
window.GroupsHandler = GroupsHandler;
