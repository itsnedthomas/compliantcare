/**
 * CompliantCare CRM - Map Integration
 * Leaflet map with clustering and custom markers
 */

const MapHandler = {
    map: null,
    markers: null,
    geocodeCache: {},

    // UK region centers for fallback geocoding
    regionCenters: {
        'London': [51.5074, -0.1278],
        'South East': [51.2787, -0.5217],
        'South West': [50.7156, -3.5309],
        'East of England': [52.2053, 0.1218],
        'East Midlands': [52.8225, -1.0586],
        'West Midlands': [52.4862, -1.8904],
        'North West': [53.4808, -2.2426],
        'North East': [54.9783, -1.6178],
        'Yorkshire and The Humber': [53.8008, -1.5491],
        'Wales': [52.1307, -3.7837],
        'default': [54.5, -2.0]
    },

    /**
     * Initialize map
     */
    init() {
        // Wait for container to be visible
        const container = document.getElementById('map-container');
        if (!container) return;

        // Create map centered on UK
        this.map = L.map('map-container', {
            center: [54.5, -2.0],
            zoom: 6,
            minZoom: 5,
            maxZoom: 18,
            zoomControl: true
        });

        // Add dark tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.map);

        // Create marker cluster group
        this.markers = L.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            iconCreateFunction: (cluster) => {
                const count = cluster.getChildCount();
                let size = 'small';
                if (count > 100) size = 'large';
                else if (count > 50) size = 'medium';

                return L.divIcon({
                    html: `<div class="cluster-marker cluster-${size}">${count}</div>`,
                    className: 'custom-cluster',
                    iconSize: [40, 40]
                });
            }
        });

        this.map.addLayer(this.markers);

        // Add custom cluster styles
        this.addClusterStyles();

        // Fix map rendering after initial hide
        setTimeout(() => {
            this.map.invalidateSize();
        }, 100);
    },

    /**
     * Add cluster marker styles
     */
    addClusterStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .custom-cluster {
                background: transparent;
            }
            .cluster-marker {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                font-weight: 600;
                font-size: 13px;
                color: white;
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
                transition: transform 0.2s ease;
            }
            .cluster-marker:hover {
                transform: scale(1.1);
            }
            .cluster-small {
                width: 36px;
                height: 36px;
                font-size: 12px;
            }
            .cluster-medium {
                width: 44px;
                height: 44px;
            }
            .cluster-large {
                width: 52px;
                height: 52px;
                font-size: 14px;
            }
            .facility-marker {
                width: 14px;
                height: 14px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            }
            .facility-marker.outstanding { background: #fbbf24; }
            .facility-marker.good { background: #22c55e; }
            .facility-marker.ri { background: #f97316; }
            .facility-marker.inadequate { background: #ef4444; }
            .facility-marker.default { background: #6366f1; }
        `;
        document.head.appendChild(style);
    },

    /**
     * Get coordinates for a facility (using real geocoded data)
     */
    getCoordinates(facility) {
        // Use real geocoded coordinates if available
        if (facility.latitude && facility.longitude) {
            return [facility.latitude, facility.longitude];
        }

        // Fallback to region centers for facilities without geocoded postcodes
        const region = facility.address?.region || 'default';
        const center = this.regionCenters[region] || this.regionCenters['default'];

        // Add small random offset to prevent exact overlaps
        const latOffset = (Math.random() - 0.5) * 0.3;
        const lngOffset = (Math.random() - 0.5) * 0.3;

        return [center[0] + latOffset, center[1] + lngOffset];
    },

    /**
     * Get rating class for marker coloring
     */
    getRatingClass(rating) {
        switch (rating) {
            case 'Outstanding': return 'outstanding';
            case 'Good': return 'good';
            case 'Requires improvement': return 'ri';
            case 'Inadequate': return 'inadequate';
            default: return 'default';
        }
    },

    /**
     * Create popup content for a facility
     */
    createPopupContent(facility) {
        const ratingClass = this.getRatingClass(facility.overallRating);
        return `
            <div class="map-popup">
                <div class="map-popup-name">${facility.name}</div>
                <div class="map-popup-address">
                    ${facility.address.street}<br>
                    ${facility.address.city}, ${facility.address.postcode}
                </div>
                <span class="rating-badge ${ratingClass}" style="margin-bottom: 12px;">
                    ${facility.overallRating || 'Not rated'}
                </span>
                <br>
                <button class="map-popup-btn" onclick="CRMApp.openProfile('${facility.id}')">
                    View Profile
                </button>
            </div>
        `;
    },

    /**
     * Update map markers with filtered facilities
     */
    updateMarkers(facilities) {
        if (!this.map || !this.markers) return;

        // Clear existing markers
        this.markers.clearLayers();

        // Add markers for filtered facilities (increased limit with real geocoding)
        const limit = 20000;
        const toShow = facilities.slice(0, limit);

        const markerArray = [];

        toShow.forEach(facility => {
            const coords = this.getCoordinates(facility);
            const ratingClass = this.getRatingClass(facility.overallRating);

            const marker = L.marker(coords, {
                icon: L.divIcon({
                    html: `<div class="facility-marker ${ratingClass}"></div>`,
                    className: 'custom-marker',
                    iconSize: [14, 14],
                    iconAnchor: [7, 7]
                })
            });

            marker.bindPopup(this.createPopupContent(facility), {
                maxWidth: 280,
                closeButton: true
            });

            markerArray.push(marker);
        });

        this.markers.addLayers(markerArray);

        if (facilities.length > limit) {
            console.log(`Showing ${limit} of ${facilities.length} facilities on map`);
        }
    },

    /**
     * Refresh map size (call after view switch)
     */
    refresh() {
        if (this.map) {
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        }
    },

    /**
     * Focus on a specific region
     */
    focusRegion(region) {
        const center = this.regionCenters[region];
        if (center && this.map) {
            this.map.setView(center, 8, { animate: true });
        }
    },

    /**
     * Reset to UK view
     */
    resetView() {
        if (this.map) {
            this.map.setView([54.5, -2.0], 6, { animate: true });
        }
    }
};

// Export for use in other modules
window.MapHandler = MapHandler;
