document.addEventListener('DOMContentLoaded', async () => {
    // Token kontrolü
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        // Kullanıcı bilgilerini al
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Oturum süresi dolmuş olabilir');
        }

        const user = await response.json();
        document.getElementById('userEmail').textContent = user.email;

        // Takvimi başlat
        initializeCalendar();
        
        // Hesapları yükle
        await loadAccounts();

    } catch (error) {
        console.error('Hata:', error);
        localStorage.removeItem('token');
        alert('Oturumunuz sonlanmış. Lütfen tekrar giriş yapın.');
        window.location.href = '/login.html';
    }
});

// Takvimi başlat
function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        locale: 'tr',
        editable: true,
        eventClick: handleEventClick,
        dateClick: handleDateClick,
        events: loadEvents,
        eventDrop: handleEventDrop,
        eventResize: handleEventResize
    });

    calendar.render();
    window.calendar = calendar;
}

// Etkinlikleri yükle
async function loadEvents(info, successCallback, failureCallback) {
    try {
        const response = await fetch('/api/calendar', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Etkinlikler yüklenemedi');

        const events = await response.json();
        const calendarEvents = events.map(event => ({
            id: event.id,
            title: event.title,
            start: event.planned_date,
            description: event.caption,
            backgroundColor: getEventColor(event.status),
            extendedProps: event
        }));

        successCallback(calendarEvents);
    } catch (error) {
        console.error('Etkinlik yükleme hatası:', error);
        failureCallback(error);
    }
}

// Etkinlik durumuna göre renk belirle
function getEventColor(status) {
    switch (status) {
        case 'planned': return '#3B82F6';  // blue-500
        case 'published': return '#10B981'; // green-500
        case 'failed': return '#EF4444';    // red-500
        default: return '#6B7280';          // gray-500
    }
}

// Yeni etkinlik ekleme modalını göster
function showAddEventModal(date = null) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white p-8 rounded-lg shadow-lg w-[600px]">
            <h3 class="text-xl font-bold mb-4">Yeni İçerik Planla</h3>
            <form id="addEventForm" class="space-y-4">
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2">
                        Başlık
                    </label>
                    <input type="text" id="eventTitle" class="w-full px-3 py-2 border rounded-md" required>
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2">
                        Hesap
                    </label>
                    <select id="accountSelect" class="w-full px-3 py-2 border rounded-md" required>
                        <option value="">Hesap seçin</option>
                    </select>
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2">
                        İçerik Türü
                    </label>
                    <select id="contentType" class="w-full px-3 py-2 border rounded-md" required>
                        <option value="image">Fotoğraf</option>
                        <option value="video">Video</option>
                        <option value="carousel">Carousel</option>
                        <option value="reels">Reels</option>
                        <option value="story">Story</option>
                    </select>
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2">
                        Açıklama
                    </label>
                    <textarea id="eventCaption" class="w-full px-3 py-2 border rounded-md" rows="3"></textarea>
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2">
                        Hashtagler
                    </label>
                    <input type="text" id="eventHashtags" class="w-full px-3 py-2 border rounded-md" 
                        placeholder="#örnek #hashtag">
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2">
                        Tarih ve Saat
                    </label>
                    <input type="datetime-local" id="eventDate" class="w-full px-3 py-2 border rounded-md" 
                        value="${date ? date.toISOString().slice(0, 16) : ''}" required>
                </div>
                <div class="flex justify-end space-x-2">
                    <button type="button" class="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                        onclick="this.closest('.fixed').remove()">
                        İptal
                    </button>
                    <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                        Kaydet
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    // Form submit olayını dinle
    document.getElementById('addEventForm').addEventListener('submit', handleAddEvent);
}

