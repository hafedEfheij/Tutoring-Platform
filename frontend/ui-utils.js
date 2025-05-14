/**
 * UI Utilities for TutorConnect
 * Provides common UI components and utilities for a better user experience
 */

// Initialize global namespace
window.TutorConnect = window.TutorConnect || {};

// UI utilities module
window.TutorConnect.ui = {
    // Toast notification system
    toast: {
        // Show a toast notification
        show: function(message, type = 'info', duration = 3000) {
            // Create toast container if it doesn't exist
            let container = document.getElementById('toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'toast-container';
                document.body.appendChild(container);
            }
            
            // Create toast element
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'assertive');
            
            // Add icon based on type
            let icon = '';
            switch (type) {
                case 'success':
                    icon = '✓';
                    break;
                case 'error':
                    icon = '✗';
                    break;
                case 'warning':
                    icon = '⚠';
                    break;
                default:
                    icon = 'ℹ';
            }
            
            // Set toast content
            toast.innerHTML = `
                <div class="toast-icon">${icon}</div>
                <div class="toast-message">${message}</div>
                <button class="toast-close" aria-label="Close notification">×</button>
            `;
            
            // Add to container
            container.appendChild(toast);
            
            // Add close button event listener
            const closeBtn = toast.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => {
                this.dismiss(toast);
            });
            
            // Automatically dismiss after duration
            setTimeout(() => {
                this.dismiss(toast);
            }, duration);
            
            // Return toast element for potential further manipulation
            return toast;
        },
        
        // Dismiss a toast notification
        dismiss: function(toast) {
            if (!toast) return;
            
            // Add dismissing class for animation
            toast.classList.add('dismissing');
            
            // Remove after animation completes
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
                
                // Remove container if empty
                const container = document.getElementById('toast-container');
                if (container && container.children.length === 0) {
                    document.body.removeChild(container);
                }
            }, 300); // Match the CSS transition duration
        }
    },
    
    // Loading indicator
    loader: {
        // Show a loading indicator
        show: function(message = 'Loading...', target = null) {
            // Create loader element
            const loader = document.createElement('div');
            loader.className = 'loader-container';
            loader.setAttribute('role', 'status');
            loader.setAttribute('aria-live', 'polite');
            
            loader.innerHTML = `
                <div class="loader-spinner"></div>
                <div class="loader-message">${message}</div>
            `;
            
            // If target is provided, append to target and make it relative
            if (target) {
                target.style.position = 'relative';
                target.appendChild(loader);
            } else {
                // Otherwise, append to body and make it fixed
                loader.classList.add('loader-fixed');
                document.body.appendChild(loader);
            }
            
            // Return loader element for later reference
            return loader;
        },
        
        // Hide a loading indicator
        hide: function(loader) {
            if (!loader) return;
            
            // Add dismissing class for animation
            loader.classList.add('dismissing');
            
            // Remove after animation completes
            setTimeout(() => {
                if (loader.parentNode) {
                    loader.parentNode.removeChild(loader);
                }
            }, 300); // Match the CSS transition duration
        }
    },
    
    // Modal dialog
    modal: {
        // Show a modal dialog
        show: function(options) {
            const {
                title = '',
                content = '',
                buttons = [],
                size = 'medium',
                closable = true,
                onClose = null
            } = options;
            
            // Create modal container
            const modal = document.createElement('div');
            modal.className = `modal-container modal-${size}`;
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            if (title) {
                modal.setAttribute('aria-labelledby', 'modal-title');
            }
            
            // Create modal content
            let modalHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        ${title ? `<h2 id="modal-title">${title}</h2>` : ''}
                        ${closable ? `<button class="modal-close" aria-label="Close modal">&times;</button>` : ''}
                    </div>
                    <div class="modal-body">
                        ${typeof content === 'string' ? content : ''}
                    </div>
            `;
            
            // Add buttons if provided
            if (buttons.length > 0) {
                modalHTML += `<div class="modal-footer">`;
                buttons.forEach((button, index) => {
                    const { text, type = 'default', id = `modal-btn-${index}` } = button;
                    modalHTML += `<button id="${id}" class="btn btn-${type}">${text}</button>`;
                });
                modalHTML += `</div>`;
            }
            
            modalHTML += `</div>`;
            modal.innerHTML = modalHTML;
            
            // If content is a DOM element, append it to the body
            if (typeof content !== 'string' && content instanceof Element) {
                modal.querySelector('.modal-body').appendChild(content);
            }
            
            // Add to document
            document.body.appendChild(modal);
            
            // Store original focus
            const previouslyFocusedElement = document.activeElement;
            
            // Set up focus trap
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length > 0) {
                // Focus first element
                focusableElements[0].focus();
                
                // Set up focus trap
                modal.addEventListener('keydown', (e) => {
                    if (e.key === 'Tab') {
                        const firstElement = focusableElements[0];
                        const lastElement = focusableElements[focusableElements.length - 1];
                        
                        if (e.shiftKey) {
                            if (document.activeElement === firstElement) {
                                lastElement.focus();
                                e.preventDefault();
                            }
                        } else {
                            if (document.activeElement === lastElement) {
                                firstElement.focus();
                                e.preventDefault();
                            }
                        }
                    }
                });
            }
            
            // Close modal function
            const closeModal = () => {
                // Remove modal
                document.body.removeChild(modal);
                
                // Restore focus
                if (previouslyFocusedElement) {
                    previouslyFocusedElement.focus();
                }
                
                // Call onClose callback if provided
                if (typeof onClose === 'function') {
                    onClose();
                }
            };
            
            // Add event listeners for close button
            if (closable) {
                const closeBtn = modal.querySelector('.modal-close');
                closeBtn.addEventListener('click', closeModal);
                
                // Close on escape key
                modal.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        closeModal();
                    }
                });
                
                // Close on click outside
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        closeModal();
                    }
                });
            }
            
            // Add event listeners for buttons
            buttons.forEach((button, index) => {
                const { onClick } = button;
                const id = button.id || `modal-btn-${index}`;
                const buttonElement = modal.querySelector(`#${id}`);
                
                if (buttonElement && typeof onClick === 'function') {
                    buttonElement.addEventListener('click', (e) => {
                        onClick(e, closeModal);
                    });
                }
            });
            
            // Return modal element and close function
            return {
                element: modal,
                close: closeModal
            };
        }
    }
};
