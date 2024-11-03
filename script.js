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
                    <button class="close-btn">×</button>
                </div>
                
                <div class="template-options">
                    <div class="template-option selected" data-template="default">
                        <i class="fas fa-birthday-cake"></i>
                        <span>Birthday</span>
                    </div>
                    <div class="template-option" data-template="formal">
                        <i class="fas fa-user-tie"></i>
                        <span>Formal</span>
                    </div>
                    <div class="template-option" data-template="friendly">
                        <i class="fas fa-heart"></i>
                        <span>Friendly</span>
                    </div>
                    <div class="template-option" data-template="funny">
                        <i class="fas fa-laugh"></i>
                        <span>Funny</span>
                    </div>
                </div>

                <div class="message-container">
                    <textarea 
                        id="customMessage" 
                        class="message-input"
                        placeholder="Type your message..."
                    ></textarea>
                </div>

                <div class="emoji-section">
                    <div class="emoji-header">
                        <span>Quick Emojis</span>
                    </div>
                    <div class="emoji-toolbar">
                        <button class="emoji-button" data-emoji="🎉">🎉</button>
                        <button class="emoji-button" data-emoji="🎂">🎂</button>
                        <button class="emoji-button" data-emoji="✨">✨</button>
                        <button class="emoji-button" data-emoji="🎈">🎈</button>
                        <button class="emoji-button" data-emoji="🎁">🎁</button>
                        <button class="emoji-button" data-emoji="🌟">🌟</button>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="cancel-btn">Cancel</button>
                    <button class="send-btn" data-phone="${phone}">
                        <i class="fab fa-whatsapp"></i>
                        Send via WhatsApp
                    </button>
                </div>
            </div>
        `;

        modalContainer.innerHTML = modalContent;
        document.body.appendChild(modalContainer);

        this.initializeModalEvents(modalContainer);
        this.selectTemplate('default', name);
    }

    // New methods for enhanced functionality
    selectTemplate(type, name) {
        const templates = document.querySelectorAll('.template-card');
        templates.forEach(temp => temp.classList.remove('selected'));
        
        const selectedTemplate = document.querySelector(`.template-card:nth-child(${
            type === 'default' ? 1 : 
            type === 'formal' ? 2 : 
            type === 'friendly' ? 3 : 4
        })`);
        
        if (selectedTemplate) {
            selectedTemplate.classList.add('selected');
        }

        const message = this.messageTemplates[type].replace('{name}', name);
        const textarea = document.getElementById('customMessage');
        textarea.value = message;
        this.adjustTextareaHeight(textarea);
    }

    scrollEmojis(direction) {
        const toolbar = document.getElementById('emojiToolbar');
        const scrollAmount = 100;
        
        if (direction === 'left') {
            toolbar.scrollBy(-scrollAmount, 0);
        } else {
            toolbar.scrollBy(scrollAmount, 0);
        }
    }

    adjustTextareaHeight(textarea) {
        textarea.style.height = '';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    initializeModalEvents(modalContainer) {
        // Close button event
        const closeBtn = modalContainer.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => this.closeModal());

        // Template switching
        const templateOptions = modalContainer.querySelectorAll('.template-option');
        templateOptions.forEach(option => {
            option.addEventListener('click', () => {
                const template = option.dataset.template;
                const name = modalContainer.querySelector('.modal-header h3').textContent.split(' ').pop();
                
                // Remove selected class from all options
                templateOptions.forEach(opt => opt.classList.remove('selected'));
                // Add selected class to clicked option
                option.classList.add('selected');
                
                // Update message
                this.updateTemplate(template, name);
            });
        });

        // Emoji buttons
        const emojiButtons = modalContainer.querySelectorAll('.emoji-button');
        emojiButtons.forEach(button => {
            button.addEventListener('click', () => {
                const emoji = button.dataset.emoji;
                this.addEmoji(emoji);
            });
        });

        // Cancel button
        const cancelBtn = modalContainer.querySelector('.cancel-btn');
        cancelBtn.addEventListener('click', () => this.closeModal());

        // Update WhatsApp button event listener
        const sendBtn = modalContainer.querySelector('.send-btn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                const phone = sendBtn.getAttribute('data-phone');
                console.log('Phone number:', phone); // Debug log
                this.sendWhatsAppMessage(phone);
            });
        }

        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    }

    updateTemplate(template, name) {
        const textarea = document.getElementById('customMessage');
        const message = this.messageTemplates[template].replace('{name}', name);
        textarea.value = message;
    }

    addEmoji(emoji) {
        const textarea = document.getElementById('customMessage');
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const before = text.substring(0, start);
            const after = text.substring(end);
            
            textarea.value = before + emoji + after;
            // Set cursor position after emoji
            textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
            textarea.focus();
        }
    }

    sendWhatsAppMessage(phone) {
        const message = document.getElementById('customMessage').value;
        
        // Basic validation
        if (!message || !phone) {
            console.log('Message or phone number missing');
            return;
        }
        
        try {
            // Format phone number (remove spaces, +, and any other characters)
            let formattedPhone = phone.replace(/[\s+\-()]/g, '');
            
            // If number doesn't start with country code, add Sri Lankan code
            if (!formattedPhone.startsWith('94')) {
                // Remove leading zero if exists
                formattedPhone = formattedPhone.replace(/^0/, '');
                // Add country code
                formattedPhone = '94' + formattedPhone;
            }
            
            // Create the WhatsApp URL
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
            
            // Log for debugging
            console.log('Opening WhatsApp URL:', whatsappUrl);
            
            // Open in new tab
            window.open(whatsappUrl, '_blank');
            
            // Close modal
            this.closeModal();
            
        } catch (error) {
            console.error('Error sending WhatsApp message:', error);
        }
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