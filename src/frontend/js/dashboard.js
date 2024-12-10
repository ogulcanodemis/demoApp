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

        // Instagram hesaplarını yükle
        await loadInstagramAccounts();

        // Performans verilerini yükle
        await loadPerformanceSummary();

        // İstatistikleri yükle
        await loadStatistics();

    } catch (error) {
        console.error('Hata:', error);
        localStorage.removeItem('token');
        alert('Oturumunuz sonlanmış. Lütfen tekrar giriş yapın.');
        window.location.href = '/login.html';
        return;
    }
});

// Hesap Ekleme Modal'ını Aç
document.getElementById('addAccountBtn').addEventListener('click', () => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white p-8 rounded-lg shadow-lg w-96">
            <h3 class="text-xl font-bold mb-4">Instagram Hesabı Ekle</h3>
            <form id="addAccountForm" class="space-y-4">
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2">
                        Hesap Adı
                    </label>
                    <input type="text" id="accountName" class="w-full px-3 py-2 border rounded-md" required>
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2">
                        Access Token
                    </label>
                    <input type="text" id="accessToken" class="w-full px-3 py-2 border rounded-md" required>
                </div>
                <div class="flex justify-end space-x-2">
                    <button type="button" class="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400" onclick="this.closest('.fixed').remove()">
                        İptal
                    </button>
                    <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                        Ekle
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    // Form submit olayını dinle
    document.getElementById('addAccountForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const accountName = document.getElementById('accountName').value.trim();
        const accessToken = document.getElementById('accessToken').value.trim();

        if (!accountName || !accessToken) {
            alert('Lütfen tüm alanları doldurun');
            return;
        }

        try {
            const response = await fetch('/api/instagram/accounts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    account_name: accountName,
                    access_token: accessToken
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Hesap eklenirken bir hata oluştu');
            }

            modal.remove();
            await loadInstagramAccounts();
            alert('Hesap başarıyla eklendi');
        } catch (error) {
            console.error('Hata:', error);
            alert(error.message);
        }
    });
});

// Instagram hesaplarını yükle
async function loadInstagramAccounts() {
    try {
        const response = await fetch('/api/instagram/accounts', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const accounts = await response.json();
        
        const accountsList = document.getElementById('accountsList');
        accountsList.innerHTML = accounts.map(account => `
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded mb-2">
                <span>${account.account_name}</span>
                <div>
                    <button class="text-blue-500 hover:text-blue-700 mr-2" onclick="viewInsights(${account.id})">
                        <i class="fas fa-chart-line"></i>
                    </button>
                    <button class="text-red-500 hover:text-red-700" onclick="deleteAccount(${account.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Hesaplar yüklenirken hata:', error);
    }
}

// Hesap silme fonksiyonu
async function deleteAccount(accountId) {
    if (!confirm('Bu hesabı silmek istediğinizden emin misiniz?')) {
        return;
    }

    try {
        const response = await fetch(`/api/instagram/accounts/${accountId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Hesap silinirken bir hata oluştu');
        }

        await loadInstagramAccounts();
        alert('Hesap başarıyla silindi');
    } catch (error) {
        console.error('Hata:', error);
        alert(error.message);
    }
}

// Çıkış butonu
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
});

// Rakip ekleme modal'ını aç
document.getElementById('addCompetitorBtn').addEventListener('click', () => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white p-8 rounded-lg shadow-lg w-[500px]">
            <h3 class="text-xl font-bold mb-4">Rakip Ekle</h3>
            <form id="addCompetitorForm" class="space-y-4">
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2">
                        Rakip Hesap Adı (@kullanıcıadı)
                    </label>
                    <input type="text" id="competitorUsername" 
                        class="w-full px-3 py-2 border rounded-md" 
                        placeholder="@rakip_hesap" required>
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-2">
                        Instagram Profil Linki
                    </label>
                    <input type="url" id="competitorProfileUrl" 
                        class="w-full px-3 py-2 border rounded-md" 
                        placeholder="https://instagram.com/rakip_hesap" required>
                </div>
                <div class="flex justify-end space-x-2">
                    <button type="button" 
                        class="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400" 
                        onclick="this.closest('.fixed').remove()">
                        İptal
                    </button>
                    <button type="submit" 
                        class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                        Ekle
                    </button>
                </div>
            </form>
            <div id="analysisStatus" class="mt-4 text-sm text-gray-600 hidden">
                <div class="flex items-center">
                    <svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Rakip analizi yapılıyor...
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Form submit olayını dinle
    document.getElementById('addCompetitorForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('competitorUsername').value.trim().replace('@', '');
        const profileUrl = document.getElementById('competitorProfileUrl').value.trim();

        if (!username || !profileUrl) {
            alert('Lütfen tüm alanları doldurun');
            return;
        }

        // Analiz durumunu göster
        document.getElementById('analysisStatus').classList.remove('hidden');
        document.querySelector('#addCompetitorForm button[type="submit"]').disabled = true;

        try {
            const response = await fetch('/api/instagram/competitors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    username,
                    profile_url: profileUrl
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Rakip eklenirken bir hata oluştu');
            }

            modal.remove();
            await loadCompetitors();

            // Başarı mesajını göster
            showNotification('Rakip başarıyla eklendi ve analiz edildi', 'success');
        } catch (error) {
            console.error('Hata:', error);
            showNotification(error.message, 'error');
        }
    });
});

