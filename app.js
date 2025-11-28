// ==========================================
// DARK CHANNEL MANAGER v3.0 - SaaS Pro
// Professional Dashboard Application
// ==========================================

/* ==========================================
   DATA MANAGER - LocalStorage Management
   ========================================== */
class DataManager {
    constructor() {
        this.videos = this.loadData('videos', []);
        this.prompts = this.loadData('prompts', []);
        this.settings = this.loadData('settings', {
            youtubeApiKey: ''
        });
    }

    loadData(key, defaultValue) {
        try {
            const data = localStorage.getItem(`dcm_${key}`);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`Error loading ${key}:`, error);
            return defaultValue;
        }
    }

    saveVideos() {
        localStorage.setItem('dcm_videos', JSON.stringify(this.videos));
    }

    savePrompts() {
        localStorage.setItem('dcm_prompts', JSON.stringify(this.prompts));
    }

    saveSettings() {
        localStorage.setItem('dcm_settings', JSON.stringify(this.settings));
    }

    // Video CRUD
    addVideo(video) {
        video.id = Date.now().toString();
        video.createdAt = new Date().toISOString();
        video.stage = this.calculateStage(video);
        this.videos.push(video);
        this.saveVideos();
        return video;
    }

    updateVideo(id, updates) {
        const index = this.videos.findIndex(v => v.id === id);
        if (index !== -1) {
            this.videos[index] = { ...this.videos[index], ...updates };
            this.videos[index].stage = this.calculateStage(this.videos[index]);
            this.saveVideos();
            return this.videos[index];
        }
        return null;
    }

    deleteVideo(id) {
        this.videos = this.videos.filter(v => v.id !== id);
        this.saveVideos();
    }

    getVideo(id) {
        return this.videos.find(v => v.id === id);
    }

    // Calculate video stage based on checklist
    calculateStage(video) {
        const checklist = video.checklist || {};
        const totalTasks = 5; // script, audio, thumb, edit, upload
        const completed = [
            checklist.script,
            checklist.audio,
            checklist.thumb,
            checklist.edit,
            checklist.upload
        ].filter(Boolean).length;

        if (checklist.upload) return 'postado';
        if (completed >= 3) return 'finalizado';
        if (completed >= 1) return 'producao';
        return 'planejamento';
    }

    getProgress(video) {
        const checklist = video.checklist || {};
        const total = 5;
        const completed = [
            checklist.script,
            checklist.audio,
            checklist.thumb,
            checklist.edit,
            checklist.upload
        ].filter(Boolean).length;
        return Math.round((completed / total) * 100);
    }

    getUniqueChannels() {
        const channels = [...new Set(this.videos.map(v => v.channel))];
        return channels.filter(c => c && c.trim() !== '').sort();
    }

    // Get inactive channels (no ready or posted videos)
    getInactiveChannels() {
        const channels = this.getUniqueChannels();
        return channels.filter(channel => {
            const channelVideos = this.videos.filter(v => v.channel === channel);
            return !channelVideos.some(v => v.stage === 'finalizado' || v.stage === 'postado');
        });
    }

    // Metrics
    getMetrics() {
        const metrics = {
            planejamento: 0,
            producao: 0,
            finalizado: 0,
            postado: 0
        };

        this.videos.forEach(video => {
            if (metrics.hasOwnProperty(video.stage)) {
                metrics[video.stage]++;
            }
        });

        return metrics;
    }

    // Prompts CRUD
    addPrompt(prompt) {
        prompt.id = Date.now().toString();
        prompt.createdAt = new Date().toISOString();
        this.prompts.push(prompt);
        this.savePrompts();
        return prompt;
    }

    deletePrompt(id) {
        this.prompts = this.prompts.filter(p => p.id !== id);
        this.savePrompts();
    }
}

/* ==========================================
   UI MANAGER - Interface Management
   ========================================== */
class UIManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.currentPage = 'dashboard';
        this.currentVideoId = null;
        this.thumbImageData = null;
        this.currentSearchTerm = '';
        this.currentFilters = {
            channel: '',
            status: ''
        };

        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupModalHandlers();
        this.setupVideoHandlers();
        this.setupEditorHandlers();
        this.setupRadarHandlers();
        this.setupPromptsHandlers();
        this.setupSettingsHandlers();
        this.renderCurrentPage();
    }

    /* ==========================================
       NAVIGATION
       ========================================== */
    setupNavigation() {
        document.querySelectorAll('[data-page]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(item.dataset.page);
            });
        });
    }

    navigateTo(page) {
        this.currentPage = page;

        // Update sidebar active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Update page visibility
        document.querySelectorAll('.page').forEach(p => {
            p.classList.toggle('active', p.id === `${page}-page`);
        });

        this.renderCurrentPage();
    }

    renderCurrentPage() {
        switch (this.currentPage) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'canais':
                this.renderChannels();
                break;
            case 'prompts':
                this.renderPrompts();
                break;
            case 'radar':
                // Radar page is static, no rendering needed
                break;
            case 'configuracoes':
                this.renderSettings();
                break;
        }
    }

    /* ==========================================
       DASHBOARD
       ========================================== */
    renderDashboard() {
        // Update metrics
        const metrics = this.dataManager.getMetrics();
        document.getElementById('metricPlanning').textContent = metrics.planejamento;
        document.getElementById('metricProduction').textContent = metrics.producao;
        document.getElementById('metricReady').textContent = metrics.finalizado;
        document.getElementById('metricPosted').textContent = metrics.postado;

        // Check inactive channels
        const inactiveChannels = this.dataManager.getInactiveChannels();
        const alertSection = document.getElementById('inactiveAlert');

        if (inactiveChannels.length > 0) {
            document.getElementById('inactiveChannelsList').textContent =
                `Os seguintes canais não têm vídeos prontos: ${inactiveChannels.join(', ')}`;
            alertSection.style.display = 'block';
        } else {
            alertSection.style.display = 'none';
        }

        // Update channel filter
        this.updateChannelFilter();

        // Render videos
        this.renderVideos();
    }

    updateChannelFilter() {
        const filter = document.getElementById('filterChannel');
        const channels = this.dataManager.getUniqueChannels();

        filter.innerHTML = '<option value="">Todos os Canais</option>' +
            channels.map(c => `<option value="${this.escapeHtml(c)}">${this.escapeHtml(c)}</option>`).join('');
    }

    renderVideos() {
        let videos = [...this.dataManager.videos];

        // Apply filters
        if (this.currentFilters.channel) {
            videos = videos.filter(v => v.channel === this.currentFilters.channel);
        }

        if (this.currentFilters.status) {
            videos = videos.filter(v => v.stage === this.currentFilters.status);
        }

        // Apply search
        if (this.currentSearchTerm) {
            const search = this.currentSearchTerm.toLowerCase();
            videos = videos.filter(v =>
                v.title.toLowerCase().includes(search) ||
                v.channel.toLowerCase().includes(search)
            );
        }

        // Sort by creation date (newest first)
        videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const container = document.getElementById('videosList');
        const countBadge = document.getElementById('videosCount');

        countBadge.textContent = `${videos.length} ${videos.length === 1 ? 'vídeo' : 'vídeos'}`;

        if (videos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🎬</div>
                    <p>Nenhum vídeo encontrado</p>
                </div>
            `;
            return;
        }

        container.innerHTML = videos.map(video => this.renderVideoCard(video)).join('');

        // Add click listeners
        container.querySelectorAll('.video-card').forEach(card => {
            card.addEventListener('click', () => {
                this.openVideoModal(card.dataset.id);
            });
        });
    }

    renderVideoCard(video) {
        const progress = this.dataManager.getProgress(video);
        const checklist = video.checklist || {};
        const statusLabels = {
            planejamento: '📋 Planejamento',
            producao: '🎬 Em Produção',
            finalizado: '✅ Pronto',
            postado: '🚀 Postado'
        };

        return `
            <div class="video-card status-${video.stage}" data-id="${video.id}">
                <div class="video-card-header">
                    <div class="video-info">
                        <div class="video-title">${this.escapeHtml(video.title)}</div>
                        <div class="video-channel">📺 ${this.escapeHtml(video.channel)}</div>
                    </div>
                    <div class="video-status status-${video.stage}">
                        ${statusLabels[video.stage] || statusLabels.planejamento}
                    </div>
                </div>
                <div class="video-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
                <div class="video-checklist">
                    <span class="check-badge ${checklist.script ? 'completed' : ''}">
                        ${checklist.script ? '✅' : '☐'} Roteiro
                    </span>
                    <span class="check-badge ${checklist.audio ? 'completed' : ''}">
                        ${checklist.audio ? '✅' : '☐'} Áudio
                    </span>
                    <span class="check-badge ${checklist.thumb ? 'completed' : ''}">
                        ${checklist.thumb ? '✅' : '☐'} Thumb
                    </span>
                    <span class="check-badge ${checklist.edit ? 'completed' : ''}">
                        ${checklist.edit ? '✅' : '☐'} Edição
                    </span>
                    <span class="check-badge ${checklist.upload ? 'completed' : ''}">
                        ${checklist.upload ? '✅' : '☐'} Upload
                    </span>
                </div>
            </div>
        `;
    }

    /* ==========================================
       SUPER MODAL
       ========================================== */
    setupModalHandlers() {
        // Open modal button
        document.getElementById('btnNovoVideo').addEventListener('click', () => {
            this.openVideoModal();
        });

        // Close modal
        document.getElementById('btnCloseModal').addEventListener('click', () => {
            this.closeVideoModal();
        });

        document.getElementById('btnCancelModal').addEventListener('click', () => {
            this.closeVideoModal();
        });

        // Modal tabs
        document.querySelectorAll('.modal-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchModalTab(tab.dataset.tab);
            });
        });

        // Save video
        document.getElementById('btnSaveVideo').addEventListener('click', () => {
            this.saveVideo();
        });

        // Delete video
        document.getElementById('btnDeleteVideo').addEventListener('click', () => {
            this.deleteVideo();
        });

        // Close on backdrop click
        document.querySelector('.modal-backdrop').addEventListener('click', () => {
            this.closeVideoModal();
        });
    }

    openVideoModal(videoId = null) {
        const modal = document.getElementById('superModal');
        const modalTitle = document.getElementById('modalTitle');
        const deleteBtn = document.getElementById('btnDeleteVideo');

        if (videoId) {
            // Edit mode
            const video = this.dataManager.getVideo(videoId);
            this.currentVideoId = videoId;
            modalTitle.textContent = 'Editar Vídeo';
            deleteBtn.style.display = 'inline-flex';

            // Populate form
            document.getElementById('videoChannel').value = video.channel || '';
            document.getElementById('videoTitle').value = video.title || '';
            document.getElementById('videoDescription').value = video.description || '';
            document.getElementById('videoThumbText').value = video.thumbText || '';
            document.getElementById('videoScript').value = video.script || '';

            // Checklist
            const checklist = video.checklist || {};
            document.getElementById('checkScript').checked = checklist.script || false;
            document.getElementById('checkAudio').checked = checklist.audio || false;
            document.getElementById('checkThumb').checked = checklist.thumb || false;
            document.getElementById('checkEdit').checked = checklist.edit || false;
            document.getElementById('checkUpload').checked = checklist.upload || false;

            // Thumbnail
            this.thumbImageData = video.thumbImage || null;
            if (this.thumbImageData) {
                this.showThumbPreview(this.thumbImageData);
            }

            this.updateScriptStats();
        } else {
            // Create mode
            this.currentVideoId = null;
            modalTitle.textContent = 'Novo Vídeo';
            deleteBtn.style.display = 'none';

            // Clear form
            document.getElementById('videoChannel').value = '';
            document.getElementById('videoTitle').value = '';
            document.getElementById('videoDescription').value = '';
            document.getElementById('videoThumbText').value = '';
            document.getElementById('videoScript').value = '';

            document.getElementById('checkScript').checked = false;
            document.getElementById('checkAudio').checked = false;
            document.getElementById('checkThumb').checked = false;
            document.getElementById('checkEdit').checked = false;
            document.getElementById('checkUpload').checked = false;

            this.thumbImageData = null;
            this.hideThumbPreview();
            this.updateScriptStats();
        }

        this.updateStatusPreview();
        modal.classList.add('active');
    }

    closeVideoModal() {
        document.getElementById('superModal').classList.remove('active');
        this.currentVideoId = null;
        this.thumbImageData = null;
    }

    switchModalTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.modal-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `tab-${tabName}`);
        });
    }

    saveVideo() {
        const channel = document.getElementById('videoChannel').value.trim();
        const title = document.getElementById('videoTitle').value.trim();

        if (!channel || !title) {
            this.showToast('Por favor, preencha canal e título', 'error');
            return;
        }

        const videoData = {
            channel,
            title,
            description: document.getElementById('videoDescription').value.trim(),
            thumbText: document.getElementById('videoThumbText').value.trim(),
            thumbImage: this.thumbImageData,
            script: document.getElementById('videoScript').value.trim(),
            checklist: {
                script: document.getElementById('checkScript').checked,
                audio: document.getElementById('checkAudio').checked,
                thumb: document.getElementById('checkThumb').checked,
                edit: document.getElementById('checkEdit').checked,
                upload: document.getElementById('checkUpload').checked
            }
        };

        if (this.currentVideoId) {
            this.dataManager.updateVideo(this.currentVideoId, videoData);
            this.showToast('Vídeo atualizado com sucesso!', 'success');
        } else {
            this.dataManager.addVideo(videoData);
            this.showToast('Vídeo criado com sucesso!', 'success');
        }

        this.closeVideoModal();
        this.renderDashboard();
    }

    deleteVideo() {
        if (!confirm('Tem certeza que deseja excluir este vídeo?')) {
            return;
        }

        this.dataManager.deleteVideo(this.currentVideoId);
        this.showToast('Vídeo excluído', 'success');
        this.closeVideoModal();
        this.renderDashboard();
    }

    /* ==========================================
       VIDEO HANDLERS
       ========================================== */
    setupVideoHandlers() {
        // Filters
        document.getElementById('filterChannel').addEventListener('change', (e) => {
            this.currentFilters.channel = e.target.value;
            this.renderVideos();
        });

        document.getElementById('filterStatus').addEventListener('change', (e) => {
            this.currentFilters.status = e.target.value;
            this.renderVideos();
        });

        // Search
        document.getElementById('searchVideos').addEventListener('input', (e) => {
            this.currentSearchTerm = e.target.value;
            this.renderVideos();
        });

        // Thumbnail upload
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('videoThumbFile');

        uploadArea.addEventListener('click', () => fileInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleThumbUpload(file);
            }
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleThumbUpload(file);
            }
        });

        document.getElementById('btnRemoveThumb').addEventListener('click', (e) => {
            e.stopPropagation();
            this.thumbImageData = null;
            this.hideThumbPreview();
        });

        // Checklist change - update status preview
        ['checkScript', 'checkAudio', 'checkThumb', 'checkEdit', 'checkUpload'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                this.updateStatusPreview();
            });
        });
    }

    handleThumbUpload(file) {
        if (file.size > 5 * 1024 * 1024) {
            this.showToast('Imagem muito grande! Máximo 5MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.thumbImageData = e.target.result;
            this.showThumbPreview(this.thumbImageData);
        };
        reader.readAsDataURL(file);
    }

    showThumbPreview(imageData) {
        document.querySelector('.upload-placeholder').style.display = 'none';
        const preview = document.getElementById('uploadPreview');
        preview.style.display = 'block';
        document.getElementById('previewImage').src = imageData;
    }

    hideThumbPreview() {
        document.querySelector('.upload-placeholder').style.display = 'block';
        document.getElementById('uploadPreview').style.display = 'none';
    }

    updateStatusPreview() {
        const checklist = {
            script: document.getElementById('checkScript').checked,
            audio: document.getElementById('checkAudio').checked,
            thumb: document.getElementById('checkThumb').checked,
            edit: document.getElementById('checkEdit').checked,
            upload: document.getElementById('checkUpload').checked
        };

        const stage = this.dataManager.calculateStage({ checklist });
        const statusBadge = document.getElementById('currentStatusBadge');

        const statusMap = {
            planejamento: { text: '📋 PLANEJAMENTO', class: 'status-planejamento' },
            producao: { text: '🎬 EM PRODUÇÃO', class: 'status-producao' },
            finalizado: { text: '✅ PRONTO', class: 'status-finalizado' },
            postado: { text: '🚀 POSTADO', class: 'status-postado' }
        };

        const status = statusMap[stage] || statusMap.planejamento;
        statusBadge.textContent = status.text;
        statusBadge.className = `status-badge ${status.class}`;
    }

    /* ==========================================
       EDITOR HANDLERS
       ========================================== */
    setupEditorHandlers() {
        const scriptEditor = document.getElementById('videoScript');

        scriptEditor.addEventListener('input', () => {
            this.updateScriptStats();
        });

        // Generate SRT
        document.getElementById('btnGenerateSRT').addEventListener('click', () => {
            this.generateSRT();
        });

        // Copy to CapCut
        document.getElementById('btnCopyCapcut').addEventListener('click', () => {
            this.copyToCapcut();
        });
    }

    updateScriptStats() {
        const text = document.getElementById('videoScript').value;
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        const chars = text.length;

        // Estimate narration time (150 words per minute average)
        const minutes = Math.floor(words.length / 150);
        const seconds = Math.round(((words.length % 150) / 150) * 60);

        document.getElementById('wordCount').textContent = words.length;
        document.getElementById('charCount').textContent = chars;
        document.getElementById('estimatedTime').textContent =
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    generateSRT() {
        const text = document.getElementById('videoScript').value.trim();

        if (!text) {
            this.showToast('Escreva um roteiro primeiro', 'error');
            return;
        }

        const wordsPerSubtitle = 10;
        const durationPerSubtitle = 3;
        const words = text.split(/\s+/).filter(w => w.length > 0);

        let srtContent = '';
        let currentTime = 0;

        for (let i = 0; i < words.length; i += wordsPerSubtitle) {
            const subtitleNumber = Math.floor(i / wordsPerSubtitle) + 1;
            const subtitleWords = words.slice(i, i + wordsPerSubtitle);
            const subtitleText = subtitleWords.join(' ');

            const startTime = this.formatSRTTime(currentTime);
            const endTime = this.formatSRTTime(currentTime + durationPerSubtitle);

            srtContent += `${subtitleNumber}\n${startTime} --> ${endTime}\n${subtitleText}\n\n`;
            currentTime += durationPerSubtitle;
        }

        // Download SRT file
        const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `legendas-${Date.now()}.srt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Arquivo SRT gerado!', 'success');
    }

    formatSRTTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const millis = Math.floor((seconds % 1) * 1000);

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
    }

    copyToCapcut() {
        const text = document.getElementById('videoScript').value.trim();

        if (!text) {
            this.showToast('Escreva um roteiro primeiro', 'error');
            return;
        }

        // Split text into ~500 character chunks
        const chunks = [];
        const maxChunkSize = 500;
        const words = text.split(' ');
        let currentChunk = '';

        words.forEach(word => {
            if ((currentChunk + word).length > maxChunkSize) {
                chunks.push(currentChunk.trim());
                currentChunk = word + ' ';
            } else {
                currentChunk += word + ' ';
            }
        });

        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }

        // Copy to clipboard
        const formatted = chunks.map((chunk, i) => `[${i + 1}/${chunks.length}]\n${chunk}`).join('\n\n---\n\n');

        navigator.clipboard.writeText(formatted).then(() => {
            this.showToast(`Copiado! ${chunks.length} blocos prontos para o CapCut`, 'success');
        }).catch(() => {
            this.showToast('Erro ao copiar', 'error');
        });
    }

    /* ==========================================
       RADAR DE TÍTULOS
       ========================================== */
    setupRadarHandlers() {
        const inputPT = document.getElementById('radarTitlePT');
        const inputEN = document.getElementById('radarTitleEN');
        const btnSearch = document.getElementById('btnBuscarRadar');

        // Auto-translate (simple simulation)
        inputPT.addEventListener('input', () => {
            // This would use a real translation API in production
            inputEN.value = this.simpleTranslate(inputPT.value);
        });

        btnSearch.addEventListener('click', () => {
            this.searchYouTube();
        });
    }

    simpleTranslate(text) {
        // Simple PT-BR to EN translation (for demo)
        // In production, use Google Translate API or similar
        const dictionary = {
            'como': 'how to',
            'ganhar': 'make',
            'dinheiro': 'money',
            'online': 'online',
            'fazer': 'make',
            'aprender': 'learn',
            'melhor': 'best',
            'grátis': 'free',
            'rápido': 'fast',
            'fácil': 'easy'
        };

        return text.toLowerCase().split(' ').map(word =>
            dictionary[word] || word
        ).join(' ');
    }

    async searchYouTube() {
        const apiKey = this.dataManager.settings.youtubeApiKey;
        const query = document.getElementById('radarTitleEN').value.trim();

        if (!query) {
            this.showToast('Digite um título primeiro', 'error');
            return;
        }

        if (!apiKey) {
            this.showToast('Configure sua YouTube API Key nas configurações', 'error');
            return;
        }

        const resultsContainer = document.getElementById('radarResults');
        resultsContainer.innerHTML = '<p style="text-align:center;padding:2rem;">Buscando...</p>';

        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${apiKey}`
            );

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();

            if (data.items && data.items.length > 0) {
                resultsContainer.innerHTML = data.items.map(item => `
                    <div class="radar-result-item">
                        <h4 style="margin-bottom:0.5rem;">${this.escapeHtml(item.snippet.title)}</h4>
                        <p style="color:var(--slate-400);font-size:0.875rem;margin-bottom:0.5rem;">
                            Canal: ${this.escapeHtml(item.snippet.channelTitle)}
                        </p>
                        <p style="color:var(--slate-500);font-size:0.8125rem;">
                            ${this.escapeHtml(item.snippet.description.substring(0, 150))}...
                        </p>
                        <a href="https://youtube.com/watch?v=${item.id.videoId}" target="_blank"
                           style="color:var(--primary-400);font-size:0.875rem;text-decoration:none;">
                            Ver no YouTube →
                        </a>
                    </div>
                `).join('');

                this.showToast(`${data.items.length} resultados encontrados`, 'success');
            } else {
                resultsContainer.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--slate-500);">Nenhum resultado encontrado</p>';
            }
        } catch (error) {
            console.error('YouTube search error:', error);
            resultsContainer.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--danger-400);">Erro ao buscar. Verifique sua API Key.</p>';
            this.showToast('Erro ao buscar no YouTube', 'error');
        }
    }

    /* ==========================================
       PROMPTS
       ========================================== */
    setupPromptsHandlers() {
        document.getElementById('btnNovoPrompt').addEventListener('click', () => {
            const title = prompt('Título do Prompt:');
            if (!title) return;

            const content = prompt('Conteúdo do Prompt:');
            if (!content) return;

            this.dataManager.addPrompt({ title, content });
            this.renderPrompts();
            this.showToast('Prompt salvo!', 'success');
        });
    }

    renderPrompts() {
        const container = document.getElementById('promptsGrid');

        if (this.dataManager.prompts.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <div class="empty-state-icon">📝</div>
                    <p>Nenhum prompt salvo ainda</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.dataManager.prompts.map(prompt => `
            <div class="prompt-card">
                <h3 style="margin-bottom:0.5rem;">${this.escapeHtml(prompt.title)}</h3>
                <p style="color:var(--slate-400);font-size:0.875rem;margin-bottom:1rem;">${this.escapeHtml(prompt.content)}</p>
                <div style="display:flex;gap:0.5rem;">
                    <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('${this.escapeHtml(prompt.content)}').then(() => app.showToast('Copiado!', 'success'))">
                        Copiar
                    </button>
                    <button class="btn btn-danger" onclick="app.dataManager.deletePrompt('${prompt.id}'); app.renderPrompts(); app.showToast('Prompt excluído', 'success')">
                        Excluir
                    </button>
                </div>
            </div>
        `).join('');
    }

    /* ==========================================
       CHANNELS
       ========================================== */
    renderChannels() {
        const channels = this.dataManager.getUniqueChannels();
        const container = document.getElementById('channelsGrid');

        if (channels.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <div class="empty-state-icon">📺</div>
                    <p>Nenhum canal encontrado. Crie um vídeo primeiro!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = channels.map(channel => {
            const channelVideos = this.dataManager.videos.filter(v => v.channel === channel);
            const metrics = {
                total: channelVideos.length,
                ready: channelVideos.filter(v => v.stage === 'finalizado').length,
                posted: channelVideos.filter(v => v.stage === 'postado').length
            };

            return `
                <div class="channel-card">
                    <h3 style="margin-bottom:1rem;">📺 ${this.escapeHtml(channel)}</h3>
                    <div style="display:grid;gap:0.5rem;color:var(--slate-400);font-size:0.875rem;">
                        <div>Total: <strong>${metrics.total}</strong> vídeos</div>
                        <div>Prontos: <strong>${metrics.ready}</strong></div>
                        <div>Postados: <strong>${metrics.posted}</strong></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /* ==========================================
       SETTINGS
       ========================================== */
    setupSettingsHandlers() {
        document.getElementById('btnSaveApiKey').addEventListener('click', () => {
            const apiKey = document.getElementById('youtubeApiKey').value.trim();
            this.dataManager.settings.youtubeApiKey = apiKey;
            this.dataManager.saveSettings();
            this.showToast('API Key salva!', 'success');
        });

        document.getElementById('btnLimparDados').addEventListener('click', () => {
            if (confirm('ATENÇÃO! Isso irá apagar TODOS os dados. Tem certeza?')) {
                localStorage.clear();
                location.reload();
            }
        });
    }

    renderSettings() {
        document.getElementById('youtubeApiKey').value = this.dataManager.settings.youtubeApiKey || '';
    }

    /* ==========================================
       UTILITIES
       ========================================== */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

/* ==========================================
   EXPORT FUNCTION
   ========================================== */
window.exportData = function() {
    const data = {
        videos: app.dataManager.videos,
        prompts: app.dataManager.prompts,
        settings: { ...app.dataManager.settings, youtubeApiKey: '' }, // Don't export API key
        exportDate: new Date().toISOString(),
        version: '3.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dark-channel-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    app.showToast('Backup exportado!', 'success');
};

/* ==========================================
   INITIALIZE APPLICATION
   ========================================== */
const dataManager = new DataManager();
const app = new UIManager(dataManager);

console.log('🚀 Dark Channel Manager v3.0 - SaaS Pro Edition');
console.log('📊 Dashboard carregado com sucesso!');
