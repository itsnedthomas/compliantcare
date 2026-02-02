/**
 * CompliantCare CRM - Enrichment Status Handler
 * Shows live enrichment progress with refresh and feed
 */

var EnrichmentStatus = {
    totalCareHomes: 13726,
    enrichedCount: 0,
    recentlyEnriched: [],
    autoRefreshInterval: null,

    async init() {
        console.log('EnrichmentStatus: Initializing...');
        await this.refresh();
        // Auto-refresh every 5 seconds when on enrichment view
        this.startAutoRefresh();
    },

    startAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        this.autoRefreshInterval = setInterval(() => {
            const enrichmentView = document.getElementById('enrichment-view');
            if (enrichmentView && enrichmentView.classList.contains('active')) {
                this.refresh(true); // silent refresh
            }
        }, 5000);
    },

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    },

    async refresh(silent = false) {
        const btn = document.getElementById('refresh-enrichment-btn');
        if (btn && !silent) {
            btn.classList.add('loading');
        }

        try {
            // Fetch enriched count
            const countResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/facilities?select=cqc_last_synced&cqc_last_synced=not.is.null`,
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    }
                }
            );

            if (countResponse.ok) {
                const data = await countResponse.json();
                this.enrichedCount = data.length;
            }

            // Fetch recently enriched care homes
            const recentResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/facilities?select=Location ID,Location Name,Location City,Location Region,Latest Rating,cqc_last_synced&cqc_last_synced=not.is.null&order=cqc_last_synced.desc&limit=50`,
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    }
                }
            );

            if (recentResponse.ok) {
                this.recentlyEnriched = await recentResponse.json();
            }

            this.updateUI();

        } catch (error) {
            console.error('EnrichmentStatus: Error fetching data:', error);
        } finally {
            if (btn && !silent) {
                btn.classList.remove('loading');
            }
        }
    },

    updateUI() {
        // Update stats
        const enrichedCountEl = document.getElementById('enriched-count');
        const totalEl = document.getElementById('total-care-homes');
        const percentEl = document.getElementById('enrichment-percent');
        const etaEl = document.getElementById('enrichment-eta');
        const progressBar = document.getElementById('enrichment-progress-bar');
        const progressText = document.getElementById('enrichment-progress-text');
        const feedUpdateTime = document.getElementById('feed-update-time');

        const percent = (this.enrichedCount / this.totalCareHomes * 100).toFixed(1);
        const remaining = this.totalCareHomes - this.enrichedCount;
        // Assuming ~10 per second
        const etaMins = Math.ceil(remaining / 10 / 60);

        if (enrichedCountEl) {
            enrichedCountEl.textContent = this.enrichedCount.toLocaleString();
        }
        if (totalEl) {
            totalEl.textContent = this.totalCareHomes.toLocaleString();
        }
        if (percentEl) {
            percentEl.textContent = `${percent}%`;
        }
        if (etaEl) {
            etaEl.textContent = remaining > 0 ? etaMins : '✓';
        }
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
        if (progressText) {
            progressText.textContent = `${this.enrichedCount.toLocaleString()} / ${this.totalCareHomes.toLocaleString()} care homes enriched`;
        }
        if (feedUpdateTime) {
            feedUpdateTime.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
        }

        // Update feed
        this.renderFeed();
    },

    renderFeed() {
        const feedEl = document.getElementById('enrichment-feed');
        if (!feedEl) return;

        if (this.recentlyEnriched.length === 0) {
            feedEl.innerHTML = `
                <div class="feed-loading">
                    <div class="loader"></div>
                    <p>No enriched data yet...</p>
                </div>
            `;
            return;
        }

        const items = this.recentlyEnriched.map(facility => {
            const name = facility['Location Name'] || 'Unknown';
            const city = facility['Location City'] || '';
            const region = facility['Location Region'] || '';
            const rating = facility['Latest Rating'] || 'Unknown';
            const syncTime = facility.cqc_last_synced ? new Date(facility.cqc_last_synced) : null;
            const timeAgo = syncTime ? this.getTimeAgo(syncTime) : '';

            const ratingClass = this.getRatingClass(rating);

            return `
                <div class="enrichment-feed-item">
                    <div class="feed-item-icon">
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                        </svg>
                    </div>
                    <div class="feed-item-content">
                        <div class="feed-item-name">${this.escapeHtml(name)}</div>
                        <div class="feed-item-details">
                            ${city ? city + ', ' : ''}${region} • 
                            <span class="badge ${ratingClass}" style="padding: 2px 8px; font-size: 11px;">${rating}</span>
                        </div>
                    </div>
                    <div class="feed-item-time">${timeAgo}</div>
                </div>
            `;
        }).join('');

        feedEl.innerHTML = items;
    },

    getRatingClass(rating) {
        const r = (rating || '').toLowerCase();
        if (r.includes('outstanding')) return 'outstanding';
        if (r.includes('good')) return 'good';
        if (r.includes('requires')) return 'requires';
        if (r.includes('inadequate')) return 'inadequate';
        return 'draft';
    },

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 120) return '1 min ago';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
        if (seconds < 7200) return '1 hour ago';
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        return date.toLocaleDateString();
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Export to window
window.EnrichmentStatus = EnrichmentStatus;
console.log('EnrichmentStatus loaded');
