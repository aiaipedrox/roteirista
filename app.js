// Dark Channel Manager - Main Application
// Data Storage
class DataManager {
    constructor() {
        this.channels = this.loadChannels();
        this.videos = this.loadVideos();
    }

    loadChannels() {
        const data = localStorage.getItem('channels');
        return data ? JSON.parse(data) : [];
    }

    saveChannels() {
        localStorage.setItem('channels', JSON.stringify(this.channels));
    }

    loadVideos() {
        const data = localStorage.getItem('videos');
        return data ? JSON.parse(data) : [];
    }

    saveVideos() {
        localStorage.setItem('videos', JSON.stringify(this.videos));
    }

    addChannel(channel) {
        channel.id = Date.now().toString();
        channel.createdAt = new Date().toISOString();
        this.channels.push(channel);
        this.saveChannels();
        return channel;
    }

    updateChannel(id, updates) {
        const index = this.channels.findIndex(c => c.id === id);
        if (index !== -1) {
            this.channels[index] = { ...this.channels[index], ...updates };
            this.saveChannels();
            return this.channels[index];
        }
        return null;
    }

    deleteChannel(id) {
        this.channels = this.channels.filter(c => c.id !== id);
        this.videos = this.videos.filter(v => v.channelId !== id);
        this.saveChannels();
        this.saveVideos();
    }

    getChannel(id) {
        return this.channels.find(c => c.id === id);
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

    getVideosByChannel(channelId) {
        return this.videos.filter(v => v.channelId === channelId);
    }

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
}

// UI Manager
class UIManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.currentTab = 'channels';
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

        // Channel Management
        document.getElementById('addChannelBtn').addEventListener('click', () => this.openChannelModal());
        document.getElementById('cancelChannelBtn').addEventListener('click', () => this.closeChannelModal());
        document.getElementById('saveChannelBtn').addEventListener('click', () => this.saveChannel());

        // Video Management
        document.getElementById('addVideoBtn').addEventListener('click', () => this.openVideoModal());
        document.getElementById('cancelVideoBtn').addEventListener('click', () => this.closeVideoModal());
        document.getElementById('saveVideoBtn').addEventListener('click', () => this.saveVideo());
        document.getElementById('deleteVideoBtn').addEventListener('click', () => this.deleteVideo());

        // Video checklist
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

