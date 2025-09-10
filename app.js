// AyurSutra - Panchakarma Management Platform (Backend Integrated)

// ---- API Helpers ----
async function apiGet(path) {
    const res = await fetch(`http://localhost:5000/api/${path}`);
    if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
    }
    return res.json();
}

async function apiPost(path, data) {
    const res = await fetch(`http://localhost:5000/api/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
    }
    return res.json();
}

async function apiPut(path, data) {
    const res = await fetch(`http://localhost:5000/api/${path}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
    }
    return res.json();
}

async function apiDelete(path) {
    const res = await fetch(`http://localhost:5000/api/${path}`, {
        method: "DELETE",
    });
    if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
    }
    return res.json();
}

class AyurSutraApp {
    constructor() {
        this.currentUser = null;
        this.currentRole = null;
        this.currentView = 'dashboard';
        this.charts = {};
        this.realtimeDashboardInterval = null;

        this.init();
    }

    init() {
        this.showLoading();
        setTimeout(() => {
            this.hideLoading();
            this.setupEventListeners();
            this.showRoleSelection();
        }, 1500);
    }

    showLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.style.display = 'flex';
    }

    hideLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.style.display = 'none';
    }

    showRoleSelection() {
        const roleSelection = document.getElementById('roleSelection');
        const mainApp = document.getElementById('mainApp');

        if (roleSelection) roleSelection.style.display = 'flex';
        if (mainApp) mainApp.classList.add('hidden');
    }

    setupEventListeners() {
        // Role selection - Fix button click handlers
        document.querySelectorAll('.role-card').forEach(card => {
            const button = card.querySelector('button');
            if (button) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const role = card.dataset.role;
                    this.selectRole(role);
                });
            }

            // Also handle card click
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const role = card.dataset.role;
                this.selectRole(role);
            });
        });

        // Navigation - Fix menu item handlers
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                if (view) {
                    this.showView(view);
                }
            });
        });

        // Top navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.dataset.view;
                if (view) {
                    this.showView(view);
                }
            });
        });

        // Role change
        const roleChangeBtn = document.getElementById('roleChangeBtn');
        if (roleChangeBtn) {
            roleChangeBtn.addEventListener('click', () => {
                this.showRoleSelection();
            });
        }

        // Notifications
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleNotificationPanel();
            });
        }

        // Modal handlers
        this.setupModalHandlers();

        // Form handlers
        this.setupFormHandlers();

        // Tab handlers
        this.setupTabHandlers();

        // Close notification panel handler
        const panelClose = document.querySelector('.panel-close');
        if (panelClose) {
            panelClose.addEventListener('click', () => {
                const panel = document.getElementById('notificationPanel');
                if (panel) panel.classList.add('hidden');
            });
        }

        // Quick Schedule form submission
        const quickScheduleForm = document.getElementById('quickScheduleForm');
        if (quickScheduleForm) {
            quickScheduleForm.addEventListener('submit', async(e) => {
                e.preventDefault();
                const patientId = document.getElementById('schedulePatient').value;
                const therapyName = document.getElementById('scheduleTherapy').value;
                const date = document.getElementById('scheduleDate').value;
                this.showAISchedulingSuggestions(patientId, therapyName, date);
            });
        }
    }

    selectRole(role) {
        console.log('Selecting role:', role);
        this.currentRole = role;
        this.currentUser = this.getUserForRole(role);

        const roleSelection = document.getElementById('roleSelection');
        const mainApp = document.getElementById('mainApp');

        if (roleSelection) roleSelection.style.display = 'none';
        if (mainApp) mainApp.classList.remove('hidden');

        this.updateUserInterface();
        this.showView('dashboard');
        setTimeout(() => {
            this.initializeCharts();
        }, 100);
    }

    getUserForRole(role) {
        const users = {
            patient: { name: "Rajesh Kumar", id: "P001", avatar: "👤" },
            practitioner: { name: "Dr. Anil Gupta", id: "D001", avatar: "👨‍⚕️" },
            admin: { name: "Admin User", id: "A001", avatar: "👨‍💼" }
        };
        return users[role];
    }

    updateUserInterface() {
        const userName = document.getElementById('userName');
        if (userName) userName.textContent = this.currentUser.name;

        // Update navigation based on role
        this.updateNavigationForRole();

        // Update dashboard stats based on role
        this.updateDashboardStats();
    }

    updateNavigationForRole() {
        const isPatient = this.currentRole === 'patient';
        // Show/hide menu items based on role
        if (isPatient) {
            this.hideMenuItems(['patients', 'analytics', 'therapies']);
        } else {
            this.showAllMenuItems();
        }
    }

    hideMenuItems(items) {
        items.forEach(item => {
            const menuItem = document.querySelector(`.menu-item[data-view="${item}"]`);
            if (menuItem) menuItem.style.display = 'none';
        });
    }

    showAllMenuItems() {
        document.querySelectorAll('.menu-item').forEach(item => {
            item.style.display = 'flex';
        });
    }

    async updateDashboardStats() {
        try {
            const patients = await apiGet('patients');
            const totalPatientsEl = document.getElementById('totalPatients');
            if (totalPatientsEl) totalPatientsEl.textContent = patients.length;

            // Placeholder for other stats until backend endpoints are ready
            const todayAppointmentsEl = document.getElementById('todayAppointments');
            if (todayAppointmentsEl) todayAppointmentsEl.textContent = '12';

            const activeTherapiesEl = document.getElementById('activeTherapies');
            if (activeTherapiesEl) activeTherapiesEl.textContent = '45';

            const successRateEl = document.getElementById('successRate');
            if (successRateEl) successRateEl.textContent = '92%';
        } catch (err) {
            console.error('Failed to load dashboard stats:', err);
        }
    }

    showView(viewName) {
        console.log('Showing view:', viewName);

        // Stop real-time updates if leaving dashboard
        if (this.currentView === 'dashboard') {
            this.stopRealtimeUpdates();
        }

        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
            view.classList.add('hidden');
        });

        // Show selected view
        const targetView = document.getElementById(`${viewName}View`);
        if (targetView) {
            targetView.classList.add('active');
            targetView.classList.remove('hidden');
        }

        // Update navigation active states
        document.querySelectorAll('.menu-item, .nav-link').forEach(item => {
            item.classList.remove('active');
        });

        document.querySelectorAll(`[data-view="${viewName}"]`).forEach(item => {
            item.classList.add('active');
        });

        this.currentView = viewName;

        // Load view-specific data
        setTimeout(() => {
            this.loadViewData(viewName);
        }, 50);
    }

    loadViewData(viewName) {
        console.log('Loading data for view:', viewName);

        switch (viewName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'patients':
                this.loadPatients();
                break;
            case 'schedule':
                this.loadSchedule();
                break;
            case 'notifications':
                this.loadNotifications();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
            case 'therapies':
                this.loadTherapies();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    loadDashboard() {
        // Initial data load
        this.loadUpcomingAppointments();
        this.updateProgressChart();

        // Start real-time updates for dashboard
        this.startRealtimeUpdates();
    }

    stopRealtimeUpdates() {
        if (this.realtimeDashboardInterval) {
            clearInterval(this.realtimeDashboardInterval);
            this.realtimeDashboardInterval = null;
        }
    }

    async loadUpcomingAppointments() {
        const container = document.getElementById('upcomingAppointments');
        if (!container) return;

        // Fetch live data from backend
        try {
            const patients = await apiGet('patients');
            const appointments = patients.filter(p => p.nextAppointment).slice(0, 3); // Show max 3 appointments
            container.innerHTML = appointments.map(apt => `
                <div class="appointment-item">
                    <div class="appointment-info">
                        <h4>${apt.name}</h4>
                        <p>Next Appointment: ${new Date(apt.nextAppointment).toLocaleDateString()}</p>
                    </div>
                    <div class="appointment-time">Soon</div>
                </div>
            `).join('');
        } catch (err) {
            console.error('Failed to load appointments:', err);
            container.innerHTML = '<p class="text-muted">Failed to load appointments.</p>';
        }
    }

    // ---------------- Patients ----------------
    async loadPatients() {
        const container = document.getElementById("patientsList");
        if (!container) return;

        const isPatient = this.currentRole === 'patient';
        let patients = [];
        try {
            patients = await apiGet("patients");
        } catch (err) {
            console.error('Failed to fetch patients:', err);
            container.innerHTML = '<p class="text-muted">Failed to load patients.</p>';
            return;
        }

        // Clear existing content and old listeners
        container.innerHTML = "";
        
        // Check if the current user is a patient and only display their own data
        if (isPatient && this.currentUser) {
            patients = patients.filter(p => p.id === this.currentUser.id);
        }

        const patientCards = patients.map(
            (patient) => {
                const actions = isPatient ? '' : `
                    <div class="card-actions">
                        <button class="btn btn--sm btn--primary" data-action="view" data-id="${patient._id}">View Details</button>
                        <button class="btn btn--sm btn--outline" data-action="edit" data-id="${patient._id}">Edit</button>
                        <button class="btn btn--sm btn--danger" data-action="delete" data-id="${patient._id}">Delete</button>
                    </div>
                `;
                return `
                    <div class="patient-card" data-id="${patient._id}">
                        <div class="patient-header">
                            <div>
                                <div class="patient-name">${patient.name}</div>
                                <div class="patient-id">${patient._id}</div>
                            </div>
                            <div class="status status--${
                                patient.progress > 70
                                    ? "success"
                                    : patient.progress > 40
                                    ? "warning"
                                    : "info"
                            }">
                                ${patient.progress || 0}% Complete
                            </div>
                        </div>
                        <div class="patient-body">
                            <div class="patient-info">
                                <div class="info-item"><div class="info-label">Age</div><div class="info-value">${patient.age} years</div></div>
                                <div class="info-item"><div class="info-label">Dosha</div><div class="info-value">${patient.dosha}</div></div>
                                <div class="info-item"><div class="info-label">Condition</div><div class="info-value">${patient.condition}</div></div>
                                <div class="info-item"><div class="info-label">Next Appointment</div><div class="info-value">${new Date(
                                    patient.nextAppointment
                                ).toLocaleDateString()}</div></div>
                            </div>
                            <div class="progress-section">
                                <div class="progress-bar"><div class="progress-fill" style="width: ${
                                    patient.progress || 0
                                }%"></div></div>
                                <div class="progress-text">${patient.sessionsCompleted || 0}/${
                                    patient.totalSessions || 0
                                } sessions completed</div>
                            </div>
                            ${actions}
                        </div>
                    </div>
                `;
            }
        ).join("");

        container.innerHTML = patientCards;


        // Re-attach filters and dropdowns
        this.setupPatientFilters();
        this.populateScheduleDropdowns();
        this.setupCustomAlertForm();

        // Attach action handlers
        container.querySelectorAll("[data-action='delete']").forEach((btn) => {
            btn.addEventListener("click", async() => {
                if (this.currentRole === 'patient') return;
                const id = btn.dataset.id;
                console.log("🗑️ Deleting patient ID:", id); // Debug

                if (!id) {
                    this.showSuccessMessage("❌ No patient ID found!");
                    return;
                }

                const confirmed = await this.showCustomModal("Are you sure you want to delete this patient?");
                if (confirmed) {
                    try {
                        const res = await fetch(`http://localhost:5000/api/patients/${id}`, {
                            method: "DELETE",
                        });

                        console.log("Response status:", res.status); // Debug

                        if (!res.ok) {
                            const text = await res.text();
                            console.error("Backend error response:", text);
                            this.showSuccessMessage("❌ Delete failed: " + text);
                            return;
                        }

                        const result = await res.json();
                        console.log("Delete result:", result);

                        if (result.success) {
                            btn.closest(".patient-card").remove(); // remove instantly
                            this.showSuccessMessage("🗑️ Patient deleted successfully!");
                        } else {
                            this.showSuccessMessage("❌ Failed: " + result.error);
                        }
                    } catch (err) {
                        console.error("❌ Fetch error:", err);
                        this.showSuccessMessage("❌ Error deleting patient (fetch failed)");
                    }
                }
            });
        });

        container.querySelectorAll("[data-action='edit']").forEach((btn) => {
            btn.addEventListener("click", () => {
                if (this.currentRole === 'patient') return;
                const id = btn.dataset.id;
                this.openEditPatientModal(id);
            });
        });

        container.querySelectorAll("[data-action='view']").forEach((btn) => {
            btn.addEventListener("click", () => {
                this.showSuccessMessage(`Viewing details for patient ID: ${btn.dataset.id}`);
            });
        });

        container.querySelectorAll("[data-action='schedule']").forEach((btn) => {
            btn.addEventListener("click", () => {
                this.showSuccessMessage(`Schedule therapy for patient ID: ${btn.dataset.id}`);
            });
        });
    }

    // ---------------- New Therapy Handlers ----------------
    openAddTherapyModal() {
        const modal = document.getElementById("addTherapyModal");
        const form = document.getElementById("addTherapyForm");
        form.reset();
        modal.classList.remove("hidden");
        document.getElementById("cancelAddTherapy").onclick = () => modal.classList.add("hidden");
        form.onsubmit = async(e) => {
            e.preventDefault();
            const newTherapy = {
                name: form.name.value,
                // Removed the 'type' field from the object
                duration: form.duration.value,
                description: form.description.value,
            };
            await apiPost("therapies", newTherapy);
            modal.classList.add("hidden");
            this.loadTherapies();
            this.showSuccessMessage("✅ Therapy added!");
        };
    }

    openEditTherapyModal(id) {
        const modal = document.getElementById("editTherapyModal");
        const form = document.getElementById("editTherapyForm");

        fetch(`http://localhost:5000/api/therapies/${id}`)
            .then(res => res.json())
            .then(t => {
                form.id.value = t._id;
                form.name.value = t.name;
                // Removed populating the 'type' field
                form.duration.value = t.duration;
                form.description.value = t.description || "";
                modal.classList.remove("hidden");
            });

        document.getElementById("cancelEditTherapy").onclick = () =>
            modal.classList.add("hidden");

        form.onsubmit = async(e) => {
            e.preventDefault();
            const updated = {
                name: form.name.value,
                // Removed the 'type' field from the object
                duration: form.duration.value,
                description: form.description.value,
            };
            await apiPut(`therapies/${form.id.value}`, updated);
            modal.classList.add("hidden");
            this.loadTherapies();
            this.showSuccessMessage("✅ Therapy updated!");
        };
    }

    openAddNotificationModal() {
        const modal = document.getElementById("addNotificationModal");
        const form = document.getElementById("addNotificationForm");
        modal.classList.remove("hidden");

        document.getElementById("cancelAddNotification").onclick = () =>
            modal.classList.add("hidden");

        form.onsubmit = async(e) => {
            e.preventDefault();
            const newNotification = {
                message: form.message.value,
                date: new Date(),
            };
            await apiPost("notifications", newNotification);
            modal.classList.add("hidden");
            this.loadNotifications();
            this.showSuccessMessage("✅ Notification added!");
        };
    }

    openEditNotificationModal(id) {
        const modal = document.getElementById("editNotificationModal");
        const form = document.getElementById("editNotificationForm");

        fetch(`http://localhost:5000/api/notifications/${id}`)
            .then(res => res.json())
            .then(n => {
                form.id.value = n._id;
                form.message.value = n.message;
                modal.classList.remove("hidden");
            });

        document.getElementById("cancelEditNotification").onclick = () =>
            modal.classList.add("hidden");

        form.onsubmit = async(e) => {
            e.preventDefault();
            const updated = { message: form.message.value };
            await apiPut(`notifications/${form.id.value}`, updated);
            modal.classList.add("hidden");
            this.loadNotifications();
            this.showSuccessMessage("✅ Notification updated!");
        };
    }

    openEditPatientModal(id) {
        const modal = document.getElementById("editPatientModal");
        const form = document.getElementById("editPatientForm");

        // Load patient data
        fetch(`http://localhost:5000/api/patients/${id}`)
            .then(res => res.json())
            .then(patient => {
                form.id.value = patient._id;
                form.name.value = patient.name;
                form.age.value = patient.age;
                form.condition.value = patient.condition;
                form.dosha.value = patient.dosha;
                modal.classList.remove("hidden");
            });

        document.getElementById("cancelEditPatient").onclick = () =>
            modal.classList.add("hidden");

        form.onsubmit = async(e) => {
            e.preventDefault();
            const updated = {
                name: form.name.value,
                age: form.age.value,
                condition: form.condition.value,
                dosha: form.dosha.value,
            };

            await apiPut(`patients/${form.id.value}`, updated);

            modal.classList.add("hidden");
            this.loadPatients();
            this.showSuccessMessage("✅ Patient updated!");
        };
    }

    setupPatientFilters() {
        const searchInput = document.getElementById('patientSearch');
        const doshaFilter = document.getElementById('doshaFilter');
        const statusFilter = document.getElementById('statusFilter');

        [searchInput, doshaFilter, statusFilter].forEach(element => {
            if (element) {
                element.addEventListener('input', () => this.filterPatients());
            }
        });
    }

    filterPatients() {
        const search = document.getElementById('patientSearch')?.value.toLowerCase() || '';
        const dosha = document.getElementById('doshaFilter')?.value || '';
        const status = document.getElementById('statusFilter')?.value || '';

        const cards = document.querySelectorAll('.patient-card');

        cards.forEach(card => {
            const name = card.querySelector('.patient-name')?.textContent.toLowerCase() || '';
            const patientDosha = card.querySelector('.info-value')?.textContent || '';

            let show = true;

            if (search && !name.includes(search)) show = false;
            if (dosha && !patientDosha.includes(dosha)) show = false;

            card.style.display = show ? 'block' : 'none';
        });
    }

    // ---------------- Schedule ----------------
    loadSchedule() {
        this.generateScheduleCalendar();
        this.loadAIRecommendations();
        this.populateScheduleDropdowns();
    }

    generateScheduleCalendar() {
        const calendar = document.getElementById('scheduleCalendar');
        if (!calendar) return;

        const days = ['Time', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const times = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

        const appointments = {
            'Mon-10:00': { patient: 'Rajesh Kumar', therapy: 'Abhyanga' },
            'Tue-14:00': { patient: 'Priya Sharma', therapy: 'Swedana' },
            'Wed-09:00': { patient: 'Amit Patel', therapy: 'Basti' }
        };

        let calendarHTML = '<div class="calendar-grid">';

        // Header
        days.forEach(day => {
            calendarHTML += `<div class="calendar-header-cell">${day}</div>`;
        });

        // Time slots
        times.forEach(time => {
            calendarHTML += `<div class="calendar-time-slot">${time}</div>`;

            days.slice(1).forEach(day => {
                const key = `${day}-${time}`;
                const appointment = appointments[key];

                calendarHTML += `<div class="calendar-cell" data-time="${time}" data-day="${day}">`;

                if (appointment) {
                    calendarHTML += `
                        <div class="appointment-slot">
                            ${appointment.patient}<br>
                            <small>${appointment.therapy}</small>
                        </div>
                    `;
                }

                calendarHTML += '</div>';
            });
        });

        calendarHTML += '</div>';
        calendar.innerHTML = calendarHTML;
    }

    loadAIRecommendations() {
        const container = document.getElementById('aiSuggestions');
        if (!container) return;

        container.innerHTML = `
            <p class="text-muted" style="text-align: center; padding: 20px;">
                Select patient and therapy above to see AI-powered scheduling recommendations
            </p>
        `;
    }

    // ---------------- Notifications ----------------
    async loadNotifications() {
        const container = document.getElementById("notificationsList");
        if (!container) return;

        const isPatient = this.currentRole === 'patient';
        const notifications = await apiGet("notifications");

        // Clear existing content to prevent duplication
        container.innerHTML = "";

        container.innerHTML = `
            <div class="section-header">
                <h2>Notifications</h2>
                ${!isPatient ? `<button id="addNotificationBtn" class="btn btn--primary btn--sm">+ Add Notification</button>` : ''}
            </div>
            ${notifications
                .map(
                    (n) => {
                        const actions = !isPatient ? `
                            <div class="card-actions">
                                <button class="btn btn--sm btn--danger" data-action="delete" data-id="${n._id}">Delete</button>
                            </div>
                        ` : '';
                        return `
                            <div class="notification-card" data-id="${n._id}">
                                <p>${n.message}</p>
                                <small>${new Date(n.date).toLocaleString()}</small>
                                ${actions}
                            </div>
                        `;
                    }
                )
                .join("")}
        `;

        // Set up the custom alert form logic
        this.setupCustomAlertForm();

        // Add new notification button handler
        const addNotificationBtn = document.getElementById("addNotificationBtn");
        if (addNotificationBtn) {
            addNotificationBtn.onclick = () => {
                this.openAddNotificationModal();
            };
        }

        // Delete handler
        container.querySelectorAll("[data-action='delete']").forEach((btn) => {
            btn.addEventListener("click", async() => {
                if (this.currentRole === 'patient') return;
                const id = btn.dataset.id;
                console.log("🗑️ Deleting notification ID:", id);

                if (!id) {
                    this.showSuccessMessage("❌ No notification ID found!");
                    return;
                }

                const confirmed = await this.showCustomModal("Are you sure you want to delete this notification?");
                if (confirmed) {
                    try {
                        const res = await apiDelete(`notifications/${id}`);

                        if (res.success) {
                            btn.closest(".notification-card").remove();
                            this.showSuccessMessage("🗑️ Notification deleted successfully!");
                        } else {
                            this.showSuccessMessage("❌ Failed: " + res.error);
                        }
                    } catch (err) {
                        console.error("❌ Fetch error:", err);
                        this.showSuccessMessage("❌ Error deleting notification (fetch failed)");
                    }
                }
            });
        });
    }

    // New method to set up the custom alert form
    async setupCustomAlertForm() {
        const isPatient = this.currentRole === 'patient';
        const form = document.getElementById('customNotificationForm');
        if (!form || isPatient) return;

        const patientSelect = form.querySelector('#customAlertRecipient');
        const emailInput = form.querySelector('#customAlertEmail');

        // Fetch and populate all patients
        const patients = await apiGet('patients');

        // Clear existing options
        patientSelect.innerHTML = '<option value="">Select a patient</option>';

        patients.forEach(p => {
            const option = document.createElement('option');
            option.value = p.email; // Use email as value
            option.textContent = p.name;
            patientSelect.appendChild(option);
        });

        // Event listener to update email field when a patient is selected
        patientSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                emailInput.value = e.target.value;
            } else {
                emailInput.value = '';
            }
        });

        // Handle form submission
        form.addEventListener('submit', async(e) => {
            e.preventDefault();
            const patientEmail = emailInput.value;
            const message = form.querySelector('#customAlertMessage').value;
            const subject = 'AyurSutra Notification';

            if (patientEmail && message) {
                const confirmed = await this.showCustomModal(`Sending notification to ${patientEmail} with message: "${message}"`);
                if (confirmed) {
                    console.log(`Sending notification to patient email: ${patientEmail}`);

                    // New API call to the backend email service
                    try {
                        const response = await apiPost('send-email', {
                            to: patientEmail,
                            subject,
                            message
                        });
                        if (response.success) {
                            this.showSuccessMessage('✅ Notification sent successfully!');
                        } else {
                            this.showSuccessMessage('❌ Failed to send email: ' + response.error);
                        }
                    } catch (error) {
                        console.error('Error calling backend API:', error);
                        this.showSuccessMessage('❌ Failed to connect to the email service.');
                    }

                    form.reset();
                }
            } else {
                this.showCustomModal("Please fill out all fields.");
            }
        });
    }

    // ---------------- Analytics entry ----------------
    async loadAnalytics() {
        this.createEffectivenessChart();
        this.createDoshaChart();
        this.createAppointmentsChart();
    }

    // ---------------- Therapies ----------------
    async loadTherapies() {
        const container = document.getElementById("therapiesList");
        if (!container) return;

        const isPatient = this.currentRole === 'patient';
        let therapies = [];
        try {
            therapies = await apiGet("therapies");
        } catch (err) {
            console.error('Failed to fetch therapies:', err);
            container.innerHTML = '<p class="text-muted">Failed to load therapies.</p>';
            return;
        }

        // Clear existing content to prevent duplication
        container.innerHTML = "";
        
        if (therapies.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No therapies found.</p>';
        }

        therapies.forEach((therapy) => {
            const therapyCard = document.createElement('div');
            therapyCard.className = 'therapy-card';
            
            const actions = !isPatient ? `
                <div class="card-actions">
                    <button class="btn btn--sm btn--outline" data-action="edit" data-id="${therapy._id}">Edit</button>
                    <button class="btn btn--sm btn--danger" data-action="delete" data-id="${therapy._id}">Delete</button>
                </div>
            ` : '';

            therapyCard.innerHTML = `
                <h3>${therapy.name}</h3>
                <p><strong>Duration:</strong> ${therapy.duration || 0} days</p>
                <p><strong>Description:</strong> ${therapy.description || ""}</p>
                ${actions}
            `;
            container.appendChild(therapyCard);

            // Attach action handlers
            if (!isPatient) {
                therapyCard.querySelector("[data-action='edit']").addEventListener("click", () => this.openEditTherapyModal(therapy._id));
                therapyCard.querySelector("[data-action='delete']").addEventListener("click", () => this.handleDeleteTherapy(therapy._id));
            }
        });

        // Add new therapy button handler
        const addTherapyBtn = document.getElementById("addTherapyBtn");
        if (addTherapyBtn) {
            addTherapyBtn.onclick = () => this.openAddTherapyModal();
        }
    }

    async handleDeleteTherapy(id) {
        const confirmed = await this.showCustomModal("Are you sure you want to delete this therapy?");
        if (confirmed) {
            try {
                await apiDelete(`therapies/${id}`);
                this.showSuccessMessage("🗑️ Therapy deleted successfully!");
                this.loadTherapies(); // Reload the list
            } catch (err) {
                console.error('Error deleting therapy:', err);
                this.showSuccessMessage("❌ Failed to delete therapy.");
            }
        }
    }

    loadSettings() {
        console.log('Settings view loaded');
    }

    // ---------------- Dropdowns (Schedule) ----------------
    async populateScheduleDropdowns() {
        const patientSelect = document.getElementById('schedulePatient');
        const therapySelect = document.getElementById('scheduleTherapy');

        try {
            const patients = await apiGet("patients");
            const therapies = await apiGet("therapies");

            // Populate Patient Dropdown
            if (patientSelect) {
                patientSelect.innerHTML = '<option value="">Select Patient</option>' +
                    patients.map(p => `<option value="${p._id}">${p.name}</option>`).join('');
            }

            // Populate Therapy Dropdown with API data
            if (therapySelect) {
                therapySelect.innerHTML = '<option value="">Select Therapy</option>' +
                    therapies.map(t => `<option value="${t.name}">${t.name} (${t.duration} days)</option>`).join('');
            }

        } catch (err) {
            console.error('Failed to populate dropdowns:', err);
            this.showSuccessMessage('Failed to load patient or therapy lists.');
        }
    }

    // ---------------- Charts boot ----------------
    initializeCharts() {
        setTimeout(() => {
            this.updateProgressChart();
        }, 200);
    }

    updateProgressChart() {
        const ctx = document.getElementById('progressChart');
        if (!ctx) return;

        if (this.charts.progress) {
            this.charts.progress.destroy();
        }

        this.charts.progress = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
                datasets: [{
                    label: 'Treatment Progress',
                    data: [15, 25, 40, 55, 70, 85],
                    borderColor: '#1FB8CD',
                    backgroundColor: 'rgba(31, 184, 205, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    initializeAnalyticsCharts() {
        this.createEffectivenessChart();
        this.createDoshaChart();
        this.createAppointmentsChart();
    }

    createEffectivenessChart() {
        const ctx = document.getElementById('effectivenessChart');
        if (!ctx) return;

        if (this.charts.effectiveness) {
            this.charts.effectiveness.destroy();
        }

        this.charts.effectiveness = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Abhyanga', 'Udvartana', 'Basti', 'Nasya'],
                datasets: [{
                    label: 'Effectiveness %',
                    data: [95, 88, 92, 85],
                    backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#5D878F']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: { y: { beginAtZero: true, max: 100 } }
            }
        });
    }

    createDoshaChart() {
        const ctx = document.getElementById('doshaChart');
        if (!ctx) return;

        if (this.charts.dosha) {
            this.charts.dosha.destroy();
        }

        this.charts.dosha = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Vata', 'Pitta', 'Kapha', 'Mixed'],
                datasets: [{
                    data: [35, 30, 25, 10],
                    backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#5D878F']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    createAppointmentsChart() {
        const ctx = document.getElementById('appointmentsChart');
        if (!ctx) return;

        if (this.charts.appointments) {
            this.charts.appointments.destroy();
        }

        this.charts.appointments = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Appointments',
                    data: [120, 150, 180, 165, 200, 185],
                    borderColor: '#1FB8CD',
                    backgroundColor: 'rgba(31, 184, 205, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }

    // ---------------- Modals ----------------
    setupModalHandlers() {
        // Add Patient Modal
        const addPatientBtn = document.getElementById('addPatientBtn');
        const addPatientModal = document.getElementById('addPatientModal');
        const cancelPatientBtn = document.getElementById('cancelPatient');

        if (addPatientBtn) {
            addPatientBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (addPatientModal) addPatientModal.classList.remove('hidden');
            });
        }

        if (cancelPatientBtn) {
            cancelPatientBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (addPatientModal) addPatientModal.classList.add('hidden');
            });
        }

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });

        // Close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const modal = btn.closest('.modal');
                if (modal) modal.classList.add('hidden');
            });
        });
    }

    // ---------------- Forms ----------------
    setupFormHandlers() {
        // Add Patient Form
        const addPatientForm = document.getElementById('addPatientForm');
        if (addPatientForm) {
            addPatientForm.addEventListener('submit', async(e) => {
                e.preventDefault();
                await this.handleAddPatient(new FormData(addPatientForm));
            });
        }
    }

    // ---------------- Patients (Add) ----------------
    async handleAddPatient(formData) {
        const newPatient = {
            name: formData.get("name"),
            age: parseInt(formData.get("age")),
            condition: formData.get("condition"),
            dosha: formData.get("dosha"),
            progress: 0,
            sessionsCompleted: 0,
            totalSessions: 10,
            therapies: [],
            nextAppointment: new Date(Date.now() + 86400000), // tomorrow
            email: `${formData.get("name").toLowerCase().replace(" ", ".")}@email.com`,
            phone: "+91 9876543XXX",
        };

        try {
            await apiPost("patients", newPatient); // save to DB

            const modal = document.getElementById("addPatientModal");
            if (modal) modal.classList.add("hidden");

            await this.loadPatients();
            this.setupCustomAlertForm();
            this.showSuccessMessage("✅ Patient added successfully!");

            // Add this line to refresh the dashboard appointments
            this.loadUpcomingAppointments();

            // Also update the total patients count on the dashboard
            this.updateDashboardStats();

        } catch (err) {
            console.error(err);
            this.showSuccessMessage("❌ Failed to add patient");
        }
    }


    async handleQuickSchedule(formData) {
        const schedule = {
            patient: formData.get("schedulePatient"),
            therapy: formData.get("scheduleTherapy"),
            date: formData.get("scheduleDate"),
        };

        try {
            await apiPost("notifications", {
                type: "appointment_reminder",
                title: "New Therapy Scheduled",
                message: `${schedule.therapy} scheduled for ${schedule.patient} on ${schedule.date}`,
                channel: "System",
                status: "pending",
                patient: schedule.patient,
            });

            this.showSuccessMessage("✅ Therapy scheduled!");
        } catch (err) {
            console.error(err);
            this.showSuccessMessage("❌ Failed to schedule therapy");
        }
    }

    // ---------------- AI Suggestions ----------------
    async showAISchedulingSuggestions(patientId, therapyName, date) {
        const container = document.getElementById('aiSuggestions');
        if (!container) return;

        const patients = await apiGet("patients");
        const therapies = await apiGet("therapies");

        const patient = patients.find(p => p._id === patientId);
        const therapyInfo = therapies.find(t => t.name === therapyName);

        const suggestions = [
            `✅ Optimal time: 10:00 AM (${patient?.dosha || 'patient'} constitution benefits from morning sessions)`,
            `🏥 Recommended room: Room 2 (equipped for ${therapyName})`,
            `👨‍⚕️ Best practitioner: Dr. Anil Gupta (available, specializes in ${therapyName})`,
            `⏱️ Estimated duration: ${therapyInfo?.duration || 0} days`,
            `📋 Pre-procedure: ${therapyInfo?.preparation || '—'}`,
            `🔄 Follow-up scheduling: Auto-schedule next session in 3 days`
        ];

        container.innerHTML = `
            <div style="margin-bottom: 16px;">
                <h4 style="margin: 0 0 12px 0; color: var(--color-primary);">🤖 AI Scheduling Recommendations</h4>
            </div>
            ${suggestions.map(suggestion => `
                <div class="ai-suggestion">${suggestion}</div>
            `).join('')}
            <div style="margin-top: 16px; display: flex; gap: 8px;">
                <button class="btn btn--primary btn--sm">Confirm Schedule</button>
                <button class="btn btn--outline btn--sm">Modify</button>
            </div>
        `;
    }

    async handleCustomNotification() {
        const form = document.getElementById('customNotificationForm');
        const patientName = form.querySelector('#customAlertRecipient').value;
        const patientEmail = form.querySelector('#customAlertEmail').value;
        const message = form.querySelector('#customAlertMessage').value;
        const subject = 'AyurSutra Notification';

        if (!patientName || !patientEmail || !message) {
            this.showCustomModal("Please fill out all fields.");
            return;
        }

        const confirmed = await this.showCustomModal(`Sending notification to ${patientEmail} with message: "${message}"`);
        if (confirmed) {
            try {
                const response = await apiPost('send-email', {
                    to: patientEmail,
                    subject: 'AyurSutra Notification',
                    message: message
                });
                if (response.success) {
                    this.showSuccessMessage('✅ Notification sent successfully!');
                } else {
                    this.showSuccessMessage('❌ Failed to send email: ' + response.error);
                }
            } catch (error) {
                console.error('Error calling backend API:', error);
                this.showSuccessMessage('❌ Failed to connect to the email service.');
            }

            form.reset();
        }
    }

    // ---------------- Tabs ----------------
    setupTabHandlers() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = btn.dataset.tab;
                this.showTab(tabName, btn.parentElement);
            });
        });
    }

    showTab(tabName, container) {
        // Remove active class from all tabs in this container
        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to clicked tab
        const activeBtn = container.querySelector(`[data-tab="${tabName}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        // Hide all tab contents in this section
        const section = container.closest('.analytics-container, .settings-container');
        if (section) {
            section.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });

            // Show selected tab content
            const targetContent = section.querySelector(`#${tabName}Tab`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        }
    }

    // ---------------- Notifications panel toggle ----------------
    toggleNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.classList.toggle('hidden');
        }
    }

    // ---------------- Utils ----------------
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours} hours ago`;
        const days = Math.floor(hours / 24);
        return `${days} days ago`;
    }

    showSuccessMessage(message) {
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: var(--color-success);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1001;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    /**
     * Displays a custom confirmation modal and returns a promise
     * @param {string} message The message to display in the modal body.
     * @returns {Promise<boolean>} A promise that resolves to true if confirmed, false otherwise.
     */
    showCustomModal(message) {
        return new Promise(resolve => {
            const modal = document.getElementById('customModal');
            const modalMessage = document.getElementById('customModalMessage');
            const confirmBtn = document.getElementById('customModalConfirm');
            const cancelBtn = document.getElementById('customModalCancel');
            const closeBtn = modal.querySelector('.modal-close');

            modalMessage.textContent = message;
            modal.classList.remove('hidden');

            const onConfirm = () => {
                modal.classList.add('hidden');
                removeListeners();
                resolve(true);
            };

            const onCancel = () => {
                modal.classList.add('hidden');
                removeListeners();
                resolve(false);
            };

            const removeListeners = () => {
                confirmBtn.removeEventListener('click', onConfirm);
                cancelBtn.removeEventListener('click', onCancel);
                closeBtn.removeEventListener('click', onCancel);
            };

            confirmBtn.addEventListener('click', onConfirm);
            cancelBtn.addEventListener('click', onCancel);
            closeBtn.addEventListener('click', onCancel);
        });
    }
} // end class AyurSutraApp

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ayurSutraApp = new AyurSutraApp();
});

// Add CSS animation for success notification
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);