// Hesapları yükle
async function loadAccounts() {
    try {
        const response = await fetch('/api/instagram/accounts', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Hesaplar yüklenemedi');

        const accounts = await response.json();
        const select = document.getElementById('accountSelect');
        
        if (select) {
            select.innerHTML = '<option value="">Hesap seçin</option>' + 
                accounts.map(account => 
                    `<option value="${account.id}">${account.account_name}</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Hesap yükleme hatası:', error);
    }
}

// Yeni etkinlik ekleme
async function handleAddEvent(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('eventTitle').value,
        account_id: parseInt(document.getElementById('accountSelect').value),
        content_type: document.getElementById('contentType').value,
        caption: document.getElementById('eventCaption').value,
        hashtags: document.getElementById('eventHashtags').value,
        planned_date: document.getElementById('eventDate').value
    };

    try {
        const response = await fetch('/api/calendar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Etkinlik eklenemedi');

        const newEvent = await response.json();
        window.calendar.addEvent({
            id: newEvent.id,
            title: newEvent.title,
            start: newEvent.planned_date,
            backgroundColor: getEventColor(newEvent.status),
            extendedProps: newEvent
        });

        e.target.closest('.fixed').remove();
        showNotification('İçerik başarıyla planlandı', 'success');
    } catch (error) {
        console.error('Etkinlik ekleme hatası:', error);
        showNotification(error.message, 'error');
    }
}

// Bildirim göster
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white z-50`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Event listeners
document.getElementById('addEventBtn').addEventListener('click', () => showAddEventModal());
document.getElementById('generateScheduleBtn').addEventListener('click', showGenerateScheduleModal);
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
});

// Medya yükleme alanını göster
function showMediaUploader(modal) {
    const uploadArea = document.createElement('div');
    uploadArea.className = 'mt-4 p-4 border-2 border-dashed rounded-lg text-center';
    uploadArea.innerHTML = `
        <div class="space-y-2">
            <i class="fas fa-cloud-upload-alt text-3xl text-gray-400"></i>
            <p class="text-gray-600">Medya dosyasını sürükleyin veya seçin</p>
            <input type="file" id="mediaInput" class="hidden" accept="image/*,video/*">
            <button type="button" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onclick="document.getElementById('mediaInput').click()">
                Dosya Seç
            </button>
        </div>
        <div id="mediaPreview" class="mt-4 hidden">
            <img src="" alt="Preview" class="max-w-full h-auto rounded">
            <button type="button" class="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                onclick="removeMedia()">
                Kaldır
            </button>
        </div>
    `;

    modal.querySelector('form').insertBefore(
        uploadArea,
        modal.querySelector('form .flex.justify-end')
    );

    // Drag & drop olaylarını dinle
    setupDragAndDrop(uploadArea);

    // Dosya seçimi olayını dinle
    document.getElementById('mediaInput').addEventListener('change', handleFileSelect);
}

// Drag & drop işlemleri
function setupDragAndDrop(element) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        element.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        element.addEventListener(eventName, () => {
            element.classList.add('border-blue-500');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        element.addEventListener(eventName, () => {
            element.classList.remove('border-blue-500');
        });
    });

    element.addEventListener('drop', handleDrop);
}

// Dosya bırakma işlemi
async function handleDrop(e) {
    const dt = e.dataTransfer;
    const file = dt.files[0];
    await handleFile(file);
}

// Dosya seçimi işlemi
async function handleFileSelect(e) {
    const file = e.target.files[0];
    await handleFile(file);
}

// Dosya işleme
async function handleFile(file) {
    if (!file) return;

    const formData = new FormData();
    formData.append('media', file);

    try {
        const response = await fetch('/api/media/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) throw new Error('Dosya yüklenemedi');

        const data = await response.json();
        showMediaPreview(data);
    } catch (error) {
        console.error('Dosya yükleme hatası:', error);
        showNotification(error.message, 'error');
    }
}

// Medya önizleme
function showMediaPreview(data) {
    const previewDiv = document.getElementById('mediaPreview');
    const previewImg = previewDiv.querySelector('img');
    
    previewImg.src = data.thumbnail;
    previewDiv.classList.remove('hidden');
    
    // Medya bilgilerini forma ekle
    const form = document.getElementById('addEventForm');
    form.dataset.mediaPath = data.file.path;
    form.dataset.mediaType = data.file.mimetype;
}

// Medyayı kaldır
async function removeMedia() {
    const form = document.getElementById('addEventForm');
    const mediaPath = form.dataset.mediaPath;

    if (mediaPath) {
        try {
            await fetch(`/api/media/${encodeURIComponent(path.basename(mediaPath))}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
        } catch (error) {
            console.error('Medya silme hatası:', error);
        }
    }

    document.getElementById('mediaPreview').classList.add('hidden');
    delete form.dataset.mediaPath;
    delete form.dataset.mediaType;
}

// Paylaşım durumu kontrolü
async function checkPublishStatus(eventId) {
    try {
        const response = await fetch(`/api/calendar/${eventId}/status`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Durum kontrol edilemedi');

        const status = await response.json();
        return status;
    } catch (error) {
        console.error('Durum kontrolü hatası:', error);
        throw error;
    }
}

// Şimdi paylaş
async function publishNow(eventId) {
    try {
        const response = await fetch(`/api/calendar/${eventId}/publish`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Paylaşım başarısız');

        const result = await response.json();
        showNotification(result.message, 'success');
        
        // Takvimi güncelle
        window.calendar.refetchEvents();
    } catch (error) {
        console.error('Paylaşım hatası:', error);
        showNotification(error.message, 'error');
    }
}

// Etkinlik detaylarına paylaşım butonları ekle
function addPublishButtons(modal, event) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'mt-4 flex justify-end space-x-2';
    
    if (event.extendedProps.status === 'planned') {
        buttonContainer.innerHTML = `
            <button type="button" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                onclick="publishNow(${event.id})">
                <i class="fas fa-share"></i> Şimdi Paylaş
            </button>
        `;
    } else if (event.extendedProps.status === 'published') {
        buttonContainer.innerHTML = `
            <a href="https://instagram.com/p/${event.extendedProps.instagram_post_id}" 
               target="_blank" 
               class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                <i class="fab fa-instagram"></i> Instagram'da Gör
            </a>
        `;
    }

    modal.querySelector('.modal-content').appendChild(buttonContainer);
}

// İstatistikleri göster
async function showStats() {
    try {
        const response = await fetch('/api/stats/publishing?period=30d', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('İstatistikler alınamadı');

        const stats = await response.json();
        showStatsModal(stats);
    } catch (error) {
        console.error('İstatistik hatası:', error);
        showNotification(error.message, 'error');
    }
}

// İstatistik modalını göster
function showStatsModal(stats) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white p-8 rounded-lg shadow-lg w-[1000px] max-h-[90vh] overflow-y-auto">
            <h2 class="text-2xl font-bold mb-6">Paylaşım İstatistikleri</h2>
            
            <!-- Genel Metrikler -->
            <div class="grid grid-cols-4 gap-4 mb-8">
                <div class="bg-blue-50 p-4 rounded">
                    <h3 class="text-sm font-semibold text-blue-600">Toplam Paylaşım</h3>
                    <p class="text-2xl font-bold">${stats.total_posts}</p>
                </div>
                <div class="bg-green-50 p-4 rounded">
                    <h3 class="text-sm font-semibold text-green-600">Başarılı</h3>
                    <p class="text-2xl font-bold">${stats.published}</p>
                </div>
                <div class="bg-red-50 p-4 rounded">
                    <h3 class="text-sm font-semibold text-red-600">Başarısız</h3>
                    <p class="text-2xl font-bold">${stats.failed}</p>
                </div>
                <div class="bg-purple-50 p-4 rounded">
                    <h3 class="text-sm font-semibold text-purple-600">Başarı Oranı</h3>
                    <p class="text-2xl font-bold">${stats.success_rate.toFixed(1)}%</p>
                </div>
            </div>

            <!-- Etkileşim İstatistikleri -->
            <div class="mb-8">
                <h3 class="text-xl font-semibold mb-4">Etkileşim İstatistikleri</h3>
                <div class="grid grid-cols-3 gap-4">
                    <div class="bg-gray-50 p-4 rounded">
                        <h4 class="text-lg font-semibold mb-2">Ortalama Beğeni</h4>
                        <p class="text-xl">${Math.round(stats.engagement_stats.avg_likes)}</p>
                    </div>
                    <div class="bg-gray-50 p-4 rounded">
                        <h4 class="text-lg font-semibold mb-2">Ortalama Yorum</h4>
                        <p class="text-xl">${Math.round(stats.engagement_stats.avg_comments)}</p>
                    </div>
                    <div class="bg-gray-50 p-4 rounded">
                        <h4 class="text-lg font-semibold mb-2">Ortalama Erişim</h4>
                        <p class="text-xl">${Math.round(stats.engagement_stats.avg_reach)}</p>
                    </div>
                </div>
            </div>

            <!-- En İyi Zamanlar -->
            <div class="mb-8">
                <h3 class="text-xl font-semibold mb-4">En İyi Paylaşım Zamanları</h3>
                <div class="grid grid-cols-3 gap-4">
                    ${stats.best_times.slice(0, 3).map(time => `
                        <div class="bg-gray-50 p-4 rounded text-center">
                            <div class="text-2xl font-bold">${time.hour}:00</div>
                            <div class="text-sm text-gray-600">
                                ${time.posts} paylaşım
                                <br>
                                ${time.avg_engagement.toFixed(1)}% etkileşim
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <button class="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300"
                    onclick="this.closest('.fixed').remove()">
                Kapat
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Stats butonunu ekle
document.querySelector('.mb-6 .space-x-2').insertAdjacentHTML('afterbegin', `
    <button id="showStatsBtn" class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
        <i class="fas fa-chart-bar"></i> İstatistikler
    </button>
`);

document.getElementById('showStatsBtn').addEventListener('click', showStats); 