// Workshop Application State
let workshopState = {
    currentSection: 'setup',
    timer: {
        seconds: 0,
        isRunning: false,
        interval: null
    },
    sessionDurations: {
        setup: 5 * 60,
        session1: 45 * 60,
        session2: 40 * 60,
        session3: 20 * 60,
        session4: 15 * 60
    },
    data: {}
};

// DOM Elements
const navTabs = document.querySelectorAll('.nav-tab');
const sections = document.querySelectorAll('.workshop-section');
const timerDisplay = document.getElementById('timer');
const startTimerBtn = document.getElementById('startTimer');
const resetTimerBtn = document.getElementById('resetTimer');
const progressFill = document.getElementById('progressFill');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeTimer();
    initializeDragAndDrop();
    initializeAutoSave();
    initializeInteractiveElements();
    addHelpSystem();
    enhanceDragAndDrop();
});

// Navigation functionality
function initializeNavigation() {
    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            switchSection(targetSection);
        });
    });
    
    updateProgress();
}

function switchSection(sectionId) {
    // Update active states
    navTabs.forEach(tab => tab.classList.remove('active'));
    sections.forEach(section => section.classList.remove('active'));
    
    // Show target section
    const targetTab = document.querySelector(`[data-section="${sectionId}"]`);
    const targetSection = document.getElementById(sectionId);
    
    if (targetTab && targetSection) {
        targetTab.classList.add('active');
        targetSection.classList.add('active');
        workshopState.currentSection = sectionId;
        
        // Reset timer for new section
        resetTimer();
        updateProgress();
        
        // Scroll to top when switching sections
        window.scrollTo(0, 0);
    }
}

// Timer functionality
function initializeTimer() {
    startTimerBtn.addEventListener('click', startTimer);
    resetTimerBtn.addEventListener('click', resetTimer);
    updateTimerDisplay();
}

function startTimer() {
    if (workshopState.timer.isRunning) {
        pauseTimer();
    } else {
        workshopState.timer.isRunning = true;
        startTimerBtn.textContent = 'Pause';
        
        workshopState.timer.interval = setInterval(() => {
            workshopState.timer.seconds++;
            updateTimerDisplay();
        }, 1000);
    }
}

function pauseTimer() {
    workshopState.timer.isRunning = false;
    startTimerBtn.textContent = 'Start';
    if (workshopState.timer.interval) {
        clearInterval(workshopState.timer.interval);
        workshopState.timer.interval = null;
    }
}

function resetTimer() {
    // Always pause first
    pauseTimer();
    
    // Reset seconds to 0
    workshopState.timer.seconds = 0;
    
    // Update button text
    startTimerBtn.textContent = 'Start';
    
    // Update display
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(workshopState.timer.seconds / 60);
    const seconds = workshopState.timer.seconds % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateProgress() {
    const sections = ['setup', 'session1', 'session2', 'session3', 'session4', 'deliverables'];
    const currentIndex = sections.indexOf(workshopState.currentSection);
    const progress = ((currentIndex + 1) / sections.length) * 100;
    progressFill.style.width = `${progress}%`;
}

// Enhanced Drag and Drop functionality
function initializeDragAndDrop() {
    // Initialize all draggable elements
    updateDraggableElements();
    
    // Set up drop zones
    const dropZones = document.querySelectorAll('.drop-zone, .priority-list, .flow-workspace, .service-list');
    
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('drop', handleDrop);
        zone.addEventListener('dragenter', handleDragEnter);
        zone.addEventListener('dragleave', handleDragLeave);
    });
}

function updateDraggableElements() {
    const draggableItems = document.querySelectorAll('.draggable-item, .service-item, .flow-element');
    
    draggableItems.forEach(item => {
        // Remove existing listeners to avoid duplicates
        item.removeEventListener('dragstart', handleDragStart);
        item.removeEventListener('dragend', handleDragEnd);
        
        // Add fresh listeners
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        
        // Ensure draggable attribute is set
        item.draggable = true;
    });
}

