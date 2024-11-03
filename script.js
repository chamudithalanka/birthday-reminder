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
        // Update notification permission request
        if ("Notification" in window && "serviceWorker" in navigator) {
            // Register service worker
            navigator.serviceWorker.register('service-worker.js')
                .then((registration) => {
                    console.log('ServiceWorker registered');
                    Notification.requestPermission();
                })
                .catch((err) => {
                    console.log('ServiceWorker registration failed: ', err);
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
        if (Notification.permission === "granted") {
            new Notification("Birthday Today! 🎂", {
                body: `Today is ${birthday.name}'s birthday! Send them a wish!`,
                icon: 'cake-icon.png',
                silent: true
            });
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
            new Notification("Birthday Reminder Test", {
                body: "Notifications are working perfectly! 🎉",
                icon: 'cake-icon.png', // if you have an icon
                badge: 'badge-icon.png', // if you have a badge icon
                silent: true // This makes the notification silent
            });
            
            // Animate the button when notification is sent
            const button = document.querySelector('.button-content');
            button.style.transform = 'scale(1.2)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 200);
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
        const modal = document.createElement('div');
        modal.className = 'message-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="header-content">
                        <div class="profile-circle">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="header-text">
                            <h3>Send Wish to ${name}</h3>
                            <span class="phone-number">
                                <i class="fab fa-whatsapp"></i> ${phone}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="modal-body">
                    <div class="template-buttons">
                        <button class="template-btn active" data-template="default" onclick="birthdayReminder.switchTemplate('default', '${name}')">
                            <i class="fas fa-star"></i>
                            <span>Default</span>
                        </button>
                        <button class="template-btn" data-template="formal" onclick="birthdayReminder.switchTemplate('formal', '${name}')">
                            <i class="fas fa-user-tie"></i>
                            <span>Formal</span>
                        </button>
                        <button class="template-btn" data-template="friendly" onclick="birthdayReminder.switchTemplate('friendly', '${name}')">
                            <i class="fas fa-heart"></i>
                            <span>Friendly</span>
                        </button>
                        <button class="template-btn" data-template="funny" onclick="birthdayReminder.switchTemplate('funny', '${name}')">
                            <i class="fas fa-laugh"></i>
                            <span>Funny</span>
                        </button>
                    </div>

                    <div class="message-editor">
                        <label>
                            <i class="fas fa-edit"></i>
                            Customize Message
                        </label>
                        <textarea 
                            id="customMessage" 
                            placeholder="Type your birthday wish here..."
                        ></textarea>
                        <div class="editor-tools">
                            <button onclick="birthdayReminder.addEmoji('🎉')" class="emoji-btn">🎉</button>
                            <button onclick="birthdayReminder.addEmoji('🎂')" class="emoji-btn">🎂</button>
                            <button onclick="birthdayReminder.addEmoji('✨')" class="emoji-btn">✨</button>
                            <button onclick="birthdayReminder.addEmoji('🎈')" class="emoji-btn">🎈</button>
                            <button onclick="birthdayReminder.addEmoji('🎁')" class="emoji-btn">🎁</button>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn-cancel" onclick="birthdayReminder.closeModal()">
                        Cancel
                    </button>
                    <button class="btn-send" onclick="birthdayReminder.sendMessage('${phone}')">
                        <i class="fab fa-whatsapp"></i> Send Wish
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Initialize with default template
        this.switchTemplate('default', name);
    }

    switchTemplate(templateName, name) {
        // Update active button
        const buttons = document.querySelectorAll('.template-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.template === templateName) {
                btn.classList.add('active');
            }
        });

        // Update message text
        const message = this.messageTemplates[templateName].replace('{name}', name);
        document.getElementById('customMessage').value = message;
    }

    sendMessage(phone) {
        const message = document.getElementById('customMessage').value;
        const whatsappURL = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappURL, '_blank');
        this.closeModal();
    }

    closeModal() {
        const modal = document.querySelector('.message-modal');
        if (modal) {
            modal.remove();
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