// Bildirim gösterme fonksiyonu
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

// Rakipleri yükle
async function loadCompetitors() {
    try {
        const response = await fetch('/api/instagram/competitors', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const competitors = await response.json();
        
        const competitorsList = document.getElementById('competitorsList');
        competitorsList.innerHTML = competitors.map(competitor => `
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded mb-2">
                <span>${competitor.account_name}</span>
                <div>
                    <button class="text-blue-500 hover:text-blue-700 mr-2" onclick="viewCompetitorStats(${competitor.id})">
                        <i class="fas fa-chart-bar"></i>
                    </button>
                    <button class="text-red-500 hover:text-red-700" onclick="deleteCompetitor(${competitor.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Karşılaştırma grafiğini güncelle
        await updateCompetitorChart();
    } catch (error) {
        console.error('Rakipler yüklenirken hata:', error);
    }
}

// Rakip silme fonksiyonu
async function deleteCompetitor(competitorId) {
    if (!confirm('Bu rakibi silmek istediğinizden emin misiniz?')) {
        return;
    }

    try {
        const response = await fetch(`/api/instagram/competitors/${competitorId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Rakip silinirken bir hata oluştu');
        }

        await loadCompetitors();
        alert('Rakip başarıyla silindi');
    } catch (error) {
        console.error('Hata:', error);
        alert(error.message);
    }
}

// Performans verilerini yükle
async function loadPerformanceSummary() {
    try {
        const response = await fetch('/api/instagram/performance', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        
        // Temel metrikleri güncelle
        document.getElementById('totalFollowers').textContent = data.totalFollowers.toLocaleString();
        document.getElementById('engagementRate').textContent = `${data.engagementRate.toFixed(2)}%`;
        
        // Grafiği güncelle
        updatePerformanceChart(data.dailyStats);
    } catch (error) {
        console.error('Performans verileri yüklenirken hata:', error);
    }
}

// Performans grafiğini güncelle
function updatePerformanceChart(dailyStats) {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    
    if (window.performanceChart) {
        window.performanceChart.destroy();
    }
    
    window.performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dailyStats.map(stat => stat.date),
            datasets: [
                {
                    label: 'Etkileşim Oranı (%)',
                    data: dailyStats.map(stat => stat.engagementRate),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Performans verilerini otomatik güncelle
setInterval(async () => {
    if (document.visibilityState === 'visible') {
        await loadPerformanceSummary();
        await loadStatistics();
    }
}, 300000); // Her 5 dakikada bir güncelle

// Sayfa görünürlüğü değiştiğinde kontrol et
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
        await loadPerformanceSummary();
        await loadStatistics();
    }
});

// Pencere boyutu değiştiğinde grafiği yeniden boyutlandır
window.addEventListener('resize', () => {
    if (window.performanceChart) {
        window.performanceChart.resize();
    }
});

// Performans verilerini güncelle butonu
document.getElementById('refreshPerformance').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/instagram/sync', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Veriler güncellenirken bir hata oluştu');
        }

        await loadPerformanceSummary();
        alert('Veriler başarıyla güncellendi');
    } catch (error) {
        console.error('Hata:', error);
        alert(error.message);
    }
});