function handleDragStart(e) {
    const draggedElement = e.target;
    
    // Store element data
    e.dataTransfer.setData('text/plain', draggedElement.textContent.trim());
    e.dataTransfer.setData('text/html', draggedElement.outerHTML);
    e.dataTransfer.setData('element-id', draggedElement.id || Date.now().toString());
    
    // Visual feedback
    draggedElement.classList.add('dragging');
    draggedElement.style.opacity = '0.5';
    
    // Store reference to original element
    window.draggedElement = draggedElement;
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    e.target.style.opacity = '1';
    window.draggedElement = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    if (e.target.classList.contains('drop-zone') || 
        e.target.classList.contains('priority-list') || 
        e.target.classList.contains('flow-workspace') ||
        e.target.classList.contains('service-list')) {
        e.target.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
        e.currentTarget.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    
    const dropZone = e.currentTarget;
    dropZone.classList.remove('drag-over');
    
    const draggedHTML = e.dataTransfer.getData('text/html');
    const draggedText = e.dataTransfer.getData('text/plain');
    
    if (draggedHTML && draggedText && window.draggedElement) {
        // Check if this is a valid drop zone
        if (dropZone.classList.contains('drop-zone') || 
            dropZone.classList.contains('priority-list') || 
            dropZone.classList.contains('flow-workspace') ||
            dropZone.classList.contains('service-list')) {
            
            // For priority lists, limit to 3 items
            if (dropZone.classList.contains('priority-list')) {
                const existingItems = dropZone.querySelectorAll('.service-item, .draggable-item');
                if (existingItems.length >= 3) {
                    showNotification('Priority list can only hold 3 items', 'warning');
                    return;
                }
            }
            
            // Remove placeholder text if it exists
            const placeholder = dropZone.querySelector('.placeholder-text');
            if (placeholder) {
                placeholder.remove();
            }
            
            // Create new element or move existing
            let newElement;
            if (window.draggedElement.parentNode === dropZone) {
                // Already in this container, just reorder
                return;
            } else {
                // Clone the element for the new location
                newElement = window.draggedElement.cloneNode(true);
                
                // Remove original if moving from another drop zone
                if (window.draggedElement.closest('.drop-zone, .priority-list, .flow-workspace, .service-list')) {
                    window.draggedElement.remove();
                }
            }
            
            // Add to new location
            dropZone.appendChild(newElement);
            
            // Re-initialize drag and drop for new element
            newElement.draggable = true;
            newElement.addEventListener('dragstart', handleDragStart);
            newElement.addEventListener('dragend', handleDragEnd);
            
            // Reset styles
            newElement.classList.remove('dragging');
            newElement.style.opacity = '1';
            
            showAutoSaveIndicator();
        }
    }
}

// Enhanced Auto-save functionality
function initializeAutoSave() {
    const textInputs = document.querySelectorAll('textarea, input[type="text"], select');
    
    textInputs.forEach(input => {
        input.addEventListener('input', debounce(function() {
            saveData(input);
            showAutoSaveIndicator();
        }, 500)); // Reduced delay for better responsiveness
        
        input.addEventListener('change', function() {
            saveData(input);
            showAutoSaveIndicator();
        });
    });
    
    // Create auto-save indicator if it doesn't exist
    if (!document.querySelector('.auto-save-indicator')) {
        const indicator = document.createElement('div');
        indicator.className = 'auto-save-indicator';
        indicator.textContent = '✓ Saved';
        document.body.appendChild(indicator);
    }
}

function saveData(input) {
    const section = input.closest('.workshop-section')?.id || 'unknown';
    const fieldName = input.placeholder || input.name || input.id || 'field';
    
    if (!workshopState.data[section]) {
        workshopState.data[section] = {};
    }
    
    workshopState.data[section][fieldName] = input.value;
}

function showAutoSaveIndicator() {
    const indicator = document.querySelector('.auto-save-indicator');
    if (indicator) {
        indicator.classList.add('show');
        
        setTimeout(() => {
            indicator.classList.remove('show');
        }, 2000);
    }
}

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

// Interactive Elements
function initializeInteractiveElements() {
    initializeCheckboxes();
    initializeSelects();
    initializeRadioButtons();
    initializeExportButtons();
}

function initializeCheckboxes() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            saveData(this);
            updateChecklistProgress();
            showAutoSaveIndicator();
        });
    });
}

function updateChecklistProgress() {
    const checkboxes = document.querySelectorAll('#setup input[type="checkbox"]');
    const checkedBoxes = document.querySelectorAll('#setup input[type="checkbox"]:checked');
    const progress = (checkedBoxes.length / checkboxes.length) * 100;
    
    // Update nav tab to show completion
    if (progress === 100) {
        const setupTab = document.querySelector('[data-section="setup"]');
        if (setupTab && !setupTab.textContent.includes('✓')) {
            setupTab.textContent = '✓ ' + setupTab.textContent;
        }
    }
}

