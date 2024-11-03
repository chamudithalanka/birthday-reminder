class BirthdayReminder {
    constructor() {
        this.birthdays = JSON.parse(localStorage.getItem('birthdays')) || [];
        this.editingIndex = null;
        this.init();
        this.messageTemplates = {
            default: "Happy Birthday {name}! 🎉🎂\n\nWishing you a fantastic day filled with joy and happiness! 🎈✨\n\nBest wishes,\n[Your Name]",
            formal: "Dear {name},\n\nWishing you a very Happy Birthday! 🎊\nMay this special day bring you all the success and happiness you deserve.\n\nBest regards,\n[Your Name]",
            friendly: "Hey {name}! 🎉\n\nHappy Birthday, my friend! 🎂\nHope your day is as awesome as you are! 🌟\n\nCheers,\n[Your Name]",
            funny: "Hey {name}! 😄\n\nCongrats on leveling up! 🎮\nAnother year of being awesome! 🎂\n\nEnjoy your special day! 🎈"
        };
    }

    init() {
        // Update notification handling
        if ("Notification" in window) {
            // Request notification permission
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    this.initializeNotifications();
                }
            });
        }

        // Update button event listeners to be mobile-friendly
        document.addEventListener('touchstart', () => {
            // Enable :active states on iOS
            document.body.classList.add('touch-device');
        });

        // Add event listeners
        document.getElementById('birthdayForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addBirthday();
        });

        // Add new event listeners
        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.displayBirthdays();
        });

        // Display birthdays
        this.displayBirthdays();
        
        // Check for birthdays daily
        this.checkBirthdays();
        setInterval(() => this.checkBirthdays(), 24 * 60 * 60 * 1000);
    }

    initializeNotifications() {
        // Register service worker for notifications
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful');
                    
                    // Test notification after registration
                    this.showTestNotification(registration);
                })
                .catch(err => {
                    console.error('ServiceWorker registration failed:', err);
                });
        }
    }

    showTestNotification(registration) {
        registration.showNotification('Birthday Reminder Test', {
            body: 'Notification system is working! 🎉',
            icon: 'cake-icon.png',
            vibrate: [200, 100, 200]
        });
    }

    addBirthday() {
        const name = document.getElementById('name').value;
        const date = document.getElementById('date').value;
        const category = document.getElementById('category').value;
        const notifyDays = parseInt(document.getElementById('notifyDays').value);
        const phone = document.getElementById('phone').value;

        const birthday = {
            name,
            date,
            category,
            notifyDays,
            phone
        };

        if (this.editingIndex !== null) {
            this.birthdays[this.editingIndex] = birthday;
            this.editingIndex = null;
            document.querySelector('button[type="submit"]').textContent = 'Add Birthday';
        } else {
            this.birthdays.push(birthday);
        }

        localStorage.setItem('birthdays', JSON.stringify(this.birthdays));
        this.displayBirthdays();
        document.getElementById('birthdayForm').reset();
        this.showToast('Birthday added successfully!');
    }

    editBirthday(index) {
        const birthday = this.birthdays[index];
        document.getElementById('name').value = birthday.name;
        document.getElementById('date').value = birthday.date;
        document.getElementById('category').value = birthday.category;
        document.getElementById('notifyDays').value = birthday.notifyDays;

        this.editingIndex = index;
        document.querySelector('button[type="submit"]').textContent = 'Update Birthday';
        this.showToast('Now editing birthday...', 'info');
    }

    removeBirthday(index) {
        this.birthdays.splice(index, 1);
        localStorage.setItem('birthdays', JSON.stringify(this.birthdays));
        this.displayBirthdays();
        this.showToast('Birthday removed successfully!');
    }

    calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        // Adjust age if birthday hasn't occurred this year
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    getNextBirthdayInfo(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
        
        // If birthday has passed this year, calculate for next year
        if (nextBirthday < today) {
            nextBirthday.setFullYear(today.getFullYear() + 1);
        }
        
        const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
        return daysUntil;
    }

    displayBirthdays() {
        const birthdayList = document.querySelector('.birthday-list');
        birthdayList.innerHTML = '';

        this.birthdays.forEach((birthday, index) => {
            const isBirthdayToday = this.isBirthdayToday(birthday.date);
            const daysUntilBirthday = this.getDaysUntilBirthday(birthday.date);
            
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="birthday-info">
                    <span class="name">${birthday.name}</span>
                    <span class="category-tag category-${birthday.category}">${birthday.category}</span>
                    <span class="age-info">${this.calculateAge(birthday.date)} years</span>
                </div>
                <div class="button-group">
                    <button onclick="birthdayReminder.editBirthday(${index})" class="btn-edit" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    
                    <button onclick="birthdayReminder.sendWhatsAppWish(${index})" 
                            class="btn-whatsapp ${isBirthdayToday ? 'active' : 'disabled'}" 
                            title="${isBirthdayToday ? 'Send Birthday Wish' : `${daysUntilBirthday} days until birthday`}">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                    
                    <button onclick="birthdayReminder.removeBirthday(${index})" class="btn-delete" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            // Update button event listeners
            const editBtn = li.querySelector('.btn-edit');
            const whatsappBtn = li.querySelector('.btn-whatsapp');
            const deleteBtn = li.querySelector('.btn-delete');

            // Add both click and touch events
            ['click', 'touchend'].forEach(eventType => {
                editBtn.addEventListener(eventType, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.editBirthday(index);
                });

                whatsappBtn.addEventListener(eventType, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.sendWhatsAppWish(index);
                });

                deleteBtn.addEventListener(eventType, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.removeBirthday(index);
                });
            });

            birthdayList.appendChild(li);
        });
    }

    isBirthdayToday(date) {
        const today = new Date();
        const bDate = new Date(date);
        return today.getDate() === bDate.getDate() && 
               today.getMonth() === bDate.getMonth();
    }

    getDaysUntilBirthday(date) {
        const today = new Date();
        const bDate = new Date(date);
        bDate.setFullYear(today.getFullYear());
        
        if (bDate < today) {
            bDate.setFullYear(today.getFullYear() + 1);
        }
        
        const diffTime = Math.abs(bDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    checkBirthdays() {
        const today = new Date();
        
        this.birthdays.forEach(birthday => {
            const bDate = new Date(birthday.date);
            
            // Check if today is the birthday (comparing month and date)
            if (bDate.getDate() === today.getDate() && bDate.getMonth() === today.getMonth()) {
                // Show birthday notification
                this.showBirthdayNotification(birthday);
                
                // Show WhatsApp reminder
                this.showWhatsAppReminder(birthday);
            }
        });
    }

    showBirthdayNotification(birthday) {
        if (!("Notification" in window)) {
            console.log("This browser does not support notifications");
            return;
        }

        if (Notification.permission === "granted") {
            try {
                // Try both methods
                if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification("Birthday Today! 🎂", {
                            body: `Today is ${birthday.name}'s birthday!`,
                            icon: 'cake-icon.png',
                            vibrate: [200, 100, 200],
                            requireInteraction: true
                        });
                    });
                } else {
                    // Fallback to regular notification
                    new Notification("Birthday Today! 🎂", {
                        body: `Today is ${birthday.name}'s birthday!`,
                        icon: 'cake-icon.png'
                    });
                }
            } catch (error) {
                console.error("Notification error:", error);
            }
        }
    }

    showWhatsAppReminder(birthday) {
        // Create a toast notification with WhatsApp button
        Toastify({
            text: `🎂 Today is ${birthday.name}'s birthday! Send them a wish!`,
            duration: -1, // Stays until clicked
            close: true,
            className: "birthday-toast",
            onClick: () => {
                // Open WhatsApp modal when clicked
                this.sendWhatsAppWish(birthday.name, birthday.phone);
            },
            style: {
                background: "linear-gradient(to right, #25D366, #128C7E)",
            }
        }).showToast();
    }

    sendNotification(birthday, daysUntil) {
        if (Notification.permission === "granted") {
            let message;
            if (daysUntil === 0) {
                message = `Today is ${birthday.name}'s birthday!`;
            } else {
                message = `${birthday.name}'s birthday is in ${daysUntil} day${daysUntil > 1 ? 's' : ''}!`;
            }

            new Notification(`Birthday Reminder`, {
                body: message,
                icon: 'cake-icon.png'
            });
        }
    }

    // Helper function to check leap year
    isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }

    showToast(message, type = 'info') {
        Toastify({
            text: message,
            duration: 3000,
            gravity: "bottom", // Changed to bottom for mobile
            position: "center", // Changed to center for mobile
            style: {
                background: type === 'error' ? "#ff4444" : 
                           type === 'info' ? "#4CAF50" : "#2196F3",
                borderRadius: '12px',
                padding: '1rem',
                fontSize: '14px',
                maxWidth: '90vw',
                margin: '0 auto 1rem auto'
            },
            onClick: function(){} // Closes on click
        }).showToast();
    }

    testNotification() {
        if (Notification.permission === "granted") {
            if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification("Birthday Reminder Test", {
                        body: "Notifications are working perfectly! 🎉",
                        icon: 'cake-icon.png',
                        badge: 'badge-icon.png',
                        vibrate: [200, 100, 200],
                        requireInteraction: true
                    });
                });
            } else {
                // Fallback to regular notification
                new Notification("Birthday Reminder Test", {
                    body: "Notifications are working perfectly! 🎉",
                    icon: 'cake-icon.png',
                    badge: 'badge-icon.png'
                });
            }
            
            // Animate the button when notification is sent
            const button = document.querySelector('.notification-test-btn');
            if (button) {
                button.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    button.style.transform = 'scale(1)';
                }, 200);
            }
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    this.testNotification();
                }
            });
        }
    }

    sendWhatsAppWish(index) {
        const birthday = this.birthdays[index];
        
        if (!this.isBirthdayToday(birthday.date)) {
            const daysUntil = this.getDaysUntilBirthday(birthday.date);
            this.showToast(`${birthday.name}'s birthday is in ${daysUntil} days!`, 'info');
            return;
        }

        if (!birthday.phone) {
            this.showToast('No phone number available for this contact!', 'error');
            return;
        }

        this.showSendMessageModal(birthday.name, birthday.phone);
    }

    showSendMessageModal(name, phone) {
        this.closeModal();

        const modalContainer = document.createElement('div');
        modalContainer.className = 'message-modal';
        
        const modalContent = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Send Birthday Wish to ${name}</h3>
                    <button class="close-btn" onclick="birthdayReminder.closeModal()">×</button>
                </div>
                
                <div class="modal-body">
                    <div class="template-selector">
                        <select id="messageTemplate" onchange="birthdayReminder.updateTemplate('${name}')">
                            <option value="default">🎉 Birthday Wish</option>
                            <option value="formal">👔 Professional Wish</option>
                            <option value="friendly">🤗 Casual Wish</option>
                            <option value="funny">😄 Fun Wish</option>
                        </select>
                    </div>

                    <textarea 
                        id="customMessage" 
                        class="message-input"
                        placeholder="Type your message..."
                    ></textarea>

                    <div class="emoji-toolbar">
                        <button onclick="birthdayReminder.addEmoji('🎉')">
                            <img src="party-popper.png" alt="🎉" width="24">
                        </button>
                        <button onclick="birthdayReminder.addEmoji('🎂')">
                            <img src="birthday-cake.png" alt="🎂" width="24">
                        </button>
                        <button onclick="birthdayReminder.addEmoji('✨')">
                            <img src="sparkles.png" alt="✨" width="24">
                        </button>
                        <button onclick="birthdayReminder.addEmoji('🎈')">
                            <img src="balloon.png" alt="🎈" width="24">
                        </button>
                        <button onclick="birthdayReminder.addEmoji('🎁')">
                            <img src="gift.png" alt="🎁" width="24">
                        </button>
                        <button onclick="birthdayReminder.addEmoji('🌟')">
                            <img src="star.png" alt="🌟" width="24">
                        </button>
                        <button onclick="birthdayReminder.addEmoji('💝')">
                            <img src="heart.png" alt="💝" width="24">
                        </button>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="cancel-btn">Cancel</button>
                    <button class="send-btn">Send via WhatsApp</button>
                </div>
            </div>
        `;

        modalContainer.innerHTML = modalContent;
        document.body.appendChild(modalContainer);

        this.updateTemplate(name);

        // Close modal when clicking outside
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                this.closeModal();
            }
        });

        document.body.style.overflow = 'hidden';
    }

    updateTemplate(name) {
        const select = document.getElementById('messageTemplate');
        const template = this.messageTemplates[select.value];
        const message = template.replace('{name}', name);
        document.getElementById('customMessage').value = message;
    }

    closeModal() {
        const modal = document.querySelector('.message-modal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = 'auto';
        }
    }

    checkBirthdaysAndSendWishes() {
        const today = new Date();
        this.birthdays.forEach(birthday => {
            const bDate = new Date(birthday.date);
            if (bDate.getDate() === today.getDate() && 
                bDate.getMonth() === today.getMonth()) {
                // Show notification
                this.sendNotification(birthday);
                
                // Show WhatsApp button for today's birthdays
                this.showWhatsAppReminder(birthday);
            }
        });
    }

    // Add new method for emoji insertion
    addEmoji(emoji) {
        const textarea = document.getElementById('customMessage');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end);
        textarea.value = before + emoji + after;
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
    }
}

const birthdayReminder = new BirthdayReminder(); 

// Add this to your initialization code
document.addEventListener('DOMContentLoaded', () => {
    // Check birthdays when page loads
    birthdayReminder.checkBirthdays();
    
    // Check birthdays every hour
    setInterval(() => {
        birthdayReminder.checkBirthdays();
    }, 3600000); // 3600000 ms = 1 hour
}); 
