// ==========================================
// DARK CHANNEL MANAGER v4.0 - UX Otimizada
// Checklist Inline + Modal Simples
// ==========================================

/* ==========================================
   DATA MANAGER - LocalStorage Management
   ========================================== */
class DataManager {
    constructor() {
        this.channels = this.loadData('channels', []);
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

    saveChannels() {
        localStorage.setItem('dcm_channels', JSON.stringify(this.channels));
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

    // Channel CRUD
    addChannel(name) {
        const channel = {
            id: Date.now().toString(),
            name: name.trim(),
            createdAt: new Date().toISOString()
        };
        this.channels.push(channel);
        this.saveChannels();
        return channel;
    }

    getChannel(id) {
        return this.channels.find(c => c.id === id);
    }

    deleteChannel(id) {
        // Delete all videos from this channel
        this.videos = this.videos.filter(v => v.channelId !== id);
        this.saveVideos();

        // Delete the channel
        this.channels = this.channels.filter(c => c.id !== id);
        this.saveChannels();
    }

    // Video CRUD
    addVideo(video) {
        video.id = Date.now().toString();
        video.createdAt = new Date().toISOString();
        video.checklist = {
            script: false,
            audio: false,
            thumb: false,
            edit: false,
            upload: false
        };
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

    updateChecklist(id, checklistKey, value) {
        const video = this.getVideo(id);
        if (video) {
            if (!video.checklist) {
                video.checklist = {
                    script: false,
                    audio: false,
                    thumb: false,
                    edit: false,
                    upload: false
                };
            }
            video.checklist[checklistKey] = value;
            return this.updateVideo(id, { checklist: video.checklist });
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

    getChannelVideos(channelId) {
        return this.videos.filter(v => v.channelId === channelId);
    }

    getChannelMetrics(channelId) {
        const videos = this.getChannelVideos(channelId);
        const metrics = {
            planejamento: 0,
            producao: 0,
            finalizado: 0,
            postado: 0
        };

        videos.forEach(video => {
            if (metrics.hasOwnProperty(video.stage)) {
                metrics[video.stage]++;
            }
        });

        return metrics;
    }

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
        this.selectedChannel = null; // ID do canal atualmente selecionado
        this.currentVideoId = null;
        this.currentSearchTerm = '';
        this.currentFilters = {
            status: ''
        };

        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupMobileMenu();
        this.setupChannelsHandlers();
        this.setupModalHandlers();
        this.setupThumbnailUpload();
        this.setupVideoHandlers();
        this.setupRadarHandlers();
        this.setupPromptsHandlers();
        this.setupSettingsHandlers();
        this.renderChannelsList();
        this.renderCurrentPage();
    }

    /* ==========================================
       CHANNELS MANAGEMENT
       ========================================== */
    setupChannelsHandlers() {
        // Open channel modal
        document.getElementById('btnAddChannel').addEventListener('click', () => {
            this.openChannelModal();
        });

        // Close channel modal
        document.getElementById('btnCloseChannelModal').addEventListener('click', () => {
            this.closeChannelModal();
        });

        document.getElementById('btnCancelChannelModal').addEventListener('click', () => {
            this.closeChannelModal();
        });

        // Save channel
        document.getElementById('btnSaveChannel').addEventListener('click', () => {
            this.saveChannel();
        });

        // Enter key on channel name
        document.getElementById('channelName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveChannel();
            }
        });

        // Backdrop click
        document.querySelector('#channelModal .modal-backdrop').addEventListener('click', () => {
            this.closeChannelModal();
        });
    }

    openChannelModal() {
        document.getElementById('channelName').value = '';
        document.getElementById('channelModal').classList.add('active');
        setTimeout(() => {
            document.getElementById('channelName').focus();
        }, 100);
    }

    closeChannelModal() {
        document.getElementById('channelModal').classList.remove('active');
    }

    saveChannel() {
        const name = document.getElementById('channelName').value.trim();

        if (!name) {
            this.showToast('Por favor, digite um nome para o canal', 'error');
            return;
        }

        const channel = this.dataManager.addChannel(name);
        this.showToast(`Canal "${name}" criado com sucesso!`, 'success');
        this.closeChannelModal();
        this.renderChannelsList();

        // Seleciona automaticamente o novo canal
        this.selectChannel(channel.id);
    }

    deleteChannel(channelId) {
        const channel = this.dataManager.getChannel(channelId);
        if (!channel) return;

        const videosCount = this.dataManager.getChannelVideos(channelId).length;
        const message = videosCount > 0
            ? `Tem certeza que deseja excluir o canal "${channel.name}" e todos os ${videosCount} vídeo(s) nele?`
            : `Tem certeza que deseja excluir o canal "${channel.name}"?`;

        if (!confirm(message)) return;

        this.dataManager.deleteChannel(channelId);
        this.showToast(`Canal "${channel.name}" excluído`, 'success');

        // Se o canal excluído era o selecionado, limpa a seleção
        if (this.selectedChannel === channelId) {
            this.selectedChannel = null;
        }

        this.renderChannelsList();
        this.renderDashboard();
    }

    selectChannel(channelId) {
        this.selectedChannel = channelId;
        this.currentPage = 'dashboard';
        this.renderChannelsList();
        this.renderDashboard();
    }

    renderChannelsList() {
        const container = document.getElementById('channelsList');
        const channels = this.dataManager.channels;

        if (channels.length === 0) {
            container.innerHTML = `
                <div style="padding: 1rem; text-align: center; color: var(--slate-500); font-size: 0.8125rem;">
                    Nenhum canal criado.<br>Clique no + acima.
                </div>
            `;
            return;
        }

        container.innerHTML = channels.map(channel => `
            <div class="channel-item ${this.selectedChannel === channel.id ? 'active' : ''}" data-channel-id="${channel.id}">
                <div class="channel-item-content">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
                    </svg>
                    <span class="channel-item-name">${this.escapeHtml(channel.name)}</span>
                </div>
                <button class="btn-delete-channel" data-channel-id="${channel.id}" title="Excluir canal">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"/>
                    </svg>
                </button>
            </div>
        `).join('');

        // Add click listeners
        container.querySelectorAll('.channel-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Não seleciona se clicou no botão de deletar
                if (e.target.closest('.btn-delete-channel')) return;

                const channelId = item.dataset.channelId;
                this.selectChannel(channelId);
            });
        });