function initializeSelects() {
    const selects = document.querySelectorAll('select');
    
    selects.forEach(select => {
        select.addEventListener('change', function() {
            saveData(this);
            showAutoSaveIndicator();
        });
    });
}

function initializeRadioButtons() {
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            saveData(this);
            showAutoSaveIndicator();
        });
    });
}

function initializeExportButtons() {
    // Wait a moment for DOM to be fully ready
    setTimeout(() => {
        const exportButtons = document.querySelectorAll('.deliverable-item button');
        
        exportButtons.forEach(button => {
            button.addEventListener('click', function() {
                const deliverableType = this.closest('.deliverable-item').querySelector('h4').textContent;
                exportSpecificDeliverable(deliverableType);
            });
        });
    }, 100);
}

// Export functionality
function exportSpecificDeliverable(type) {
    let content = '';
    
    switch(type) {
        case 'Client Archetype Profiles':
            content = generateArchetypeProfiles();
            break;
        case 'Service-Stage Mapping':
            content = generateServiceMapping();
            break;
        case 'Website Structure Blueprint':
            content = generateWebsiteBlueprint();
            break;
        case 'Messaging Framework':
            content = generateMessagingFramework();
            break;
        default:
            content = generateFullWorkshopSummary();
    }
    
    const blob = new Blob([content], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type.toLowerCase().replace(/\s+/g, '-')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification(`${type} exported successfully!`, 'success');
}

function generateArchetypeProfiles() {
    let content = 'CLIENT ARCHETYPE PROFILES\n';
    content += '========================\n\n';
    
    const archetypes = ['Newly Funded Scientist', 'Incubator Graduate', 'Scaling Biotech CEO'];
    
    archetypes.forEach(archetype => {
        content += `${archetype.toUpperCase()}\n`;
        content += '-'.repeat(archetype.length) + '\n';
        
        const cards = document.querySelectorAll('.archetype-card');
        cards.forEach(card => {
            if (card.querySelector('h4').textContent === archetype) {
                const textareas = card.querySelectorAll('textarea');
                content += `Language: ${textareas[0]?.value || 'Not defined'}\n`;
                content += `Fears: ${textareas[1]?.value || 'Not defined'}\n`;
                content += `Goals: ${textareas[2]?.value || 'Not defined'}\n\n`;
            }
        });
    });
    
    return content;
}

function generateServiceMapping() {
    let content = 'SERVICE-STAGE MAPPING\n';
    content += '====================\n\n';
    
    const stages = ['pre-funding', 'first-office', 'scaling'];
    const stageNames = ['Incubator/Pre-Funding', 'Newly Funded/First Office', 'Ready to Scale'];
    
    stages.forEach((stage, index) => {
        content += `${stageNames[index].toUpperCase()}\n`;
        content += '-'.repeat(stageNames[index].length) + '\n';
        
        const priorityList = document.getElementById(`priority-${stage}`);
        if (priorityList) {
            const items = priorityList.querySelectorAll('.service-item, .draggable-item');
            items.forEach((item, itemIndex) => {
                content += `${itemIndex + 1}. ${item.textContent}\n`;
            });
        }
        content += '\n';
    });
    
    return content;
}

function generateWebsiteBlueprint() {
    let content = 'WEBSITE STRUCTURE BLUEPRINT\n';
    content += '===========================\n\n';
    
    content += 'Homepage Flow:\n';
    const flowWorkspace = document.getElementById('flowWorkspace');
    if (flowWorkspace) {
        const elements = flowWorkspace.querySelectorAll('.flow-element');
        elements.forEach((element, index) => {
            content += `${index + 1}. ${element.textContent}\n`;
        });
    }
    
    content += '\nCase Study Alignment:\n';
    const caseStudyItems = document.querySelectorAll('.case-study-item');
    caseStudyItems.forEach(item => {
        const name = item.querySelector('span').textContent;
        const select = item.querySelector('select');
        const archetype = select.options[select.selectedIndex]?.text || 'Not selected';
        content += `${name} → ${archetype}\n`;
    });
    
    return content;
}

function generateMessagingFramework() {
    let content = 'MESSAGING FRAMEWORK\n';
    content += '==================\n\n';
    
    const radioButtons = document.querySelectorAll('input[type="radio"]:checked');
    radioButtons.forEach(radio => {
        const label = document.querySelector(`label[for="${radio.id}"]`);
        if (label) {
            content += `Selected: ${label.textContent}\n`;
        }
    });
    
    const customHeadlines = document.querySelectorAll('.custom-headline input');
    customHeadlines.forEach(input => {
        if (input.value) {
            content += `Custom: ${input.value}\n`;
        }
    });
    
    content += '\nValidation Responses:\n';
    const validationTextareas = document.querySelectorAll('.validation-questions textarea');
    validationTextareas.forEach((textarea, index) => {
        const label = textarea.closest('.form-group')?.querySelector('.form-label')?.textContent || 'Question';
        content += `${label}: ${textarea.value || 'Not answered'}\n`;
    });
    
    return content;
}

function generateFullWorkshopSummary() {
    let content = 'FULL WORKSHOP SUMMARY\n';
    content += '====================\n\n';
    content += `Date: ${new Date().toLocaleDateString()}\n`;
    content += `Duration: ${formatTime(workshopState.timer.seconds)}\n\n`;
    
    content += generateArchetypeProfiles() + '\n\n';
    content += generateServiceMapping() + '\n\n';
    content += generateWebsiteBlueprint() + '\n\n';
    content += generateMessagingFramework();
    
    return content;
}

// Enhanced Drag and Drop with visual feedback
function enhanceDragAndDrop() {
    // Add ghost image for better drag feedback
    document.addEventListener('dragstart', function(e) {
        if (e.target.classList.contains('draggable-item') || 
            e.target.classList.contains('service-item') || 
            e.target.classList.contains('flow-element')) {
            
            e.target.style.opacity = '0.5';
            
            // Create custom drag image
            const dragImage = e.target.cloneNode(true);
            dragImage.style.transform = 'rotate(5deg)';
            dragImage.style.opacity = '0.8';
            document.body.appendChild(dragImage);
            
            setTimeout(() => {
                if (dragImage.parentNode) {
                    dragImage.parentNode.removeChild(dragImage);
                }
            }, 0);
        }
    });
    
    document.addEventListener('dragend', function(e) {
        if (e.target.classList.contains('draggable-item') || 
            e.target.classList.contains('service-item') || 
            e.target.classList.contains('flow-element')) {
            e.target.style.opacity = '1';
        }
    });
}

// Add help system
function addHelpSystem() {
    const helpTexts = {
        'setup': 'Review all materials before starting the workshop sessions.',
        'session1': 'Focus on understanding your clients as real people with authentic concerns.',
        'session2': 'Align your services with what clients actually need at each stage.',
        'session3': 'Translate insights into practical website structure and navigation.',
        'session4': 'Test and refine your messaging to resonate with each archetype.',
        'deliverables': 'Review and export your workshop outcomes and next steps.'
    };
    
    navTabs.forEach(tab => {
        const section = tab.getAttribute('data-section');
        if (helpTexts[section]) {
            tab.title = helpTexts[section];
        }
    });
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background-color: var(--color-${type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info'});
        color: var(--color-btn-primary-text);
        padding: var(--space-12) var(--space-16);
        border-radius: var(--radius-base);
        box-shadow: var(--shadow-lg);
        z-index: 1001;
        opacity: 0;
        transform: translateX(100%);
        transition: all var(--duration-normal) var(--ease-standard);
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Format time utility
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Alt + number keys to switch sections
    if (e.altKey && e.key >= '1' && e.key <= '6') {
        e.preventDefault();
        const sectionIndex = parseInt(e.key) - 1;
        const sections = ['setup', 'session1', 'session2', 'session3', 'session4', 'deliverables'];
        if (sections[sectionIndex]) {
            switchSection(sections[sectionIndex]);
        }
    }
    
    // Space to start/pause timer (only if not in input field)
    if (e.code === 'Space' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        startTimer();
    }
});

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure all elements are rendered
    setTimeout(() => {
        updateDraggableElements();
        initializeExportButtons();
        
        // Show welcome message
        showNotification('Workshop space is ready! Use Alt+1-6 to navigate sections.', 'success');
    }, 200);
});