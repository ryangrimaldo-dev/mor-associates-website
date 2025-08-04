const navMenu = document.getElementById('nav-menu'),
      navToggle = document.getElementById('nav-toggle'),
      navClose = document.getElementById('nav-close')

if(navToggle){
    navToggle.addEventListener('click', () =>{
        navMenu.classList.add('show-menu')
    })
}

if(navClose){
    navClose.addEventListener('click', () =>{
        navMenu.classList.remove('show-menu')
    })
}

const navLink = document.querySelectorAll('.nav_link')

function linkAction(){
    const navMenu = document.getElementById('nav-menu')
    navMenu.classList.remove('show-menu')
}
navLink.forEach(n => n.addEventListener('click', linkAction))

function scrollHeader(){
    const nav = document.getElementById('header')
    if(this.scrollY >= 80) nav.classList.add('scroll-header'); else nav.classList.remove('scroll-header')
}

function scrollUp(){
    const scrollUp = document.getElementById('scroll-top');
    if(this.scrollY >= 560) scrollUp.classList.add('show-scroll'); else scrollUp.classList.remove('show-scroll')
}

const sections = document.querySelectorAll('section[id]')

function scrollActive(){
    const scrollY = window.pageYOffset

    sections.forEach(current =>{
        const sectionHeight = current.offsetHeight
        const sectionTop = current.offsetTop - 200;
        const sectionId = current.getAttribute('id')
        const activeLink = document.querySelector(`.nav_menu a[href*="#${sectionId}"]`);


        if(scrollY > sectionTop && scrollY <= sectionTop + sectionHeight){
            document.querySelectorAll('.nav_link').forEach(link =>
                link.classList.remove('active-link')
            );
            if (activeLink) activeLink.classList.add('active-link');
        }
    })
}
// Removed duplicate scroll event listener

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Create Intersection Observer for animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

document.addEventListener('DOMContentLoaded', () => {
        const animatedElements = document.querySelectorAll(".service_card, .team_card, .feature, .stat");
        
        animatedElements.forEach((el, index) => {
        if (el.classList.contains('service__card') || el.classList.contains('team_card')) {
            el.style.animationDelay = `${index * 0.1}s`;
            el.classList.add('fadeInUp');
        } else if (el.classList.contains('feature')) {
            el.style.animationDelay = `${index * 0.2}s`;
            el.classList.add('fadeInLeft');
        } else if (el.classList.contains('stat')) {
            el.style.animationDelay = `${index * 0.1}s`;
            el.classList.add('fadeInUp');
        }
        
        // Set initial styles for animation
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        observer.observe(el);
    });
});

const contactForm = document.getElementById('contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const formObject = {};
        formData.forEach((value, key) => {
            formObject[key] = value;
        });
        
        const requiredFields = ['name', 'email', 'service', 'message'];
        let isValid = true;
        
        requiredFields.forEach(field => {
            const input = this.querySelector(`[name="${field}"]`);
            if (!formObject[field] || formObject[field].trim() === '') {
                input.style.borderColor = '#ef4444';
                isValid = false;
            } else {
                input.style.borderColor = '#e2e8f0';
            }
        });
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const emailInput = this.querySelector('[name="email"]');
        if (!emailRegex.test(formObject.email)) {
            emailInput.style.borderColor = '#ef4444';
            isValid = false;
        }
        
        if (isValid) {
            // Show loading state
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = '<span>Sending...</span><i class="fas fa-spinner fa-spin"></i>';
            submitButton.disabled = true;
            
            try {
                // Send data to PHP script
                const response = await fetch('contact_handler.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formObject)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showNotification(result.message, 'success');
                    
                    this.reset();
                    
                    const labels = this.querySelectorAll('.form_label');
                    labels.forEach(label => {
                        label.style.top = '1rem';
                        label.style.fontSize = 'var(--normal-font-size)';
                        label.style.color = 'var(--text-light)';
                    });
                    
                    // Reset select field
                    const selectField = this.querySelector('select');
                    if (selectField) {
                        selectField.selectedIndex = 0;
                    }
                } else {
                    showNotification(result.message || 'An error occurred. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                showNotification('Network error. Please check your connection and try again.', 'error');
            } finally {
                // Restore button state
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }
        } else {
            showNotification('Please fill in all required fields correctly.', 'error');
        }
    });
}

function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `
        <div class="notification_content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification_close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        .notification_content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .notification_close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 0.25rem;
            border-radius: 50%;
            transition: background-color 0.3s ease;
        }
        .notification_close:hover {
            background-color: rgba(255, 255, 255, 0.2);
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    const closeBtn = notification.querySelector('.notification_close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    });
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
    const formInputs = document.querySelectorAll('.form_input');
    
    formInputs.forEach(input => {
        if (input.value.trim() !== '') {
            const label = input.nextElementSibling;
            if (label && label.classList.contains('form_label')) {
                label.style.top = '-10px';
                label.style.fontSize = 'var(--small-font-size)';
                label.style.color = 'var(--primary-color)';
            }
        }
        
        input.addEventListener('focus', () => {
            const label = input.nextElementSibling;
            if (label && label.classList.contains('form_label')) {
                label.style.top = '-10px';
                label.style.fontSize = 'var(--small-font-size)';
                label.style.color = 'var(--primary-color)';
            }
        });
        
        input.addEventListener('blur', () => {
            if (input.value.trim() === '') {
                const label = input.nextElementSibling;
                if (label && label.classList.contains('form_label')) {
                    label.style.top = '1rem';
                    label.style.fontSize = 'var(--normal-font-size)';
                    label.style.color = 'var(--text-light)';
                }
            }
        });
    });
});

window.addEventListener('load', () => {
    const elementsToAnimate = document.querySelectorAll('.home_title, .home_description, .home_buttons');
    
    elementsToAnimate.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'all 0.8s ease';
        
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 200);
    });
});

function revealOnScroll() {
    const reveals = document.querySelectorAll('.service_card, .team_card, .contact_card');
    
    reveals.forEach(element => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
            element.classList.add('animate-on-scroll', 'fadeInUp');
        }
    });
}

// Removed duplicate scroll listener - now handled by consolidated scroll handler

let lastScrollTop = 0;
const header = document.getElementById('header');

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > lastScrollTop && scrollTop > 100) {
        header.style.transform = 'translateY(-100%)';
    } else {
        header.style.transform = 'translateY(0)';
    }
   
    lastScrollTop = scrollTop;
});

const scrollTopBtn = document.getElementById('scroll-top');

if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

document.addEventListener('DOMContentLoaded', () => {
    const mainTitle = document.querySelector('.home_title');
    if (mainTitle) {
        const originalText = mainTitle.textContent;
        setTimeout(() => {
            typeWriter(mainTitle, originalText, 50);
        }, 500);
    }
});

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Consolidated scroll handler for better performance
const handleScroll = debounce(() => {
    scrollHeader();
    scrollUp();
    scrollActive();
    revealOnScroll();
}, 10);

window.addEventListener('scroll', handleScroll);