        // Add delete listeners
        container.querySelectorAll('.btn-delete-channel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const channelId = btn.dataset.channelId;
                this.deleteChannel(channelId);
            });
        });
    }

    /* ==========================================
       MOBILE MENU
       ========================================== */
    setupMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const sidebar = document.getElementById('sidebar');

        if (!mobileMenuBtn || !sidebar) {
            console.error('Mobile menu elements not found');
            return;
        }

        const toggleSidebar = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            const isOpen = sidebar.classList.toggle('mobile-open');
            document.body.classList.toggle('sidebar-open', isOpen);
            console.log('Menu toggled, is open:', isOpen);
        };

        const closeSidebar = () => {
            sidebar.classList.remove('mobile-open');
            document.body.classList.remove('sidebar-open');
        };

        mobileMenuBtn.addEventListener('click', toggleSidebar);

        // Fechar sidebar ao clicar em um item de navegação (mobile)
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 1024) {
                    closeSidebar();
                }
            });
        });

        // Fechar sidebar ao clicar no overlay (backdrop)
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024 &&
                sidebar.classList.contains('mobile-open') &&
                !sidebar.contains(e.target) &&
                !mobileMenuBtn.contains(e.target)) {
                closeSidebar();
            }
        });

        // Fechar sidebar ao pressionar ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('mobile-open')) {
                closeSidebar();
            }
        });
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
                // Radar page is static
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
        const btnNovoVideo = document.getElementById('btnNovoVideo');
        const dashboardTitle = document.getElementById('dashboardTitle');
        const dashboardSubtitle = document.getElementById('dashboardSubtitle');
        const alertSection = document.getElementById('inactiveAlert');

        // Se nenhum canal selecionado
        if (!this.selectedChannel) {
            dashboardTitle.textContent = 'Dashboard';
            dashboardSubtitle.textContent = 'Selecione um canal na sidebar para começar';
            btnNovoVideo.style.display = 'none';
            alertSection.style.display = 'none';

            // Limpar métricas
            document.getElementById('metricPlanning').textContent = '0';
            document.getElementById('metricProduction').textContent = '0';
            document.getElementById('metricReady').textContent = '0';
            document.getElementById('metricPosted').textContent = '0';

            // Limpar lista de vídeos
            document.getElementById('videosList').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📺</div>
                    <p>Selecione um canal na sidebar para visualizar os vídeos</p>
                </div>
            `;
            document.getElementById('videosCount').textContent = '0 vídeos';

            return;
        }

        // Canal selecionado - atualizar título
        const channel = this.dataManager.getChannel(this.selectedChannel);
        if (!channel) {
            this.selectedChannel = null;
            this.renderDashboard();
            return;
        }

        dashboardTitle.textContent = `Dashboard: ${channel.name}`;
        dashboardSubtitle.textContent = 'Gerencie os vídeos deste canal';
        btnNovoVideo.style.display = 'inline-flex';

        // Update metrics for this channel
        const metrics = this.dataManager.getChannelMetrics(this.selectedChannel);
        document.getElementById('metricPlanning').textContent = metrics.planejamento;
        document.getElementById('metricProduction').textContent = metrics.producao;
        document.getElementById('metricReady').textContent = metrics.finalizado;
        document.getElementById('metricPosted').textContent = metrics.postado;

        // Hide inactive channels alert (não faz sentido no contexto de um canal)
        alertSection.style.display = 'none';

        // Render videos
        this.renderVideos();
    }

    renderVideos() {
        // Se não há canal selecionado, não renderiza vídeos
        if (!this.selectedChannel) {
            return;
        }

        // Pega apenas vídeos do canal selecionado
        let videos = this.dataManager.getChannelVideos(this.selectedChannel);

        // Apply status filter
        if (this.currentFilters.status) {
            videos = videos.filter(v => v.stage === this.currentFilters.status);
        }

        // Apply search
        if (this.currentSearchTerm) {
            const search = this.currentSearchTerm.toLowerCase();
            videos = videos.filter(v =>
                v.title.toLowerCase().includes(search)
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
                    <p>Nenhum vídeo encontrado. Clique em "Novo Vídeo" para começar!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = videos.map(video => this.renderVideoCard(video)).join('');

        // Add click listeners to headers (edit title/channel)
        container.querySelectorAll('.video-card-header').forEach(header => {
            header.addEventListener('click', () => {
                this.openVideoModal(header.closest('.video-card').dataset.id);
            });
        });

        // Add checkbox listeners (inline editing)
        container.querySelectorAll('.video-checklist input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                const videoId = checkbox.closest('.video-card').dataset.id;
                const checkKey = checkbox.dataset.check;
                this.updateCheckbox(videoId, checkKey, checkbox.checked);
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
                    <label class="${checklist.script ? 'completed' : ''}">
                        <input type="checkbox" data-check="script" ${checklist.script ? 'checked' : ''}>
                        <span>📝 Roteiro</span>
                    </label>
                    <label class="${checklist.audio ? 'completed' : ''}">
                        <input type="checkbox" data-check="audio" ${checklist.audio ? 'checked' : ''}>
                        <span>🎙️ Áudio</span>
                    </label>
                    <label class="${checklist.thumb ? 'completed' : ''}">
                        <input type="checkbox" data-check="thumb" ${checklist.thumb ? 'checked' : ''}>
                        <span>📷 Thumb</span>
                    </label>
                    <label class="${checklist.edit ? 'completed' : ''}">
                        <input type="checkbox" data-check="edit" ${checklist.edit ? 'checked' : ''}>
                        <span>✂️ Edição</span>
                    </label>
                    <label class="${checklist.upload ? 'completed' : ''}">
                        <input type="checkbox" data-check="upload" ${checklist.upload ? 'checked' : ''}>
                        <span>☁️ Upload</span>
                    </label>
                </div>
            </div>
        `;
    }

    updateCheckbox(videoId, checkKey, value) {
        this.dataManager.updateChecklist(videoId, checkKey, value);
        this.renderDashboard(); // Refresh to update metrics and borders
        this.showToast('Status atualizado!', 'success');
    }

    /* ==========================================
       MODAL SIMPLES
       ========================================== */
    setupModalHandlers() {
        document.getElementById('btnNovoVideo').addEventListener('click', () => {
            this.openVideoModal();
        });

        document.getElementById('btnCloseModal').addEventListener('click', () => {
            this.closeVideoModal();
        });

        document.getElementById('btnCancelModal').addEventListener('click', () => {
            this.closeVideoModal();
        });

        document.getElementById('btnSaveVideo').addEventListener('click', () => {
            this.saveVideo();
        });

        document.getElementById('btnDeleteVideo').addEventListener('click', () => {
            this.deleteVideo();
        });

        document.getElementById('btnCopyScript').addEventListener('click', () => {
            this.copyScript();
        });

        document.querySelector('.modal-backdrop').addEventListener('click', () => {
            this.closeVideoModal();
        });
    }

    copyScript() {
        const script = document.getElementById('videoScript').value.trim();
        if (!script) {
            this.showToast('Roteiro vazio', 'error');
            return;
        }

        navigator.clipboard.writeText(script).then(() => {
            this.showToast('Roteiro copiado para a área de transferência!', 'success');
        }).catch(() => {
            this.showToast('Erro ao copiar', 'error');
        });
    }

    /* ==========================================
       THUMBNAIL UPLOAD
       ========================================== */
    setupThumbnailUpload() {
        const dropzone = document.getElementById('thumbnailDropzone');
        const input = document.getElementById('thumbnailInput');
        const preview = document.getElementById('thumbnailPreview');
        const previewImage = document.getElementById('thumbnailImage');
        const btnRemove = document.getElementById('btnRemoveThumbnail');

        // Click to select file
        dropzone.addEventListener('click', () => {
            input.click();
        });

        // File input change
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleThumbnailFile(file);
            }
        });

        // Drag and drop events
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('drag-over');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('drag-over');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('drag-over');

            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleThumbnailFile(file);
            } else {
                this.showToast('Por favor, selecione uma imagem válida', 'error');
            }
        });

        // Remove thumbnail
        btnRemove.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearThumbnail();
        });
    }

    handleThumbnailFile(file) {
        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            this.showToast('Imagem muito grande! Tamanho máximo: 5MB', 'error');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showToast('Por favor, selecione uma imagem válida', 'error');
            return;
        }

        // Convert to Base64
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result;
            this.displayThumbnailPreview(base64);
            this.showToast('Thumbnail carregada!', 'success');
        };
        reader.onerror = () => {
            this.showToast('Erro ao carregar imagem', 'error');
        };
        reader.readAsDataURL(file);
    }

    displayThumbnailPreview(base64) {
        const dropzone = document.getElementById('thumbnailDropzone');
        const preview = document.getElementById('thumbnailPreview');
        const previewImage = document.getElementById('thumbnailImage');

        previewImage.src = base64;
        dropzone.style.display = 'none';
        preview.style.display = 'block';
    }

    clearThumbnail() {
        const dropzone = document.getElementById('thumbnailDropzone');
        const preview = document.getElementById('thumbnailPreview');
        const previewImage = document.getElementById('thumbnailImage');
        const input = document.getElementById('thumbnailInput');

        previewImage.src = '';
        input.value = '';
        dropzone.style.display = 'flex';
        preview.style.display = 'none';
    }

    openVideoModal(videoId = null) {
        const modal = document.getElementById('videoModal');
        const modalTitle = document.getElementById('modalTitle');
        const deleteBtn = document.getElementById('btnDeleteVideo');

        if (videoId) {
            // Edit mode
            const video = this.dataManager.getVideo(videoId);
            this.currentVideoId = videoId;
            modalTitle.textContent = 'Editar Vídeo';
            deleteBtn.style.display = 'inline-flex';

            document.getElementById('videoTitle').value = video.title || '';
            document.getElementById('videoDescription').value = video.description || '';
            document.getElementById('videoScript').value = video.script || '';

            // Load thumbnail if exists
            if (video.thumbnail) {
                this.displayThumbnailPreview(video.thumbnail);
            } else {
                this.clearThumbnail();
            }
        } else {
            // Create mode
            this.currentVideoId = null;
            modalTitle.textContent = 'Novo Vídeo';
            deleteBtn.style.display = 'none';

            document.getElementById('videoTitle').value = '';
            document.getElementById('videoDescription').value = '';
            document.getElementById('videoScript').value = '';
            this.clearThumbnail();
        }

        modal.classList.add('active');
    }

    closeVideoModal() {
        document.getElementById('videoModal').classList.remove('active');
        this.currentVideoId = null;
    }

    saveVideo() {
        // Verifica se há um canal selecionado
        if (!this.selectedChannel) {
            this.showToast('Erro: Nenhum canal selecionado', 'error');
            return;
        }

        const title = document.getElementById('videoTitle').value.trim();

        if (!title) {
            this.showToast('Por favor, preencha o título do vídeo', 'error');
            return;
        }

        // Get thumbnail Base64 if exists
        const thumbnailImage = document.getElementById('thumbnailImage');
        const thumbnail = thumbnailImage.src && thumbnailImage.src.startsWith('data:')
            ? thumbnailImage.src
            : '';

        const videoData = {
            channelId: this.selectedChannel, // Usa o canal selecionado
            title,
            description: document.getElementById('videoDescription').value.trim(),
            script: document.getElementById('videoScript').value.trim(),
            thumbnail: thumbnail
        };

        if (this.currentVideoId) {
            this.dataManager.updateVideo(this.currentVideoId, videoData);
            this.showToast('Vídeo atualizado!', 'success');
        } else {
            this.dataManager.addVideo(videoData);
            this.showToast('Vídeo criado! Use os checkboxes para marcar o progresso.', 'success');
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
        document.getElementById('filterStatus').addEventListener('change', (e) => {
            this.currentFilters.status = e.target.value;
            this.renderVideos();
        });

        // Search
        document.getElementById('searchVideos').addEventListener('input', (e) => {
            this.currentSearchTerm = e.target.value;
            this.renderVideos();
        });
    }

    /* ==========================================
       RADAR DE MERCADO
       ========================================== */
    setupRadarHandlers() {
        const inputPT = document.getElementById('radarTitlePT');
        const inputTranslated = document.getElementById('radarTitleTranslated');
        const languageSelect = document.getElementById('radarLanguage');
        const btnSearch = document.getElementById('btnBuscarRadar');

        // Auto-translate on input or language change
        const updateTranslation = () => {
            const ptText = inputPT.value.trim();
            const targetLang = languageSelect.value;
            inputTranslated.value = ptText ? this.translateText(ptText, targetLang) : '';
        };

        inputPT.addEventListener('input', updateTranslation);
        languageSelect.addEventListener('change', updateTranslation);

        btnSearch.addEventListener('click', () => {
            this.searchYouTube();
        });
    }

    translateText(text, targetLang) {
        // Simple PT-BR to EN/ES translation dictionary
        const dictionaryEN = {
            'como': 'how to',
            'ganhar': 'make',
            'dinheiro': 'money',
            'online': 'online',
            'fazer': 'make',
            'aprender': 'learn',
            'melhor': 'best',
            'grátis': 'free',
            'rápido': 'fast',
            'fácil': 'easy',
            'em': 'in',
            'para': 'for',
            'com': 'with',
            'sem': 'without',
            'mais': 'more',
            'menos': 'less'
        };

        const dictionaryES = {
            'como': 'cómo',
            'ganhar': 'ganar',
            'dinheiro': 'dinero',
            'online': 'online',
            'fazer': 'hacer',
            'aprender': 'aprender',
            'melhor': 'mejor',
            'grátis': 'gratis',
            'rápido': 'rápido',
            'fácil': 'fácil',
            'em': 'en',
            'para': 'para',
            'com': 'con',
            'sem': 'sin',
            'mais': 'más',
            'menos': 'menos'
        };

        const dictionary = targetLang === 'es' ? dictionaryES : dictionaryEN;

        return text.toLowerCase().split(' ').map(word => {
            // Remove punctuation
            const cleanWord = word.replace(/[.,!?]/g, '');
            return dictionary[cleanWord] || word;
        }).join(' ');
    }

    async searchYouTube() {
        const apiKey = this.dataManager.settings.youtubeApiKey;
        const query = document.getElementById('radarTitleTranslated').value.trim();

        if (!query) {
            this.showToast('Digite um título primeiro', 'error');
            return;
        }

        if (!apiKey) {
            this.showToast('Configure sua YouTube API Key nas configurações primeiro!', 'error');
            setTimeout(() => {
                this.navigateTo('configuracoes');
            }, 1500);
            return;
        }

        const resultsContainer = document.getElementById('radarResults');
        resultsContainer.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--slate-400);">🔍 Buscando...</p>';

        try {
            // Calcular data de 30 dias atrás (formato RFC 3339)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const publishedAfter = thirtyDaysAgo.toISOString();

            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&order=viewCount&videoDuration=medium&publishedAfter=${publishedAfter}&key=${apiKey}`
            );

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();

            if (data.items && data.items.length > 0) {
                resultsContainer.innerHTML = data.items.map(item => `
                    <div class="radar-result-item">
                        <div style="display:flex;gap:1rem;margin-bottom:0.75rem;">
                            <img src="${item.snippet.thumbnails.default.url}"
                                 alt="Thumbnail"
                                 style="width:120px;height:90px;object-fit:cover;border-radius:0.5rem;">
                            <div style="flex:1;">
                                <h4 style="margin-bottom:0.5rem;color:var(--slate-50);font-size:0.9375rem;">
                                    ${this.escapeHtml(item.snippet.title)}
                                </h4>
                                <p style="color:var(--slate-400);font-size:0.8125rem;margin-bottom:0.375rem;">
                                    📺 ${this.escapeHtml(item.snippet.channelTitle)}
                                </p>
                                <p style="color:var(--slate-500);font-size:0.75rem;">
                                    📅 ${new Date(item.snippet.publishedAt).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        </div>
                        <a href="https://youtube.com/watch?v=${item.id.videoId}" target="_blank"
                           class="btn btn-secondary" style="width:100%;margin-top:0.5rem;">
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
            resultsContainer.innerHTML = `
                <p style="text-align:center;padding:2rem;color:var(--danger-400);">
                    ⚠️ Erro ao buscar. Verifique sua API Key nas configurações.
                </p>
            `;
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
        // Toggle API Key visibility
        document.getElementById('btnToggleApiKey').addEventListener('click', () => {
            const input = document.getElementById('youtubeApiKey');
            input.type = input.type === 'password' ? 'text' : 'password';
        });

        // Save API Key
        document.getElementById('btnSaveApiKey').addEventListener('click', () => {
            const apiKey = document.getElementById('youtubeApiKey').value.trim();

            if (!apiKey) {
                this.showToast('Digite uma API Key válida', 'error');
                return;
            }

            this.dataManager.settings.youtubeApiKey = apiKey;
            this.dataManager.saveSettings();
            this.showToast('API Key salva com sucesso!', 'success');
        });

        // Clear all data
        document.getElementById('btnLimparDados').addEventListener('click', () => {
            if (confirm('ATENÇÃO! Isso irá apagar TODOS os dados. Tem certeza?')) {
                localStorage.clear();
                location.reload();
            }
        });
    }

    renderSettings() {
        const apiKey = this.dataManager.settings.youtubeApiKey || '';
        document.getElementById('youtubeApiKey').value = apiKey;
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
        version: '4.0'
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

console.log('🚀 Dark Channel Manager v4.0 - UX Otimizada');
console.log('✅ Checklist inline + Modal simples + Radar melhorado');
