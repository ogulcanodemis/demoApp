class ErrorService {
    static showError(error, title = 'Hata') {
        // Toast bildirimi göster
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <i class="fas fa-exclamation-circle text-red-500"></i>
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium text-gray-900">${title}</p>
                    <p class="text-sm text-gray-500">${error}</p>
                </div>
                <div class="ml-auto pl-3">
                    <button class="close-toast">
                        <i class="fas fa-times text-gray-400"></i>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(toast);

        // Animasyon için setTimeout kullan
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Otomatik kapat
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 5000);

        // Kapatma butonu işlevselliği
        toast.querySelector('.close-toast').onclick = () => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        };
    }

    static handleApiError(error) {
        if (error.response) {
            // API'den gelen hata yanıtı
            const message = error.response.data.error || 'Bir hata oluştu';
            this.showError(message);

            // 401 hatası için oturumu sonlandır
            if (error.response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        } else if (error.request) {
            // İstek yapıldı ama yanıt alınamadı
            this.showError('Sunucuya ulaşılamıyor');
        } else {
            // İstek oluşturulurken hata oluştu
            this.showError(error.message);
        }
    }
}

window.ErrorService = ErrorService; 