        if (this.currentTab === 'channels') {
            this.renderChannels();
        } else if (this.currentTab === 'videos') {
            this.renderVideos();
            this.updateFilters();
        }
    }

    updateStats() {
        document.getElementById('channelCount').textContent =
            `${this.dataManager.channels.length} ${this.dataManager.channels.length === 1 ? 'canal' : 'canais'}`;
        document.getElementById('videoCount').textContent =
            `${this.dataManager.videos.length} ${this.dataManager.videos.length === 1 ? 'vídeo' : 'vídeos'}`;
    }

    // Channel Management
    renderChannels() {
        const container = document.getElementById('channelsList');

        if (this.dataManager.channels.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📺</div>
                    <h3>Nenhum canal cadastrado</h3>
                    <p>Adicione seu primeiro canal para começar!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.dataManager.channels.map(channel => {
            const videoCount = this.dataManager.getVideosByChannel(channel.id).length;
            return `
                <div class="channel-card" data-id="${channel.id}">
                    <h3>📺 ${this.escapeHtml(channel.name)}</h3>
                    <p>${this.escapeHtml(channel.description || 'Sem descrição')}</p>
                    <div class="channel-stats">
                        <span>📹 ${videoCount} ${videoCount === 1 ? 'vídeo' : 'vídeos'}</span>
                    </div>
                    <div class="channel-actions">
                        <button class="btn btn-secondary btn-edit-channel">✏️ Editar</button>
                        <button class="btn btn-danger btn-delete-channel">🗑️ Excluir</button>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners
        container.querySelectorAll('.channel-card').forEach(card => {
            const id = card.dataset.id;
            card.querySelector('.btn-edit-channel').addEventListener('click', (e) => {
                e.stopPropagation();
                this.openChannelModal(id);
            });
            card.querySelector('.btn-delete-channel').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteChannel(id);
            });
        });
    }

    openChannelModal(channelId = null) {
        const modal = document.getElementById('channelModal');

        if (channelId) {
            const channel = this.dataManager.getChannel(channelId);
            document.getElementById('channelName').value = channel.name;
            document.getElementById('channelDescription').value = channel.description || '';
            modal.dataset.editId = channelId;
        } else {
            document.getElementById('channelName').value = '';
            document.getElementById('channelDescription').value = '';
            delete modal.dataset.editId;
        }

        modal.classList.add('active');
    }

    closeChannelModal() {
        document.getElementById('channelModal').classList.remove('active');
    }

    saveChannel() {
        const name = document.getElementById('channelName').value.trim();

        if (!name) {
            alert('Por favor, insira o nome do canal');
            return;
        }

        const channelData = {
            name,
            description: document.getElementById('channelDescription').value.trim()
        };

        const modal = document.getElementById('channelModal');
        const editId = modal.dataset.editId;

        if (editId) {
            this.dataManager.updateChannel(editId, channelData);
        } else {
            this.dataManager.addChannel(channelData);
        }

        this.closeChannelModal();
        this.render();
    }

    deleteChannel(id) {
        const channel = this.dataManager.getChannel(id);
        const videoCount = this.dataManager.getVideosByChannel(id).length;

        const message = videoCount > 0
            ? `Tem certeza que deseja excluir o canal "${channel.name}"?\nIsso irá excluir também ${videoCount} ${videoCount === 1 ? 'vídeo' : 'vídeos'}.`
            : `Tem certeza que deseja excluir o canal "${channel.name}"?`;

        if (confirm(message)) {
            this.dataManager.deleteChannel(id);
            this.render();
        }
    }

    // Video Management
    renderVideos() {
        const container = document.getElementById('videosList');
        let videos = [...this.dataManager.videos];

        // Apply filters
        const channelFilter = document.getElementById('channelFilter').value;
        const stageFilter = document.getElementById('stageFilter').value;

        if (channelFilter) {
            videos = videos.filter(v => v.channelId === channelFilter);
        }

        if (stageFilter) {
            videos = videos.filter(v => v.stage === stageFilter);
        }

        if (videos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🎥</div>
                    <h3>Nenhum vídeo encontrado</h3>
                    <p>Adicione seu primeiro vídeo para começar!</p>
                </div>
            `;
            return;
        }

        // Sort by creation date (newest first)
        videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        container.innerHTML = videos.map(video => {
            const channel = this.dataManager.getChannel(video.channelId);
            const progress = this.dataManager.getProgress(video);
            const checklist = video.checklist || {};

            return `
                <div class="video-card" data-id="${video.id}">
                    <div class="video-header">
                        <div class="video-title">
                            <h3>${this.escapeHtml(video.title)}</h3>
                            <div class="video-channel">📺 ${channel ? this.escapeHtml(channel.name) : 'Canal removido'}</div>
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
                            ${checklist.thumb ? '✅' : '⬜'} Thumbnail
                        </span>
                        <span class="check-item ${checklist.script ? 'completed' : ''}">
                            ${checklist.script ? '✅' : '⬜'} Roteiro
                        </span>
                        <span class="check-item ${checklist.edit ? 'completed' : ''}">
                            ${checklist.edit ? '✅' : '⬜'} Edição
                        </span>
                        <span class="check-item ${checklist.upload ? 'completed' : ''}">
                            ${checklist.upload ? '✅' : '⬜'} Upload
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

    updateFilters() {
        const channelFilter = document.getElementById('channelFilter');
        const videoChannel = document.getElementById('videoChannel');

        const options = this.dataManager.channels.map(channel =>
            `<option value="${channel.id}">${this.escapeHtml(channel.name)}</option>`
        ).join('');

        channelFilter.innerHTML = '<option value="">Todos os canais</option>' + options;
        videoChannel.innerHTML = '<option value="">Selecione o canal</option>' + options;
    }

    openVideoModal(videoId = null) {
        const modal = document.getElementById('videoModal');
        const title = document.getElementById('videoModalTitle');
        const deleteBtn = document.getElementById('deleteVideoBtn');

        this.updateFilters();

        if (videoId) {
            const video = this.dataManager.getVideo(videoId);
            this.currentVideoId = videoId;
            title.textContent = 'Editar Vídeo';
            deleteBtn.style.display = 'block';

            document.getElementById('videoChannel').value = video.channelId;
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
            title.textContent = 'Novo Vídeo';
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
        const channelId = document.getElementById('videoChannel').value;
        const title = document.getElementById('videoTitle').value.trim();

        if (!channelId) {
            alert('Por favor, selecione um canal');
            return;
        }

        if (!title) {
            alert('Por favor, insira o título do vídeo');
            return;
        }

        const videoData = {
            channelId,
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
        } else {
            this.dataManager.addVideo(videoData);
        }

        this.closeVideoModal();
        this.render();
    }

    deleteVideo() {
        if (confirm('Tem certeza que deseja excluir este vídeo?')) {
            this.dataManager.deleteVideo(this.currentVideoId);
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
            alert('Por favor, selecione uma imagem válida');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.thumbImageData = e.target.result;
            document.getElementById('thumbPreview').innerHTML =
                `<img src="${this.thumbImageData}" alt="Thumbnail preview">`;
            document.getElementById('thumbFileName').textContent = file.name;
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

    // SRT Converter
    updateConverterStats() {
        const text = document.getElementById('textInput').value;
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        const chars = text.length;
        const wordsPerSubtitle = parseInt(document.getElementById('wordsPerSubtitle').value) || 10;
        const subtitles = Math.ceil(words.length / wordsPerSubtitle);

        document.getElementById('wordCount').textContent = words.length;
        document.getElementById('charCount').textContent = chars;
        document.getElementById('subtitleCount').textContent = subtitles;
    }

    convertToSRT() {
        const text = document.getElementById('textInput').value.trim();

        if (!text) {
            alert('Por favor, insira algum texto para converter');
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

            const startTime = this.formatSRTTime(currentTime);
            const endTime = this.formatSRTTime(currentTime + durationPerSubtitle);

            srtContent += `${subtitleNumber}\n`;
            srtContent += `${startTime} --> ${endTime}\n`;
            srtContent += `${subtitleText}\n\n`;

            currentTime += durationPerSubtitle;
        }

        document.getElementById('srtOutput').value = srtContent;
        document.getElementById('downloadSrtBtn').style.display = 'block';
    }

    formatSRTTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const millis = Math.floor((seconds % 1) * 1000);

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
    }

    downloadSRT() {
        const content = document.getElementById('srtOutput').value;

        if (!content) {
            alert('Nenhum conteúdo para baixar');
            return;
        }

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `legendas-${Date.now()}.srt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize Application
const dataManager = new DataManager();
const uiManager = new UIManager(dataManager);

// Export data functionality
window.exportData = function() {
    const data = {
        channels: dataManager.channels,
        videos: dataManager.videos,
        exportDate: new Date().toISOString()
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
};

console.log('🎬 Dark Channel Manager iniciado com sucesso!');
console.log('💾 Use exportData() no console para fazer backup dos seus dados');
