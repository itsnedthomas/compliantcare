/**
 * Pipeline View Module
 * Handles GoHighLevel pipeline visualization and opportunity management.
 * Communicates with ghl_pipeline_sync.py via Python API endpoint.
 */

const PipelineView = {
    pipelines: [],
    currentPipeline: null,
    opportunities: [],
    stages: [],
    isLoading: false,
    hasError: false,

    // API endpoint for the Python backend (placeholder - will be Edge Function)
    API_BASE: '/api/ghl',

    /**
     * Initialize the pipeline view
     */
    init() {
        console.log('[PipelineView] Initializing...');

        // Set up event listeners
        const pipelineSelector = document.getElementById('pipeline-selector');
        if (pipelineSelector) {
            pipelineSelector.addEventListener('change', (e) => {
                this.selectPipeline(e.target.value);
            });
        }

        // Enable drag and drop
        this.setupDragAndDrop();
    },

    /**
     * Load pipeline data when the view becomes active
     */
    async onViewActivate() {
        console.log('[PipelineView] View activated');

        // Show loading state
        this.showLoading(true);
        this.showError(false);

        try {
            // For now, show a message that API key is needed
            // Once the API key is configured, this will fetch real data
            const mockPipelines = await this.fetchPipelines();

            if (!mockPipelines || mockPipelines.length === 0) {
                this.showError(true, 'No pipelines found. Please check your GoHighLevel API key configuration.');
                return;
            }

            this.pipelines = mockPipelines;
            this.populatePipelineSelector();

            // Select first pipeline by default
            if (this.pipelines.length > 0) {
                await this.selectPipeline(this.pipelines[0].id);
            }
        } catch (error) {
            console.error('[PipelineView] Error loading pipelines:', error);
            this.showError(true, error.message);
        } finally {
            this.showLoading(false);
        }
    },

    /**
     * Fetch pipelines from the backend
     */
    async fetchPipelines() {
        // TODO: Replace with actual API call to Python backend
        // For now, return demo data to show the UI
        console.log('[PipelineView] Fetching pipelines (demo mode)...');

        // Demo data - will be replaced with actual API call
        return [
            {
                id: 'demo-pipeline-1',
                name: 'Sales Pipeline',
                stages: [
                    { id: 'stage-1', name: 'New Lead', position: 0 },
                    { id: 'stage-2', name: 'Contacted', position: 1 },
                    { id: 'stage-3', name: 'Qualified', position: 2 },
                    { id: 'stage-4', name: 'Proposal Sent', position: 3 },
                    { id: 'stage-5', name: 'Won', position: 4 }
                ]
            }
        ];
    },

    /**
     * Fetch opportunities for a pipeline
     */
    async fetchOpportunities(pipelineId) {
        console.log(`[PipelineView] Fetching opportunities for pipeline: ${pipelineId}`);

        // Demo data - will be replaced with actual API call
        return [
            { id: 'opp-1', name: 'Sunrise Care Home', stageId: 'stage-1', value: 50000, status: 'open' },
            { id: 'opp-2', name: 'Meadowview Residence', stageId: 'stage-2', value: 75000, status: 'open' },
            { id: 'opp-3', name: 'Oak Lodge Care', stageId: 'stage-3', value: 120000, status: 'open' },
            { id: 'opp-4', name: 'Harmony House', stageId: 'stage-1', value: 45000, status: 'open' }
        ];
    },

    /**
     * Populate the pipeline selector dropdown
     */
    populatePipelineSelector() {
        const selector = document.getElementById('pipeline-selector');
        if (!selector) return;

        selector.innerHTML = this.pipelines.map(p =>
            `<option value="${p.id}">${p.name}</option>`
        ).join('');
    },

    /**
     * Select a pipeline and load its opportunities
     */
    async selectPipeline(pipelineId) {
        console.log(`[PipelineView] Selecting pipeline: ${pipelineId}`);

        this.currentPipeline = this.pipelines.find(p => p.id === pipelineId);
        if (!this.currentPipeline) return;

        this.stages = this.currentPipeline.stages || [];
        this.showLoading(true);

        try {
            this.opportunities = await this.fetchOpportunities(pipelineId);
            this.renderBoard();
        } catch (error) {
            console.error('[PipelineView] Error loading opportunities:', error);
            this.showError(true, error.message);
        } finally {
            this.showLoading(false);
        }
    },

    /**
     * Render the Kanban board
     */
    renderBoard() {
        const container = document.getElementById('pipeline-columns');
        if (!container) return;

        // Clear existing columns
        container.innerHTML = '';

        // Create columns for each stage
        this.stages.forEach((stage, index) => {
            const stageOpportunities = this.opportunities.filter(o => o.stageId === stage.id);

            const column = document.createElement('div');
            column.className = 'pipeline-column';
            column.dataset.stageId = stage.id;

            column.innerHTML = `
                <div class="column-header">
                    <h4>${stage.name}</h4>
                    <span class="column-count">${stageOpportunities.length}</span>
                </div>
                <div class="column-body" data-stage-id="${stage.id}">
                    ${stageOpportunities.map(opp => this.renderOpportunityCard(opp)).join('')}
                </div>
            `;

            container.appendChild(column);
        });

        // Update subtitle
        const subtitle = document.getElementById('pipeline-subtitle');
        if (subtitle && this.currentPipeline) {
            subtitle.textContent = `${this.currentPipeline.name} • ${this.opportunities.length} opportunities`;
        }

        // Re-attach drag and drop listeners
        this.setupDragAndDrop();
    },

    /**
     * Render a single opportunity card
     */
    renderOpportunityCard(opportunity) {
        const valueFormatted = opportunity.value
            ? `£${(opportunity.value / 1000).toFixed(0)}k`
            : '';

        const statusClass = opportunity.status === 'won' ? 'status-won' :
            opportunity.status === 'lost' ? 'status-lost' :
                'status-open';

        return `
            <div class="opportunity-card ${statusClass}" 
                 draggable="true" 
                 data-opportunity-id="${opportunity.id}"
                 data-stage-id="${opportunity.stageId}">
                <div class="opp-header">
                    <span class="opp-name">${opportunity.name}</span>
                    <span class="opp-value">${valueFormatted}</span>
                </div>
                <div class="opp-meta">
                    <span class="opp-status">${opportunity.status}</span>
                </div>
            </div>
        `;
    },

    /**
     * Set up drag and drop for opportunity cards
     */
    setupDragAndDrop() {
        const cards = document.querySelectorAll('.opportunity-card');
        const columnBodies = document.querySelectorAll('.column-body');

        cards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', card.dataset.opportunityId);
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });
        });

        columnBodies.forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.classList.add('drag-over');
            });

            column.addEventListener('dragleave', () => {
                column.classList.remove('drag-over');
            });

            column.addEventListener('drop', async (e) => {
                e.preventDefault();
                column.classList.remove('drag-over');

                const opportunityId = e.dataTransfer.getData('text/plain');
                const newStageId = column.dataset.stageId;

                await this.moveOpportunity(opportunityId, newStageId);
            });
        });
    },

    /**
     * Move an opportunity to a new stage
     */
    async moveOpportunity(opportunityId, newStageId) {
        console.log(`[PipelineView] Moving opportunity ${opportunityId} to stage ${newStageId}`);

        // Update local state
        const opportunity = this.opportunities.find(o => o.id === opportunityId);
        if (opportunity) {
            opportunity.stageId = newStageId;
        }

        // Re-render the board
        this.renderBoard();

        // TODO: Call API to persist the change
        // await this.updateOpportunityStage(opportunityId, newStageId);

        // Show success feedback
        console.log(`[PipelineView] Opportunity moved successfully (local update)`);
    },

    /**
     * Sync pipeline data from GHL
     */
    async syncPipeline() {
        console.log('[PipelineView] Syncing pipeline...');

        const syncBtn = document.getElementById('sync-pipeline-btn');
        if (syncBtn) {
            syncBtn.disabled = true;
            syncBtn.innerHTML = `
                <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
                </svg>
                Syncing...
            `;
        }

        try {
            // Re-fetch data
            if (this.currentPipeline) {
                this.opportunities = await this.fetchOpportunities(this.currentPipeline.id);
                this.renderBoard();
            }
        } catch (error) {
            console.error('[PipelineView] Sync error:', error);
        } finally {
            if (syncBtn) {
                syncBtn.disabled = false;
                syncBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                    </svg>
                    Sync
                `;
            }
        }
    },

    /**
     * Show/hide loading state
     */
    showLoading(show) {
        this.isLoading = show;
        const loading = document.getElementById('pipeline-loading');
        const columns = document.getElementById('pipeline-columns');

        if (loading) loading.style.display = show ? 'flex' : 'none';
        if (columns) columns.style.display = show ? 'none' : 'flex';
    },

    /**
     * Show/hide error state
     */
    showError(show, message = '') {
        this.hasError = show;
        const error = document.getElementById('pipeline-error');
        const loading = document.getElementById('pipeline-loading');
        const columns = document.getElementById('pipeline-columns');
        const errorMsg = document.getElementById('pipeline-error-message');

        if (loading) loading.style.display = 'none';
        if (error) error.style.display = show ? 'flex' : 'none';
        if (columns) columns.style.display = show ? 'none' : 'flex';
        if (errorMsg && message) errorMsg.textContent = message;
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    PipelineView.init();
});

// Export for use in app.js
if (typeof window !== 'undefined') {
    window.PipelineView = PipelineView;
}