// İstatistikleri yükle
async function loadStatistics() {
    try {
        const response = await fetch('/api/instagram/statistics', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const stats = await response.json();
        
        // İstatistikleri güncelle
        document.getElementById('bestPostingTime').textContent = stats.bestPostingTime;
        document.getElementById('avgLikes').textContent = stats.averageLikes.toLocaleString();
        document.getElementById('avgComments').textContent = stats.averageComments.toLocaleString();
        
        // Hashtag önerilerini güncelle
        const hashtagsContainer = document.getElementById('suggestedHashtags');
        hashtagsContainer.innerHTML = stats.suggestedHashtags.map(tag => `
            <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm">
                #${tag}
            </span>
        `).join('');
    } catch (error) {
        console.error('İstatistikler yüklenirken hata:', error);
    }
}

// Rakip karşılaştırma grafiğini güncelle
async function updateCompetitorChart() {
    try {
        const response = await fetch('/api/instagram/performance/compare', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();

        const ctx = document.getElementById('competitorChart').getContext('2d');
        
        if (window.competitorChart) {
            window.competitorChart.destroy();
        }

        window.competitorChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(account => account.account_name),
                datasets: [
                    {
                        label: 'Etkileşim Oranı (%)',
                        data: data.map(account => account.engagement_rate),
                        backgroundColor: data.map(account => 
                            account.is_competitor ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)'
                        ),
                        borderColor: data.map(account => 
                            account.is_competitor ? 'rgb(239, 68, 68)' : 'rgb(59, 130, 246)'
                        ),
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Etkileşim: ${context.parsed.y.toFixed(2)}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Rakip karşılaştırma verileri yüklenirken hata:', error);
    }
}

// Rakip istatistiklerini görüntüle
async function viewCompetitorStats(competitorId) {
    try {
        const response = await fetch(`/api/instagram/competitors/${competitorId}/stats`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const stats = await response.json();

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="bg-white p-8 rounded-lg shadow-lg w-[600px]">
                <h3 class="text-xl font-bold mb-4">Rakip İstatistikleri</h3>
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-gray-50 p-4 rounded">
                            <h4 class="text-sm font-semibold text-gray-600">Takipçi Sayısı</h4>
                            <p class="text-lg font-bold">${stats.followers.toLocaleString()}</p>
                        </div>
                        <div class="bg-gray-50 p-4 rounded">
                            <h4 class="text-sm font-semibold text-gray-600">Etkileşim Oranı</h4>
                            <p class="text-lg font-bold">${stats.engagement_rate.toFixed(2)}%</p>
                        </div>
                    </div>
                    <button class="w-full mt-4 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400" onclick="this.closest('.fixed').remove()">
                        Kapat
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Rakip istatistikleri yüklenirken hata:', error);
        alert('İstatistikler yüklenirken bir hata oluştu');
    }
}

async function viewInsights(accountId) {
    try {
        const response = await fetch(`/api/instagram/accounts/${accountId}/insights`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('İstatistikler alınamadı');
        }

        const data = await response.json();
        
        // Modal oluştur
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white p-8 rounded-lg shadow-lg w-[800px] max-h-[80vh] overflow-y-auto">
                <h3 class="text-xl font-bold mb-4">Hesap İstatistikleri</h3>
                
                <div class="grid grid-cols-3 gap-4 mb-6">
                    <div class="bg-blue-50 p-4 rounded">
                        <h4 class="text-sm font-semibold text-blue-600">Görüntülenme</h4>
                        <p class="text-2xl font-bold">${data.insights.impressions}</p>
                    </div>
                    <div class="bg-green-50 p-4 rounded">
                        <h4 class="text-sm font-semibold text-green-600">Erişim</h4>
                        <p class="text-2xl font-bold">${data.insights.reach}</p>
                    </div>
                    <div class="bg-purple-50 p-4 rounded">
                        <h4 class="text-sm font-semibold text-purple-600">Profil Görüntüleme</h4>
                        <p class="text-2xl font-bold">${data.insights.profile_views}</p>
                    </div>
                </div>

                <h4 class="text-lg font-semibold mb-3">Son Gönderiler</h4>
                <div class="space-y-4">
                    ${data.posts.map(post => `
                        <div class="border rounded-lg p-4">
                            <div class="flex items-start gap-4">
                                ${post.media_url ? `
                                    <img src="${post.media_url}" alt="Post" class="w-24 h-24 object-cover rounded">
                                ` : ''}
                                <div class="flex-1">
                                    <p class="text-gray-600 mb-2">${post.caption || 'Açıklama yok'}</p>
                                    <div class="flex gap-4 text-sm text-gray-500">
                                        <span>${post.like_count} beğeni</span>
                                        <span>${post.comments_count} yorum</span>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-3">
                                <h5 class="text-sm font-semibold text-gray-600">Önerilen Hashtagler:</h5>
                                <div class="flex flex-wrap gap-2 mt-2">
                                    ${post.suggestedHashtags.split(' ').map(tag => `
                                        <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm">
                                            ${tag}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <button class="w-full mt-6 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300" 
                        onclick="this.closest('.fixed').remove()">
                    Kapat
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Hata:', error);
        alert(error.message);
    }
}