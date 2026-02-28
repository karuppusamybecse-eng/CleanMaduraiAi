import {
    auth, db, storage, provider, isFirebaseConfigured,
    signInWithPopup, signOut, onAuthStateChanged,
    collection, addDoc, getDocs, query, orderBy, serverTimestamp,
    ref, uploadBytes, getDownloadURL
} from './firebase-config.js';

// --- State ---
let currentUser = null;
let currentImageFile = null;
let currentLocation = null;
let currentClassification = null;

// --- DOM Elements ---
const DOM = {
    // Navigation
    navReportBtn: document.getElementById('navReportBtn'),
    navAdminBtn: document.getElementById('navAdminBtn'),

    // Auth
    loginBtn: document.getElementById('loginBtn'),
    heroLoginBtn: document.getElementById('heroLoginBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    userProfile: document.getElementById('userProfile'),
    userName: document.getElementById('userName'),
    userAvatar: document.getElementById('userAvatar'),

    // Sections
    sections: {
        welcome: document.getElementById('welcomeScreen'),
        report: document.getElementById('reportScreen'),
        admin: document.getElementById('adminScreen')
    },

    // Upload & Preview
    imageInput: document.getElementById('imageInput'),
    uploadCard: document.querySelector('.upload-card'),
    uploadPlaceholder: document.getElementById('uploadPlaceholder'),
    imagePreviewContainer: document.getElementById('imagePreviewContainer'),
    imagePreview: document.getElementById('imagePreview'),
    removeImageBtn: document.getElementById('removeImageBtn'),
    analysisOverlay: document.getElementById('analysisOverlay'),

    // Form Elements
    classificationResult: document.getElementById('classificationResult'),
    manualCategory: document.getElementById('manualCategory'),
    locationInput: document.getElementById('locationInput'),
    refreshLocationBtn: document.getElementById('refreshLocationBtn'),
    notesInput: document.getElementById('notesInput'),
    submitReportBtn: document.getElementById('submitReportBtn'),

    // Admin
    statTotal: document.getElementById('statTotal'),
    statPending: document.getElementById('statPending'),
    reportsTableBody: document.getElementById('reportsTableBody'),
    emptyState: document.getElementById('emptyState'),

    // Modals & Toasts
    successModal: document.getElementById('successModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toastMsg')
};

// --- Initialization ---
function init() {
    setupEventListeners();
    setupAuthListeners();
    fetchLocation();
}

// --- Navigation ---
function switchSection(sectionName) {
    if (!currentUser && sectionName !== 'welcome') {
        showToast("Please log in first", "warning");
        return;
    }

    Object.values(DOM.sections).forEach(sec => sec.classList.remove('active'));
    setTimeout(() => {
        Object.values(DOM.sections).forEach(sec => sec.classList.add('hidden'));
        DOM.sections[sectionName].classList.remove('hidden');

        // Force reflow
        void DOM.sections[sectionName].offsetWidth;

        DOM.sections[sectionName].classList.add('active');
    }, 300);

    // Update Nav Buttons
    DOM.navReportBtn.classList.toggle('active', sectionName === 'report');
    DOM.navAdminBtn.classList.toggle('active', sectionName === 'admin');

    if (sectionName === 'admin') {
        loadAdminReports();
    }
}

// --- Auth Handling ---
function setupAuthListeners() {
    if (isFirebaseConfigured && auth) {
        onAuthStateChanged(auth, (user) => {
            handleAuthState(user);
        });
    } else {
        // Mock Auth for UI demo mode
        console.warn("Firebase not configured. Running in UI Demo Mode.");
    }
}

function handleAuthState(user) {
    currentUser = user;
    if (user) {
        // Logged In
        DOM.loginBtn.classList.add('hidden');
        DOM.userProfile.classList.remove('hidden');
        DOM.userName.textContent = user.displayName || 'User';
        DOM.userAvatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=10B981&color=fff`;
        switchSection('report');
    } else {
        // Logged Out
        DOM.loginBtn.classList.remove('hidden');
        DOM.userProfile.classList.add('hidden');
        switchSection('welcome');
    }
}

async function login() {
    if (isFirebaseConfigured && auth) {
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error(error);
            showToast(error.message, "error");
        }
    } else {
        // Mock Login
        handleAuthState({
            uid: 'mock-123',
            displayName: 'Madurai Citizen',
            photoURL: ''
        });
        showToast("Logged in (Demo Mode)");
    }
}

async function logout() {
    if (isFirebaseConfigured && auth) {
        await signOut(auth);
    } else {
        // Mock Logout
        handleAuthState(null);
        showToast("Logged out");
    }
}

// --- File Handling & AI Mock ---
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
        showToast("Please upload an image file", "warning");
        return;
    }

    currentImageFile = file;

    // Show Preview
    const reader = new FileReader();
    reader.onload = (e) => {
        DOM.imagePreview.src = e.target.result;
        DOM.uploadPlaceholder.classList.add('hidden');
        DOM.imagePreviewContainer.classList.remove('hidden');

        simulateAIAnalysis();
    };
    reader.readAsDataURL(file);
}

function resetUpload() {
    currentImageFile = null;
    currentClassification = null;
    DOM.imageInput.value = '';
    DOM.imagePreview.src = '';
    DOM.uploadPlaceholder.classList.remove('hidden');
    DOM.imagePreviewContainer.classList.add('hidden');
    DOM.classificationResult.innerHTML = `<i class="ph ph-magic-wand"></i> Upload an image to analyze`;
    DOM.classificationResult.className = 'classification-box empty';
    DOM.manualCategory.classList.add('hidden');
    DOM.manualCategory.value = "";
    checkSubmitState();
}

function simulateAIAnalysis() {
    // Show Analyzing Overlay
    DOM.analysisOverlay.classList.remove('hidden');
    DOM.submitReportBtn.disabled = true;

    // Mock AI delay
    setTimeout(() => {
        DOM.analysisOverlay.classList.add('hidden');

        // Randomly pick a category for cool demo effect
        const categories = [
            { id: 'Plastic', class: 'plastic' },
            { id: 'Organic', class: 'organic' },
            { id: 'Metal', class: 'metal' },
            { id: 'E-waste', class: 'e-waste' },
            { id: 'Mixed Waste', class: 'mixed' }
        ];

        const result = categories[Math.floor(Math.random() * categories.length)];
        const confidence = (Math.random() * (98 - 85) + 85).toFixed(1);

        currentClassification = result.id;

        DOM.classificationResult.className = `classification-box`;
        DOM.classificationResult.innerHTML = `
            <span class="tag ${result.class}">${result.id}</span>
            <span class="text-sm success"><i class="ph-bold ph-check"></i> ${confidence}% Match</span>
        `;

        // Allow manual override
        DOM.manualCategory.classList.remove('hidden');
        DOM.manualCategory.value = result.id;

        showToast("AI Analysis Complete!");
        checkSubmitState();
    }, 2500);
}

document.getElementById('manualCategory').addEventListener('change', (e) => {
    currentClassification = e.target.value;
    const cleanClass = currentClassification.toLowerCase().replace(' ', '-');
    DOM.classificationResult.innerHTML = `
        <span class="tag ${cleanClass}">${currentClassification}</span>
        <span class="text-sm text-muted">Manually selected</span>
    `;
    checkSubmitState();
});

// --- Location ---
function fetchLocation() {
    DOM.locationInput.value = "Fetching GPS...";

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                // For a real app, use Reverse Geocoding API to get street name.
                // Here we mock a Madurai location for the MVP
                currentLocation = { lat: latitude, lng: longitude };

                // Mock Reverse Geo
                setTimeout(() => {
                    DOM.locationInput.value = "Goripalayam, Madurai (approx)";
                }, 1000);
            },
            (error) => {
                console.warn("Geolocation denied or failed", error);
                DOM.locationInput.value = "Location access denied. Please add notes.";
            }
        );
    } else {
        DOM.locationInput.value = "Geolocation not supported.";
    }
}

// --- Submit Report ---
function checkSubmitState() {
    const hasImage = !!currentImageFile;
    const hasClass = !!currentClassification;
    DOM.submitReportBtn.disabled = !(hasImage && hasClass);
}

async function submitReport() {
    if (!currentUser || !currentImageFile || !currentClassification) return;

    // UI state
    const originalText = DOM.submitReportBtn.innerHTML;
    DOM.submitReportBtn.innerHTML = '<i class="ph ph-spinner icon-spin"></i> Submitting...';
    DOM.submitReportBtn.disabled = true;

    try {
        let imageUrl = "mock_image_url.jpg";

        if (isFirebaseConfigured && storage && db) {
            // Upload Image
            const storageRef = ref(storage, `waste_images/${currentUser.uid}_${Date.now()}`);
            await uploadBytes(storageRef, currentImageFile);
            imageUrl = await getDownloadURL(storageRef);

            // Save to Firestore
            await addDoc(collection(db, "reports"), {
                userId: currentUser.uid,
                userName: currentUser.displayName,
                imageUrl: imageUrl,
                category: currentClassification,
                locationString: DOM.locationInput.value,
                coords: currentLocation,
                notes: DOM.notesInput.value,
                status: 'Pending',
                timestamp: serverTimestamp()
            });
        } else {
            // Demo mode: Delay simulation
            await new Promise(r => setTimeout(r, 1500));
            // Add to localStorage to persist across demo sessions
            const reports = JSON.parse(localStorage.getItem('demo_reports') || '[]');

            // Convert image to Base64 for local demo (WARNING: Not for prod, eats quota fast)
            const reader = new FileReader();
            imageUrl = await new Promise(resolve => {
                reader.onload = e => resolve(e.target.result);
                reader.readAsDataURL(currentImageFile);
            });

            reports.unshift({
                id: Date.now().toString(),
                userId: currentUser.uid,
                userName: currentUser.displayName,
                imageUrl,
                category: currentClassification,
                locationString: DOM.locationInput.value,
                notes: DOM.notesInput.value,
                status: 'Pending',
                timestamp: { seconds: Math.floor(Date.now() / 1000) }
            });
            localStorage.setItem('demo_reports', JSON.stringify(reports));
        }

        // Success
        DOM.successModal.classList.remove('hidden');

        // Reset form
        resetUpload();
        DOM.notesInput.value = '';

    } catch (error) {
        console.error("Submit Error:", error);
        showToast("Error submitting report. Try again.", "error");
    } finally {
        DOM.submitReportBtn.innerHTML = originalText;
        checkSubmitState();
    }
}

// --- Admin Section ---
async function loadAdminReports() {
    DOM.reportsTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center">Loading reports...</td></tr>';

    let reports = [];

    try {
        if (isFirebaseConfigured && db) {
            const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                reports.push({ id: doc.id, ...doc.data() });
            });
        } else {
            // Demo Mode
            reports = JSON.parse(localStorage.getItem('demo_reports') || '[]');
        }

        renderAdminTable(reports);
    } catch (err) {
        console.error("Admin Load Error", err);
        DOM.reportsTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--danger)">Failed to load data</td></tr>';
    }
}

function renderAdminTable(reports) {
    DOM.statTotal.textContent = reports.length;
    DOM.statPending.textContent = reports.filter(r => r.status === 'Pending').length;

    if (reports.length === 0) {
        DOM.reportsTableBody.innerHTML = '';
        DOM.emptyState.classList.remove('hidden');
        DOM.document.querySelector('.data-table').classList.add('hidden');
        return;
    }

    DOM.emptyState.classList.add('hidden');
    document.querySelector('.data-table').classList.remove('hidden');

    DOM.reportsTableBody.innerHTML = reports.map(report => {
        const dateObj = report.timestamp?.seconds ? new Date(report.timestamp.seconds * 1000) : new Date();
        const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const catClass = report.category.toLowerCase().replace(' ', '-');

        return `
            <tr>
                <td><img src="${report.imageUrl}" class="td-img" alt="Waste" onerror="this.src='https://via.placeholder.com/60?text=No+Image'"></td>
                <td><span class="tag ${catClass}">${report.category}</span></td>
                <td>
                    <div style="font-weight: 500">${report.locationString}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted)">By ${report.userName}</div>
                </td>
                <td style="font-size: 0.875rem;">${dateStr}</td>
                <td><span class="status ${report.status.toLowerCase()}">${report.status}</span></td>
                <td>
                    ${report.status === 'Pending'
                ? `<button class="btn btn-outline btn-small" onclick="alert('In a real app, this would update Firestore status to Resolved.')">Resolve</button>`
                : `<span class="text-muted"><i class="ph ph-check"></i> Done</span>`}
                </td>
            </tr>
        `;
    }).join('');
}


// --- Utility / UI ---
function showToast(message, type = 'info') {
    DOM.toastMsg.textContent = message;

    // Reset classes
    DOM.toast.className = 'toast show';
    const icon = DOM.toast.querySelector('i');

    if (type === 'error') {
        DOM.toast.style.borderColor = 'var(--danger)';
        icon.className = 'ph-fill ph-warning-circle danger';
    } else if (type === 'warning') {
        DOM.toast.style.borderColor = 'var(--warning)';
        icon.className = 'ph-fill ph-warning danger'; // Fallback to orange-ish
        icon.style.color = 'var(--warning)';
    } else {
        DOM.toast.style.borderColor = 'var(--primary)';
        icon.className = 'ph-fill ph-check-circle success';
    }

    setTimeout(() => {
        DOM.toast.classList.remove('show');
    }, 3000);
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    // Navigation
    DOM.navReportBtn.addEventListener('click', () => switchSection('report'));
    DOM.navAdminBtn.addEventListener('click', () => switchSection('admin'));

    // Auth
    DOM.loginBtn.addEventListener('click', login);
    DOM.heroLoginBtn.addEventListener('click', login);
    DOM.logoutBtn.addEventListener('click', logout);

    // Upload Area (Click & Drag-Drop)
    DOM.uploadCard.addEventListener('click', (e) => {
        if (!e.target.closest('#removeImageBtn')) {
            DOM.imageInput.click();
        }
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        DOM.uploadCard.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

    ['dragenter', 'dragover'].forEach(eventName => {
        DOM.uploadCard.addEventListener(eventName, () => DOM.uploadCard.style.borderColor = 'var(--primary)', false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        DOM.uploadCard.addEventListener(eventName, () => DOM.uploadCard.style.borderColor = 'rgba(255,255,255,0.2)', false);
    });

    DOM.uploadCard.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) {
            DOM.imageInput.files = files; // Hack for native input
            handleFileSelect({ target: { files: files } });
        }
    });

    DOM.imageInput.addEventListener('change', handleFileSelect);
    DOM.removeImageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetUpload();
    });

    DOM.refreshLocationBtn.addEventListener('click', fetchLocation);
    DOM.submitReportBtn.addEventListener('click', submitReport);

    DOM.closeModalBtn.addEventListener('click', () => {
        DOM.successModal.classList.add('hidden');
        switchSection('admin'); // Go to admin to see report
    });
}

// Boot
document.addEventListener('DOMContentLoaded', init);
