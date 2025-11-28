// ============================================
// DARK CHANNEL MANAGER - FUTURISTIC VERSION
// ============================================

// Data Manager - LocalStorage
class DataManager {
    constructor() {
        this.videos = this.loadVideos();
    }

    loadVideos() {
        const data = localStorage.getItem('darkChannelVideos');
        return data ? JSON.parse(data) : [];
    }

    saveVideos() {
        localStorage.setItem('darkChannelVideos', JSON.stringify(this.videos));
    }

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

    // Calcula o estágio automaticamente baseado no checklist
    calculateStage(video) {
        const checks = video.checklist || {};
        const completedCount = Object.values(checks).filter(Boolean).length;

        if (checks.upload) return 'postado';
        if (completedCount === 3) return 'finalizado';
        if (completedCount >= 1) return 'producao';
        return 'planejamento';
    }

    getProgress(video) {
        const checks = video.checklist || {};
        const total = 4;
        const completed = Object.values(checks).filter(Boolean).length;
        return Math.round((completed / total) * 100);
    }

    getUniqueChannels() {
        const channels = [...new Set(this.videos.map(v => v.channel))];
        return channels.filter(c => c && c.trim() !== '').sort();
    }
}

// UI Manager
class UIManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.currentTab = 'videos';
        this.currentVideoId = null;
        this.thumbImageData = null;
        this.initializeEventListeners();
        this.render();
    }

    initializeEventListeners() {
        // Tab Navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Video Management
        document.getElementById('addVideoBtn').addEventListener('click', () => this.openVideoModal());
        document.getElementById('cancelVideoBtn').addEventListener('click', () => this.closeVideoModal());
        document.getElementById('saveVideoBtn').addEventListener('click', () => this.saveVideo());
        document.getElementById('deleteVideoBtn').addEventListener('click', () => this.deleteVideo());

        // Video checklist - update stage preview in real-time
        ['checkThumb', 'checkScript', 'checkEdit', 'checkUpload'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.updateStagePreview());
        });

        // Thumbnail upload
        document.getElementById('videoThumbFile').addEventListener('change', (e) => this.handleThumbUpload(e));

        // Filters
        document.getElementById('channelFilter').addEventListener('change', () => this.renderVideos());
        document.getElementById('stageFilter').addEventListener('change', () => this.renderVideos());

        // SRT Converter
        document.getElementById('textInput').addEventListener('input', () => this.updateConverterStats());
        document.getElementById('convertBtn').addEventListener('click', () => this.convertToSRT());
        document.getElementById('downloadSrtBtn').addEventListener('click', () => this.downloadSRT());

        // Close modal on background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    switchTab(tab) {
        this.currentTab = tab;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tab}-tab`);
        });

        this.render();
    }

    render() {
        this.updateStats();

        if (this.currentTab === 'videos') {
            this.renderVideos();
            this.updateChannelFilter();
        }
    }

    updateStats() {
        const videoCount = this.dataManager.videos.length;
        const channelCount = this.dataManager.getUniqueChannels().length;

        document.getElementById('videoCount').textContent =
            `${videoCount} ${videoCount === 1 ? 'vídeo' : 'vídeos'}`;
        document.getElementById('channelCount').textContent =
            `${channelCount} ${channelCount === 1 ? 'canal' : 'canais'}`;
    }

    // Video Management
    renderVideos() {
        const container = document.getElementById('videosList');
        let videos = [...this.dataManager.videos];

        // Apply filters
        const channelFilter = document.getElementById('channelFilter').value;
        const stageFilter = document.getElementById('stageFilter').value;

        if (channelFilter) {
            videos = videos.filter(v => v.channel === channelFilter);
        }

        if (stageFilter) {
            videos = videos.filter(v => v.stage === stageFilter);
        }

        if (videos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🎬</div>
                    <h3>Nenhum vídeo encontrado</h3>
                    <p>Clique em "CRIAR VÍDEO" para começar sua produção!</p>
                </div>
            `;
            return;
        }

        // Sort by creation date (newest first)
        videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        container.innerHTML = videos.map(video => {
            const progress = this.dataManager.getProgress(video);
            const checklist = video.checklist || {};

            return `
                <div class="video-card" data-id="${video.id}">
                    <div class="video-header">
                        <div class="video-title">
                            <h3>${this.escapeHtml(video.title)}</h3>
                            <div class="video-channel">📺 ${this.escapeHtml(video.channel)}</div>
                        </div>
                        <span class="stage-badge stage-${video.stage}">${this.getStageBadge(video.stage)}</span>
                    </div>

                    <div class="video-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>

                    <div class="video-checklist">
                        <span class="check-item ${checklist.thumb ? 'completed' : ''}">
                            ${checklist.thumb ? '✅' : '⬜'} THUMBNAIL
                        </span>
                        <span class="check-item ${checklist.script ? 'completed' : ''}">
                            ${checklist.script ? '✅' : '⬜'} ROTEIRO
                        </span>
                        <span class="check-item ${checklist.edit ? 'completed' : ''}">
                            ${checklist.edit ? '✅' : '⬜'} EDIÇÃO
                        </span>
                        <span class="check-item ${checklist.upload ? 'completed' : ''}">
                            ${checklist.upload ? '✅' : '⬜'} UPLOAD
                        </span>
                    </div>
                </div>
            `;
        }).join('');

        // Add click listeners
        container.querySelectorAll('.video-card').forEach(card => {
            card.addEventListener('click', () => {
                this.openVideoModal(card.dataset.id);
            });
        });
    }

    updateChannelFilter() {
        const channelFilter = document.getElementById('channelFilter');
        const channels = this.dataManager.getUniqueChannels();

        const options = channels.map(channel =>
            `<option value="${this.escapeHtml(channel)}">${this.escapeHtml(channel)}</option>`
        ).join('');

        channelFilter.innerHTML = '<option value="">📺 TODOS OS CANAIS</option>' + options;
    }

    openVideoModal(videoId = null) {
        const modal = document.getElementById('videoModal');
        const title = document.getElementById('videoModalTitle');
        const deleteBtn = document.getElementById('deleteVideoBtn');

        if (videoId) {
            const video = this.dataManager.getVideo(videoId);
            this.currentVideoId = videoId;
            title.textContent = '✏️ EDITAR VÍDEO';
            deleteBtn.style.display = 'block';

            document.getElementById('videoChannel').value = video.channel;
            document.getElementById('videoTitle').value = video.title;
            document.getElementById('videoDescription').value = video.description || '';
            document.getElementById('videoThumbText').value = video.thumbText || '';
            document.getElementById('videoScript').value = video.script || '';

            const checklist = video.checklist || {};
            document.getElementById('checkThumb').checked = checklist.thumb || false;
            document.getElementById('checkScript').checked = checklist.script || false;
            document.getElementById('checkEdit').checked = checklist.edit || false;
            document.getElementById('checkUpload').checked = checklist.upload || false;

            this.thumbImageData = video.thumbImage || null;
            if (this.thumbImageData) {
                document.getElementById('thumbPreview').innerHTML =
                    `<img src="${this.thumbImageData}" alt="Thumbnail preview">`;
                document.getElementById('thumbFileName').textContent = '✅ Thumb carregada';
            }
        } else {
            this.currentVideoId = null;
            title.textContent = '🎬 NOVO VÍDEO';
            deleteBtn.style.display = 'none';

            document.getElementById('videoChannel').value = '';
            document.getElementById('videoTitle').value = '';
            document.getElementById('videoDescription').value = '';
            document.getElementById('videoThumbText').value = '';
            document.getElementById('videoScript').value = '';

            document.getElementById('checkThumb').checked = false;
            document.getElementById('checkScript').checked = false;
            document.getElementById('checkEdit').checked = false;
            document.getElementById('checkUpload').checked = false;

            this.thumbImageData = null;
            document.getElementById('thumbPreview').innerHTML = '';
            document.getElementById('thumbFileName').textContent = '';
        }

        this.updateStagePreview();
        modal.classList.add('active');
    }

    closeVideoModal() {
        document.getElementById('videoModal').classList.remove('active');
        this.currentVideoId = null;
        this.thumbImageData = null;
    }

    saveVideo() {
        const channel = document.getElementById('videoChannel').value.trim();
        const title = document.getElementById('videoTitle').value.trim();

        if (!channel) {
            this.showNotification('❌ Por favor, insira o nome do canal', 'danger');
            return;
        }

        if (!title) {
            this.showNotification('❌ Por favor, insira o título do vídeo', 'danger');
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
                thumb: document.getElementById('checkThumb').checked,
                script: document.getElementById('checkScript').checked,
                edit: document.getElementById('checkEdit').checked,
                upload: document.getElementById('checkUpload').checked
            }
        };

        if (this.currentVideoId) {
            this.dataManager.updateVideo(this.currentVideoId, videoData);
            this.showNotification('✅ Vídeo atualizado com sucesso!', 'success');
        } else {
            this.dataManager.addVideo(videoData);
            this.showNotification('✅ Vídeo criado com sucesso!', 'success');
        }

        this.closeVideoModal();
        this.render();
    }

    deleteVideo() {
        if (confirm('⚠️ Tem certeza que deseja excluir este vídeo?\n\nEsta ação não pode ser desfeita.')) {
            this.dataManager.deleteVideo(this.currentVideoId);
            this.showNotification('🗑️ Vídeo excluído', 'success');
            this.closeVideoModal();
            this.render();
        }
    }

    updateStagePreview() {
        const checklist = {
            thumb: document.getElementById('checkThumb').checked,
            script: document.getElementById('checkScript').checked,
            edit: document.getElementById('checkEdit').checked,
            upload: document.getElementById('checkUpload').checked
        };

        const stage = this.dataManager.calculateStage({ checklist });
        const badge = document.getElementById('currentStage');
        badge.textContent = this.getStageBadge(stage);
        badge.className = `stage-badge stage-${stage}`;
    }

    handleThumbUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.showNotification('❌ Por favor, selecione uma imagem válida', 'danger');
            return;
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('❌ Imagem muito grande! Tamanho máximo: 5MB', 'danger');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.thumbImageData = e.target.result;
            document.getElementById('thumbPreview').innerHTML =
                `<img src="${this.thumbImageData}" alt="Thumbnail preview">`;
            document.getElementById('thumbFileName').textContent = `✅ ${file.name}`;
            this.showNotification('✅ Thumbnail carregada!', 'success');
        };
        reader.readAsDataURL(file);
    }

    getStageBadge(stage) {
        const badges = {
            'planejamento': '📋 PLANEJAMENTO',
            'producao': '🎬 PRODUÇÃO',
            'finalizado': '✅ FINALIZADO',
            'postado': '🚀 POSTADO'
        };
        return badges[stage] || badges.planejamento;
    }

    // SRT Converter - CapCut Compatible Format
    updateConverterStats() {
        const text = document.getElementById('textInput').value;
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        const chars = text.length;
        const wordsPerSubtitle = parseInt(document.getElementById('wordsPerSubtitle').value) || 10;
        const subtitles = words.length > 0 ? Math.ceil(words.length / wordsPerSubtitle) : 0;

        document.getElementById('wordCount').textContent = words.length;
        document.getElementById('charCount').textContent = chars;
        document.getElementById('subtitleCount').textContent = subtitles;
    }

    convertToSRT() {
        const text = document.getElementById('textInput').value.trim();

        if (!text) {
            this.showNotification('❌ Por favor, insira algum texto para converter', 'danger');
            return;
        }

        const wordsPerSubtitle = parseInt(document.getElementById('wordsPerSubtitle').value) || 10;
        const durationPerSubtitle = parseFloat(document.getElementById('durationPerSubtitle').value) || 3;

        const words = text.split(/\s+/).filter(w => w.length > 0);
        let srtContent = '';
        let currentTime = 0;

        for (let i = 0; i < words.length; i += wordsPerSubtitle) {
            const subtitleNumber = Math.floor(i / wordsPerSubtitle) + 1;
            const subtitleWords = words.slice(i, i + wordsPerSubtitle);
            const subtitleText = subtitleWords.join(' ');

            const startTime = this.formatSRTTimeCapCut(currentTime);
            const endTime = this.formatSRTTimeCapCut(currentTime + durationPerSubtitle);

            srtContent += `${subtitleNumber}\n`;
            srtContent += `${startTime} --> ${endTime}\n`;
            srtContent += `${subtitleText}\n\n`;

            currentTime += durationPerSubtitle;
        }

        document.getElementById('srtOutput').value = srtContent;
        document.getElementById('downloadSrtBtn').style.display = 'block';
        this.showNotification('✅ Conversão concluída! Formato compatível com CapCut', 'success');
    }

    // CapCut uses comma (,) as decimal separator, not dot (.)
    formatSRTTimeCapCut(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const millis = Math.floor((seconds % 1) * 1000);

        // Format: HH:MM:SS,mmm (comma for milliseconds - CapCut standard)
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
    }

    downloadSRT() {
        const content = document.getElementById('srtOutput').value;

        if (!content) {
            this.showNotification('❌ Nenhum conteúdo para baixar', 'danger');
            return;
        }

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `legendas-capcut-${Date.now()}.srt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('✅ Arquivo .srt baixado com sucesso!', 'success');
    }

    // Notification System
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? 'var(--success)' : type === 'danger' ? 'var(--danger)' : 'var(--neon-cyan)'};
            color: var(--bg-dark);
            border-radius: 8px;
            font-weight: 700;
            font-family: 'Orbitron', sans-serif;
            font-size: 0.9rem;
            letter-spacing: 1px;
            z-index: 10000;
            box-shadow: 0 0 30px ${type === 'success' ? 'rgba(0,255,136,0.6)' : type === 'danger' ? 'rgba(255,51,102,0.6)' : 'rgba(0,240,255,0.6)'};
            animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s;
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize Application
const dataManager = new DataManager();
const uiManager = new UIManager(dataManager);

// Export data functionality
window.exportData = function() {
    const data = {
        videos: dataManager.videos,
        exportDate: new Date().toISOString(),
        version: '2.0'
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

    console.log('✅ Backup exportado com sucesso!');
};

// Import data functionality
window.importData = function(jsonData) {
    try {
        const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        if (data.videos && Array.isArray(data.videos)) {
            dataManager.videos = data.videos;
            dataManager.saveVideos();
            uiManager.render();
            console.log('✅ Dados importados com sucesso!');
            return true;
        }
        console.error('❌ Formato de dados inválido');
        return false;
    } catch (e) {
        console.error('❌ Erro ao importar dados:', e);
        return false;
    }
};

console.log('⚡ DARK CHANNEL MANAGER v2.0 - FUTURISTIC EDITION');
console.log('💾 Use exportData() para backup dos dados');
console.log('📥 Use importData(json) para restaurar backup');
console.log('🎬 Sistema pronto para produção!');
